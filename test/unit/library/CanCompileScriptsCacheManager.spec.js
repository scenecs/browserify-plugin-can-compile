
/**
 * @module browserify-plugin-can-compile
 * @author scenecs <scenecs@t-online.de>
 * @license MIT
 */
const chai = require('chai');
const CanCompileScriptsCacheManager = require('../../../library/CanCompileScriptsCacheManager');

chai.should();
chai.config.includeStack = true;

describe('CanCompileScriptsCacheManager', function () {
    afterEach(function () {
        CanCompileScriptsCacheManager.instance = undefined;
    });

    it('instantiate a new instance, with an empty cache object', function () {
        const instance = new CanCompileScriptsCacheManager();

        (instance.caches).should.be.deep.equal({});
    });

    describe('.getInstance()', function () {
        it('create or return a singleton', function () {
            const instance = CanCompileScriptsCacheManager.getInstance();
            const instance2nd = CanCompileScriptsCacheManager.getInstance();

            instance.testHierMal = 12345;

            instance.should.be.deep.equal(instance2nd);
        });
    });

    describe('#createCache(version, options)', function () {
        describe('validate passed parameter', function () {
            const tests = [
                { args: [], label: 'empty' },
                { args: [undefined], label: 'undefined' },
                { args: [null], label: 'null' },
                { args: [[]], label: 'an array' },
                { args: [{}], label: 'an object' },
                { args: ['string'], label: 'an invalid version' }
            ];

            tests.forEach((test) => {
                it(`version and throw an exception, if the passed value is "${test.label}"`, function () {
                    const instance = CanCompileScriptsCacheManager.getInstance();

                    (() => Reflect.apply(instance.createCache, instance, test.args))
                        .should.throw(/The passed version is not valid/);
                });
            });
        });
    });
});
