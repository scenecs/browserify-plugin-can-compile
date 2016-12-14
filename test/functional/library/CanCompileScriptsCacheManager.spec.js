
/**
 * @module browserify-plugin-can-compile
 * @author scenecs <scenecs@t-online.de>
 * @license MIT
 */
const chai = require('chai');
const path = require('path');
const del = require('del');
const CanCompileScriptsCacheManager = require('../../../library/CanCompileScriptsCacheManager');

const CACHE_DIR_NAME = path.resolve(process.cwd(), '.test_functional_can_compile_cache');
const version = '2.3.23';

chai.should();
chai.config.includeStack = true;

describe('CanCompileScriptsCacheManager', function () {
    afterEach(function () {
        return new Promise((resolve, reject) => {
            CanCompileScriptsCacheManager.instance = undefined;
            del([CACHE_DIR_NAME])
                .then(resolve, reject)
                .catch(reject);
        });
    });

    describe('#createCache(version, options)', function () {
        it('return a instance of Promise, if the version is valid', function () {
            return new Promise((resolve, reject) => {
                const cachePromise = CanCompileScriptsCacheManager
                    .getInstance()
                    .createCache(version, { cachePath: path.resolve(CACHE_DIR_NAME, version) });

                (cachePromise).should.an.instanceOf(Promise);
                cachePromise
                    .then(resolve, reject)
                    .catch(reject);
            });
        });

        it('use cached vendor scripts', function () {
            return new Promise((resolve, reject) => {
                Promise.all([
                    CanCompileScriptsCacheManager.getInstance().createCache(version),
                    CanCompileScriptsCacheManager.getInstance().createCache(version)
                ])
                    .then((filesArray) => {
                        (filesArray[0]).should.be.deep.equal(filesArray[1]);
                        (Object.keys(CanCompileScriptsCacheManager.getInstance().caches).length).should.be.equal(1);
                        resolve();
                    }, reject)
                    .catch(reject);
            });
        });
    });
});
