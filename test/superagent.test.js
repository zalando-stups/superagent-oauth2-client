import superagent from 'superagent';
import patchSuperagent from '../src/superagent';
import {Provider, MemoryStorage} from 'oauth2-client';

describe('superagent', () => {
    var request, provider;
    
    beforeEach(() => {
        provider = new Provider({
            id: 'test',
            authorization_url: 'test',
            store: new MemoryStorage()
        });
        request = patchSuperagent(superagent);
    });

    afterEach(() => {
        request = null;
    });

    // it('#exec() should return a promise', () => {
    //     let req = request
    //                 .get('some.whe.re')
    //                 .exec();
    //     expect(req instanceof Promise).to.be.true;
    // });

    it('#exec() should apply and save metadata', (done) => {
        let req = request
                    .get('buuh')
                    .oauth(provider)
                    .exec({
                        client_id: '123',
                        redirect_uri: 'localhost'
                    }, () => ({
                        timestamp: 123
                    }));
        expect(req instanceof Promise).to.be.true;
        req.catch(req => {
            expect(req.metadata.timestamp).to.equal(123);
            expect(provider.store.get(req.state).metadata).to.be.ok;
            expect(provider.store.get(req.state).metadata.timestamp).to.equal(123);
            done();
        });
    });

    it('#oauth() should enable oauth', () => {
        let req = request
                    .get('some.wh.at')
                    .oauth(provider);

        expect(req._oauthProvider).to.equal(provider);
        expect(req._oauthEnabled).to.be.true;
    });

    // it('#oauth() should use an available access token', (done) => {        
    //     provider.setAccessToken('token');

    //     let req = request
    //                 .get('testlocation')
    //                 .oauth(provider);

    //     req.end = function() {
    //         //TODO this is quite implementation-specific ;_;
    //         expect( this._header.authorization ).to.equal('Token token');
    //         done();
    //     };

    //     req.exec();
    // });
});