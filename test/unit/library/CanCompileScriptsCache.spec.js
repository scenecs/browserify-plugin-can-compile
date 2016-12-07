/* eslint-env node, mocha */
/**
 * @module browserify-plugin-can-compile
 * @author scenecs <scenecs@t-online.de>
 * @license MIT
 */
const chai = require('chai');
const CanCompileScriptsCache = require('../../library/CanCompileScriptsCache');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const del = require('del');
const CACHE_DIR_NAME = 'node_modules/.can_compile_cache';
const version = '2.3.24';

chai.should();

/** ***********************************************************************************************
 *
 * Mocked Functions/ Classes
 * ==========================
 *
 */
const downloadVendorScriptOriginal = CanCompileScriptsCache.downloadVendorScript;
const downloadVendorScriptMocked = function downloadVendorScriptMocked(url, target) {
    return new Promise((resolve, reject) => {
        fs.writeFile(target, 'Dummyfile', (error) => {
            if (error) {
                return reject(error);
            }

            return resolve(target);
        });
    });
};

CanCompileScriptsCache.downloadVendorScript = downloadVendorScriptMocked;

const createCacheDummyFiles = function createCacheDummyFiles(testCacheDir) {
    mkdirp.sync(testCacheDir);

    return Promise.all([
        // create "jquery.min.js" Dummy
        new Promise((resolve, reject) => fs.writeFile(
            path.resolve(testCacheDir, 'dummy.jquery.min.js'), 'Dummyfile', (error) => {
                if (error) {
                    return reject(error);
                }

                return resolve();
            })
        ),

        // create "can.jquery.js" Dummy
        new Promise((resolve, reject) => fs.writeFile(
            path.resolve(testCacheDir, 'dummy.can.jquery.js'), 'Dummyfile', (error) => {
                if (error) {
                    return reject(error);
                }

                return resolve();
            })
        ),

        // create "can.ejs.js" Dummy
        new Promise((resolve, reject) => fs.writeFile(
            path.resolve(testCacheDir, 'dummy.can.ejs.js'), 'Dummyfile', (error) => {
                if (error) {
                    return reject(error);
                }

                return resolve();
            })
        ),

        // create "can.stache.js" Dummy
        new Promise((resolve, reject) => fs.writeFile(
            path.resolve(testCacheDir, 'dummy.can.stache.js'), 'Dummyfile', (error) => {
                if (error) {
                    return reject(error);
                }

                return resolve();
            })
        )
    ]);
};

/* ********************************************************************************************** */

describe('CanCompileScriptsCache', () => {
    it('throw an error, if the class is instantiating with an invalid version', () => {
        (() => (new CanCompileScriptsCache())).should.throw(/The passed version is not valid/);
        (() => (new CanCompileScriptsCache('foo'))).should.throw(/The passed version is not valid/);
        (() => (new CanCompileScriptsCache([]))).should.throw(/The passed version is not valid/);
        (() => (new CanCompileScriptsCache({}))).should.throw(/The passed version is not valid/);
        (() => (new CanCompileScriptsCache(1.3))).should.throw(/The passed version is not valid/);
    });

    it('return a valid instance, if the a valid parameter "version" is passed', () => {
        (new CanCompileScriptsCache('2.3.25')).should.be.an.instanceof(CanCompileScriptsCache);
    });

    describe('#getVersion()', () => {
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(() => {
            instance = undefined;
        });

        it('return the version passed at instantiation', () => {
            (instance.getVersion()).should.be.a.string(version);
        });
    });

    describe('#setCachePath([path])', () => {
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(() => {
            instance = undefined;
        });

        it(`no parameter "path" is passed, so concatinate the "current working directory", the
                default CACHE_DIR_NAME and the current set version and store the path into the
                instance property "cachePath"`, () => {
            (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, version));
        });

        it(`an invalid parameter "path" is passed, so concatinate the "current working directory",
                the default CACHE_DIR_NAME and the current set version and store the path into the
                instance property "cachePath"`, () => {
            instance.setCachePath('');
            (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, version));

            instance.setCachePath({ foo: 'bar' });
            (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, version));

            instance.setCachePath([1, 2, 3]);
            (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, version));
        });

        it('set a custom path and store this path into the instance property "cachePath"', () => {
            const testCacheDir = path.resolve(process.cwd(), `test_${CACHE_DIR_NAME}`, version);

            instance.setCachePath(testCacheDir);
            (instance.getCachePath()).should.be.a.string(testCacheDir);
        });

        it('is chainable', () => {
            const instanceFromChain = instance.setCachePath();

            (instanceFromChain).should.be.eql(instance);
        });
    });

    describe('#getCachePath()', () => {
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(() => {
            instance = undefined;
        });

        it('returns the path to the cached files of the current set version 2.3.24', () => {
            (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, '2.3.24'));
        });
    });

    describe('#getNeededVendorScripts()', () => {
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(() => {
            instance = undefined;
        });

        it('return an empty array, if the needed vendor scripts are not set', () => {
            instance.neededVendorScripts = [];
            (instance.getNeededVendorScripts()).should.be.eql([]);

            instance.neededVendorScripts = null;
            (instance.getNeededVendorScripts()).should.be.eql([]);

            instance.neededVendorScripts = undefined;
            (instance.getNeededVendorScripts()).should.be.eql([]);
        });

        it('return a list of the needed vendor scripts', () => {
            (instance.getNeededVendorScripts()).should.be.eql(instance.neededVendorScripts);
        });
    });

    describe('#setNeededVendorScripts(urlList)', () => {
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(() => {
            instance = undefined;
        });

        it('do nothing, if parameter "urlList" is not an array', () => {
            const neededVendorScripts = instance.getNeededVendorScripts();

            instance.setNeededVendorScripts();
            (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);

            instance.setNeededVendorScripts('');
            (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);

            instance.setNeededVendorScripts({});
            (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);
        });

        it('overwrite the instance property "neededVendorScripts" with the passed parameter "urlList"', () => {
            instance.setNeededVendorScripts([1, 2, 3]);
            (instance.getNeededVendorScripts()).should.be.eql([1, 2, 3]);
        });

        it('is chainable', () => {
            const instanceFromChain = instance.setNeededVendorScripts([1, 2, 3]);

            (instanceFromChain).should.be.eql(instance);
        });
    });

    describe('#setCachedFiles()', () => {
        const fileList = [
            './test1.js',
            './test2.js',
            './test3.js'
        ];
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(() => {
            instance = undefined;
        });

        it(`the instance property "cachedFiles" has not been touched, if setCachedFiles is called
                with an invalid value`, () => {
            const cachedFilesBefore = instance.cachedFiles;

            instance.setCachedFiles();
            (instance.cachedFiles).should.be.eql(cachedFilesBefore);

            instance.setCachedFiles('Foo');
            (instance.cachedFiles).should.be.eql(cachedFilesBefore);

            instance.setCachedFiles({ foo: 'bar' });
            (instance.cachedFiles).should.be.eql(cachedFilesBefore);
        });

        it('the instance property "cachedFiles" constains the passed file list', () => {
            instance.setCachedFiles(fileList);
            (instance.cachedFiles).should.be.eql(fileList);
        });

        it('is chainable', () => {
            const instanceFromChain = instance.setNeededVendorScripts([1, 2, 3]);

            (instanceFromChain).should.be.eql(instance);
        });
    });

    describe('#getCachedFiles()', () => {
        const fileList = [
            './test2.1.js',
            './test2.2.js',
            './test2.3.js'
        ];
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(() => {
            instance = undefined;
        });

        it('return a list of local file paths of the cached vendor scripts', () => {
            instance.cachedFiles = fileList;
            (instance.getCachedFiles()).should.be.eql(fileList);
        });
    });

    describe('#readCachedFiles()', () => {
        const testCacheDir = path.resolve(process.cwd(), `test_${CACHE_DIR_NAME}`, version);
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(() => {
            instance = undefined;

            return del([testCacheDir]);
        });

        after(() => del(path.resolve(process.cwd(), `test_${CACHE_DIR_NAME}`)));

        it(`evaluate a rejected promise with the corresponding error, if the cache directory
                doesn't exist`, (done) => {
            instance.setCachePath(testCacheDir);
            (instance.readCachedFiles())
                .then(() => {
                    done(new Error('AssertionError: expected Promise.resolve to be Promise.reject'));
                }, () => {
                    done();
                });
        });

        it(`evaluate a resolved promise with an empty array, if only the cache directory exist
                (no cached files)`, () => {
            instance.setCachePath(testCacheDir);

            return new Promise((resolve, reject) => {
                mkdirp.sync(testCacheDir);

                (instance.readCachedFiles())
                    .then((files) => {
                        (files).should.be.an('array');
                        (files).should.be.emtpy();
                        resolve();
                    }, reject)
                    .catch((error) => {
                        reject(error);
                    });
            });
        });

        it(`evaluate a resolved promise with the corresponding list of cached files, if the cache
                directory and the cached files exist`, () => {
            instance.setCachePath(testCacheDir);

            return new Promise((resolve, reject) => {
                createCacheDummyFiles(testCacheDir).then(() => {
                    (instance.readCachedFiles())
                        .then((files) => {
                            (files).should.be.an('array');
                            (files.length).should.be.above(0);
                            resolve();
                        }, reject)
                        .catch(reject);
                }, reject);
            });
        });
    });

    describe('#cacheVendorScripts()', () => {
        const testCacheDir = path.resolve(process.cwd(), CACHE_DIR_NAME, version);
        let instance;

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
            instance.setCachePath(testCacheDir);
        });

        afterEach(() => {
            instance = undefined;

            return del([testCacheDir]);
        });

        after(() => del(path.resolve(process.cwd(), CACHE_DIR_NAME)));

        it('return a promise instance', () => {
            (instance.cacheVendorScripts()).should.be.an.instanceof(Promise);
        });

        it('save vendor script files into cache directory', () => new Promise((resolve, reject) => {
            (instance.cacheVendorScripts())
                .then(() => {
                    const countNeededVendorScripts = (CanCompileScriptsCache.getListOfVendorScripts(version)).length;

                    fs.readdir(instance.getCachePath(), (error, files) => {
                        if (error) {
                            return reject(error);
                        }

                        (files.length).should.be.eql(countNeededVendorScripts);

                        return resolve();
                    });
                }, reject)
                .catch(reject);
        }));

        it('use existing cache', () => new Promise((resolve, reject) => {
            createCacheDummyFiles(testCacheDir)
                .then(() => {
                    instance.cacheVendorScripts()
                        .then((files) => {
                            (files).should.be.an('array');
                            (files).should.be.emtpy();
                            resolve();
                        }, reject)
                        .catch(reject);
                }, reject)
                .catch(reject);
        }));

        it('emit an "error" event, if the download of vendor scripts failed', (done) => {
            instance.setNeededVendorScripts([undefined, undefined, undefined]);
            instance.cacheVendorScripts();

            instance.on('error', (error) => {
                (error).should.be.an.instanceof(Error);
                (error.toString()).should.match(/Invalid filename/);
                done();
            });
        });
    });

    describe('#createCache()', () => {
        const testCacheDir = path.resolve(process.cwd(), CACHE_DIR_NAME, version);

        afterEach(() => del([testCacheDir]));

        after(() => del(path.resolve(process.cwd(), CACHE_DIR_NAME)));

        it('return a new instance of "CanCompileScriptsCache"', () => {
            const instance = CanCompileScriptsCache.createCache(version);

            (instance).should.be.an.instanceof(CanCompileScriptsCache);
        });
    });

    describe('#downloadVendorScript(url, target)', () => {
        const testCacheDir = path.resolve(process.cwd(), CACHE_DIR_NAME, version);
        let instance;

        before(() => {
            CanCompileScriptsCache.downloadVendorScript = downloadVendorScriptOriginal;
        });

        beforeEach(() => {
            instance = new CanCompileScriptsCache(version);
            instance.setCachePath(testCacheDir);
        });

        afterEach(() => {
            instance = undefined;

            return del([testCacheDir]);
        });

        after(() => {
            CanCompileScriptsCache.downloadVendorScript = downloadVendorScriptMocked;

            return del(path.resolve(process.cwd(), CACHE_DIR_NAME));
        });

        it('return a promise instance', () => {
            (instance.cacheVendorScripts()).should.be.an.instanceof(Promise);
        });

        it('throw an error, if the passed url invalid', () => new Promise((resolve, reject) => {
            mkdirp.sync(testCacheDir);
            CanCompileScriptsCache.downloadVendorScript('Foo.bar', path.resolve(testCacheDir, 'test.js'))
                .then(reject, (error) => {
                    (error).should.be.an.instanceof(Error);
                    (error).should.match(/In-valid url/);
                    resolve();
                })
                .catch(reject);
        }));
    });

    describe('#getListOfVendorScripts(version)', () => {
        const tests = [
            { args: [], label: 'undefined' },
            { args: [[]], label: '[]' },
            { args: [{}], label: '{}' },
            { args: ['foo'], label: 'foo' },
            { args: [1.2], label: '1.2' }
        ];

        tests.forEach((test) => {
            it(`return an empty array, if the passed "version" is an invalid version string: "${test.label}"`, () => {
                (Reflect.apply(CanCompileScriptsCache.getListOfVendorScripts, null, test.args)).should.be.eql([]);
            });
        });

        it('return a list of urls, if the passed "version" is a valid version string', () => {
            (CanCompileScriptsCache.getListOfVendorScripts('2.3.25')).should.be.eql([
                'http://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js',
                'http://canjs.com/release/2.3.25/can.jquery.js',
                'http://canjs.com/release/2.3.25/can.ejs.js',
                'http://canjs.com/release/2.3.25/can.stache.js'
            ]);
        });
    });

    describe('#getFilenameFromUrl(url)', () => {
        it('return "undefined", if passed parameter "url" is not a string', () => {
            (CanCompileScriptsCache.getFilenameFromUrl()).should.be.equal(undefined);
            (CanCompileScriptsCache.getFilenameFromUrl([])).should.be.equal(undefined);
            (CanCompileScriptsCache.getFilenameFromUrl({})).should.be.equal(undefined);
            (CanCompileScriptsCache.getFilenameFromUrl(undefined)).should.be.equal(undefined);
        });

        it('return "undefined", if an invalid file-url is passed', () => {
            (CanCompileScriptsCache.getFilenameFromUrl('')).should.be.equal(undefined);
            (CanCompileScriptsCache.getFilenameFromUrl(undefined)).should.be.equal(undefined);
            (CanCompileScriptsCache.getFilenameFromUrl('http://foo.bar/')).should.be.equal(undefined);
            (CanCompileScriptsCache.getFilenameFromUrl('http://foo.bar/canjs')).should.be.equal(undefined);
        });

        it('return the filename', () => {
            (CanCompileScriptsCache.getFilenameFromUrl('http://foo.bar/canjs.js')).should.be.a.string('canjs.js');
        });
    });
});
