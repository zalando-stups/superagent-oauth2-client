import superagent from 'superagent';
import patchSuperagent from '../src/superagent';
import {Provider, MemoryStorage} from 'oauth2-client-js';
import querystring from 'querystring';

// process.on('uncaughtException', function(err) {
//     console.log('Caught exception: ' + err.stack);
// });

var request = patchSuperagent(superagent);
const TESTLOCATION = 'http://localhost';
const DEFAULT_REQUEST = {
    client_id: 'client_id',
    redirect_uri: 'localhost'
};

describe('superagent-oauth2-client', () => {
    var provider, mitm;
    
    beforeEach(() => {
        provider = new Provider({
            id: 'test',
            authorization_url: 'http://localhost/auth',
            storage: new MemoryStorage()
        });
        mitm = Mitm();
    });

    afterEach(() => {
        mitm.disable();
    });

    it('#oauth() should enable oauth', () => {
        let req = request
                    .get(TESTLOCATION)
                    .oauth(provider);

        expect(req._oauthProvider).to.equal(provider);
        expect(req._oauthEnabled).to.be.true;
    });

    it('#exec() should return a promise', () => {
        let req = request
                    .get(TESTLOCATION)
                    .exec();
        expect(req instanceof Promise).to.be.true;
    });

    it('#exec() should apply and save metadata', (done) => {
        let req = request
                    .get(TESTLOCATION)
                    .oauth(provider, DEFAULT_REQUEST)
                    .exec(req => req.metadata.timestamp = 123);
        
        expect(req instanceof Promise).to.be.true;
        req.catch(auth => {
            let saved = provider.storage.get(auth.state);
            expect(saved).to.be.ok;
            expect(auth.metadata.timestamp).to.equal(123);
            expect(saved.metadata).to.be.ok;
            expect(saved.metadata.timestamp).to.equal(123);
            done();
        });
    });


    it('#exec() should use an available access token', done => {        
        provider.setAccessToken('token');

        let req = request
                    .get(TESTLOCATION)
                    .oauth(provider, DEFAULT_REQUEST);

        mitm.on('request', function(req, res) {
            expect(req.headers.authorization).to.equal('Bearer token');
            done();
        });

        req.exec();
    });

    it('#exec() should reject if it encounters an error other than 401', done => {
        provider.setAccessToken('token');
        var req = request
                    .get(TESTLOCATION)
                    .oauth(provider, DEFAULT_REQUEST);

        // mock error server response
        mitm.on('request', function(req, res) {
            res.statusCode = 503;
            res.end();
        });

        req.exec().catch(e => {
            expect(e.status).to.equal(503);
            done();
        });
    });

    it('#exec() should issue a proper auth request', done => {
        var req = request
                    .get(TESTLOCATION)
                    .oauth(provider, DEFAULT_REQUEST);

        req.exec().catch(auth => {
            expect(auth.response_type).to.equal('token');
            expect(auth.client_id).to.equal('client_id');
            expect(auth.redirect_uri).to.equal('localhost');
            expect(auth.state).to.be.ok;
            done();
        });
    });

    it('#exec() should issue an auth request if there is no refresh token', done => {
        var req = request
                    .get(TESTLOCATION)
                    .oauth(provider, DEFAULT_REQUEST);
        provider.setAccessToken('access_token');

        mitm.on('request', function(req, res) {
            res.statusCode = 401;
            res.end();
        });

        req.exec().catch(auth => {
            expect(auth.client_id).to.equal('client_id');
            expect(auth.redirect_uri).to.equal('localhost');
            expect(auth.state).to.be.ok;
            done();
        });
    });

    it('#exec() should request a new access token with an available refresh token', done => {
        var req = request
                    .get(TESTLOCATION)
                    .oauth(provider, DEFAULT_REQUEST);
        provider.setAccessToken('access_token');
        provider.setRefreshToken('refresh_token');

        mitm.on('request', function(req, res) {
            if (req.url.startsWith('/auth')) {
                res.statusCode = 200;
                let state = querystring.parse(req.url.substring('/auth?'.length)).state;
                let resp = {
                    state: state,
                    token_type: 'access',
                    access_token: 'new_access',
                    refresh_token: 'new_refresh'
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(resp));
            } else {
                let returnError = req.headers.authorization === 'Bearer access_token';
                res.statusCode = returnError ? 401 : 200;
                let errorResp = {
                    error: 'invalid'
                };
                let resp = {
                    data: 123
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(returnError ? errorResp : resp));
            }
        });

        req
        .exec()
        .then(resp => {
            expect(resp.body.data).to.equal(123);
            done();
        })
        .catch(e => {
            console.log(e.stack);
        });
    });
});