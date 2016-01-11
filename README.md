# superagent-oauth2-client

[![Build Status](http://img.shields.io/travis/zalando/superagent-oauth2-client.svg)](https://travis-ci.org/zalando/superagent-oauth2-client) [![Coverage Status](https://coveralls.io/repos/zalando/superagent-oauth2-client/badge.svg)](https://coveralls.io/r/zalando/superagent-oauth2-client)

[![Join the chat at https://gitter.im/zalando/superagent-oauth2-client](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/zalando/superagent-oauth2-client?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A superagent plugin for stressless OAuth2 token management using [oauth2-client](https://github.com/zalando/oauth2-client).

## Installation

    npm i --save @zalando/superagent-oauth2-client

## Usage

    var superagent = require('superagent'),
        request = require('@zalando/superagent-oauth2-client')(superagent),
        OAuth = require('@zalando/oauth2-client-js');

    // define a single oauth provider
    // will use localstorage to save tokens
    var provider = new OAuth.Provider({
        id: 'google',
        authorization_url: 'https://google.com/auth'
    });
    
    request
        .get('http://server.com')
        .oauth(provider, {
            redirect_uri: '...',
            client_id: 'client_id'
        })
        .exec()
        .then()      // business logic
        .catch();    // error handling

`then` will only be called when the original request was successful, no matter if the first or the second time.

`catch` may be called for varying reasons. We may have used a valid token, but the server responded with an error. Or we might just be about to redirect the user to the auth endpoint.

## How does it work

`.oauth()` hides almost all the magic from you. What is this magic?

When you do a request it will first look if the provider has an access token. If it does, it will set it on the `Authorization` header and send the request. If it doesn’t, it will automatically redirect to the authorization_url (ie. `window.location.href=xxx`).

In the happy case the user logged in, gave its consent and will be redirected to the redirect_uri in your app. There is some manual work to do now, you have to parse the encoded response and react accordingly.

    var response = provider.parse(window.location.href);

It it doesn’t throw an error, everything’s good now.

If there was an access token, but it’s considered invalid (=> server returns `401` status), `.oauth` will redirect the user to the auth endpoint again.

## How to save application state

You can pass a function to `exec()` that will be passed the oauth access token request that’s about to be issued. There you can set arbitrary things in the `metadata` field. This will be again available after you the reponse was parsed successfully.

    request
        ...
        .exec(function(req) {
            req.metadata.time = Date.now();
            req.metadata.currentRoute = window.location.path;
        })
        .then...

    var response = provider.parse(window.location.href);
    navigateTo(response.metadata.currentRoute);

## License

Apache 2.0 as stated in the [LICENSE](LICENSE).
