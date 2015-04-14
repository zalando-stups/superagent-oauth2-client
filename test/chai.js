import chai from 'chai';
import Mitm from 'mitm';

chai.config.includeStack = true;

global.Mitm = Mitm;
global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;
global.ENV_PRODUCTION = false;
