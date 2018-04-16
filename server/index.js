const express = require('express')
const Provider = require('oidc-provider')

const app = express()

/**
 * go to http://localhost:3000/.well-known/openid-configuration path
 * disco doc: allow client applications to automatically integrate with an OpenID Provider, 
 * without the need for manual configuration or formal metadata exchange.
 * Allows client applications to find the location of the various OpenID Connect endpoints and 
 * what configurations it supports such as grant types, response types, claims types and scopes.
 */

const issuer = 'http://localhost:3000' // name of our issuer, the authority that will issue tokens to client applications

/**
 * To verify that a JSON Web Token (JWT) hasn’t been tampered with, 
 * we digitally sign the token with a private key and then later verify that signature using a public key. 
 * This certificate should be separate from your TLS certificate, and doesn’t need to be publicly verifiable 
 * (i.e. not issued by a public CA). By default oidc-provider uses the dev_keystore, 
 * which includes a hard-coded key for signing tokens. 
 * This private key isn’t suitable for production because, as the name suggests, it should be private. 
 * With the key on GitHub it is no longer private, 
 * meaning anyone with this key will be able to issue tokens as if they were your identity provider.
 */

const { createKeyStore } = require('oidc-provider')
const keystore = createKeyStore()
keystore.generate('RSA', 2048, {
    alg: 'RS256',
    use: 'sig',
}).then(function () {
    // We can view the public keys using for token signing on the jwks_uri endpoint defined in our discovery document.
    console.log('this is the full private JWKS:\n', keystore.toJSON(true))
})

/**
 * A client represents an application that uses our identity provider 
 * (a client is also known in other specifications as a relying party or service provider). 
 * OpenID Connect uses a whitelist style system, 
 * so all applications must first be registered before they can request access our protected resources.
 */

const clients = [{
    client_id: 'test_implicit_app',
    // implicit grant type, suitable for SPAs or other client-side applications that cannot keep a secret
    // When using the implicit grant, all tokens will pass via the browser, so treat your tokens accordingly.
    grant_types: ['implicit'],
    response_types: ['id_token'],
    // Our redirect uri is where any tokens will be sent to once authorized by a user.
    redirect_uris: ['https://testapp/signin-oidc'],
    // When using the implicit flow, oidc-provider has a hardcoded check against the use of http & localhost.
    // We must also ensure that the token endpoint is disabled for the client.
    /**
     * when integrating with your client application, make sure you are using the https scheme 
     * and anything other than localhost (something configured via your hosts file works fine), 
     * and set the clients token_endpoint_auth_method property to none
     */
    token_endpoint_auth_method: 'none'
}]

const oidc = new Provider(issuer)
oidc.initialize({ clients })
    .then(function () {
        app.use('/', oidc.callback)
        app.listen(3000)
    })
