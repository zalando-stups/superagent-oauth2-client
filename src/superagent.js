import {Request} from 'oauth2-client-js';

export default function(superagent) {
    /**
     * Just like superagent.end, but returning a promise.
     *
     * @return {Promise}
     */
    function exec() {
        return new Promise((resolve, reject) => {
            this.end((error, res) => {
                if (error) {
                    return reject(error);
                }
                resolve(res);
            });
        });
    }

    superagent.Request.prototype.exec = function(applyMetadataFn) {
        // if this request doesn't have oauth enabled,
        // just execute itgw
        if (!this._oauthEnabled) {
            return exec.call(this);
        }
        return new Promise((resolve, reject) => {

            function requestAccessToken() {
                // no token. we need to request one
                let authRequest = new Request(this._oauthRequestConfig);
                if (applyMetadataFn) {
                    applyMetadataFn(authRequest);
                }
                let redirectionUri = this._oauthProvider.requestToken(authRequest);
                // remember this request for later when we get a response
                this._oauthProvider.remember(authRequest);
                // request is done via redirect to auth provider
                reject(authRequest);
                if (ENV_PRODUCTION) {
                    window.location.href = redirectionUri;
                }
            }

            let provider = this._oauthProvider;
            // otherwise we need to
            // - check if we have a token for this provider in our storage
            if (provider.hasAccessToken()) {
                // there is a token and WE WILL USE IT FOR FUCKS SAKE
                // it might be invalid tho

                // set appropriate header
                this.set('Authorization', `Token ${provider.getAccessToken()}`);
                // execute request
                exec
                    .call(this)
                    .then(resolve)  // token was apparently ok
                    .catch(err => {
                        if (err.status === 401 ) {
                            // Unauthorized
                            
                            if (provider.hasRefreshToken()) {
                                superagent
                                    .get(provider.refreshToken())
                                    .exec()
                                    .then(resp => {
                                        try {
                                            provider.handleResponse(resp);
                                            this
                                                .exec(applyMetadataFn)
                                                .then(resolve)
                                                .catch(e => reject(e));
                                        } catch(handleResponseError) {
                                            reject(handleResponseError);
                                        }
                                        
                                    })
                                    .catch(reject);
                            } else {
                                // No refresh token, we need to request a new access token
                                requestAccessToken.call(this);
                            }
                        } else {
                            // We got an error, but the token appears to be valid
                            // reject and pass the error
                            reject(err);
                        }
                    });
            } else {
                requestAccessToken.call(this);
            }
        });
    };

    /**
     * Tell superagent to use a specific oauth provider.
     *
     * @param  {OAuthProvider} provider
     * @return {self} superagent
     */
    superagent.Request.prototype.oauth = function(provider, requestConfig) {
        this._oauthEnabled = true;
        this._oauthProvider = provider;
        this._oauthRequestConfig = requestConfig;
        return this;
    };

    return superagent;
};