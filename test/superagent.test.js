import superagent from 'superagent';
import patchSuperagent from '../src/superagent';
import {Provider, MemoryStorage} from 'oauth2-client-js';

describe('superagent-oauth2-client', () => {
    var request, provider;
    
    beforeEach(() => {
        provider = new Provider({
            id: 'test',
            authorization_url: 'localhost/test',
            store: new MemoryStorage()
        });
        request = patchSuperagent(superagent);
    });

    afterEach(() => {
        request = null;
    });

    it('#oauth() should enable oauth', () => {
        let req = request
                    .get('some.wh.at')
                    .oauth(provider);

        expect(req._oauthProvider).to.equal(provider);
        expect(req._oauthEnabled).to.be.true;
    });

    it('#exec() should return a promise', () => {
        let req = request
                    .get('some.whe.re')
                    .exec();
        expect(req instanceof Promise).to.be.true;
    });

    it('#exec() should apply and save metadata', (done) => {
        let req = request
                    .get('buuh')
                    .oauth(provider, {
                        client_id: '123',
                        redirect_uri: 'localhost'
                    })
                    .exec(req => req.metadata.timestamp = 123);
        expect(req instanceof Promise).to.be.true;
        req.catch(req => {
            expect(req.metadata.timestamp).to.equal(123);
            expect(provider.store.get(req.state).metadata).to.be.ok;
            expect(provider.store.get(req.state).metadata.timestamp).to.equal(123);
            done();
        });
    });


    it('#exec() should use an available access token', (done) => {        
        provider.setAccessToken('token');

        nock('testlocation').get('/').reply(200);

        let req = request
                    .get('testlocation')
                    .oauth(provider, {
                        client_id: 'client_id',
                        redirect_uri: 'localhost'
                    });

        req.end = function() {
            //TODO this is quite implementation-specific ;_;
            console.log(this._header);
            expect( this._header.authorization ).to.equal('Token token');
            done();
        };

        req.exec();
    });

    it('#exec() should reject if it encounters an error other than 401', done => {
        provider.setAccessToken('token');
        var req = request
                    .get('testlocation')
                    .oauth(provider, {
                        client_id: 'client',
                        redirect_uri: 'localhost'
                    });

        // mock error server response
        req.end = function(cb) {
            let errorResp = {
                status: 503
            };
            cb(errorResp);
        };

        req.exec().catch(() => done());
    });

    it('#exec() should issue a proper auth request', done => {
        var req = request
                    .get('testlocation')
                    .oauth(provider, {
                        client_id: 'client_id',
                        redirect_uri: 'localhost'
                    });

        req.exec().catch(auth => {
            expect(auth.client_id).to.equal('client_id');
            expect(auth.redirect_uri).to.equal('localhost');
            expect(auth.state).to.be.ok;
            done();
        });
    });

    it('#exec() should issue an auth request if there is no refresh token', done => {
        var req = request
                    .get('testlocation')
                    .oauth(provider, {
                        client_id: 'client_id',
                        redirect_uri: 'localhost'
                    });
        provider.setAccessToken('access_token');

        req.end = function(cb) {
            cb({
                status: 401,
                body: {
                    error: 'invalid_request'
                }
            });
        };

        req.exec().catch(auth => {
            expect(auth.client_id).to.equal('client_id');
            expect(auth.redirect_uri).to.equal('localhost');
            expect(auth.state).to.be.ok;
            done();
        });
    });

    it('#exec() should request a new access token with an available refresh token', done => {
        var req = request
                    .get('testlocation')
                    .oauth(provider, {
                        client_id: 'client_id',
                        redirect_uri: 'localhost'
                    });
        provider.setAccessToken('access_token');
        provider.setRefreshToken('refresh_token');

        var _exec = req.exec;
        req.exec = function exec() {
            return _exec.call(this);
        };

        req.end = function(cb) {
            cb({
                status: 401,
                body: {
                    error: 'invalid_request'
                }
            });
        };

        req.exec().catch(err => {
            let {error} = err.response;
            expect(error.url.indexOf('grant_type=refresh_token') >= 0).to.be.true;
            expect(error.url.indexOf('refresh_token=refresh_token') >= 0).to.be.true;
            done();
        });

    });
});