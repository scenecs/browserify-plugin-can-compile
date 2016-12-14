/**
 * @author scenecs <scenecs@t-online.de>
 * @license MIT
 */
const chai = require('chai');
const CanCompileScriptsCache = require('../../../library/CanCompileScriptsCache');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const del = require('del');
const should = chai.should();
const sinon = require('sinon');

const DEFAULT_CACHE_DIR = path.resolve(process.cwd(), 'node_modules/.can_compile_cache');
const CACHE_DIR = path.resolve(process.cwd(), '.test_unit_can_compile_cache');
const version = '2.3.24';

chai.config.includeStack = true;

/* ************************************************************************************************
 *
 * HelperFunctions
 * ----------------
 */
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

describe('CanCompileScriptsCache', function () {
    before(function () {
        sinon.stub(CanCompileScriptsCache, 'downloadVendorScript', function downloadVendorScript() {
            throw new Error('Mocked function! Is the current test a functional test?');
        });
    });

    after(function () {
        CanCompileScriptsCache.downloadVendorScript.restore();
    });

    it('throw an error, if the class is instantiating with an invalid version', () => {
        (() => (new CanCompileScriptsCache())).should.throw(/The passed version is not valid/);
        (() => (new CanCompileScriptsCache('foo'))).should.throw(/The passed version is not valid/);
        (() => (new CanCompileScriptsCache([]))).should.throw(/The passed version is not valid/);
        (() => (new CanCompileScriptsCache({}))).should.throw(/The passed version is not valid/);
        (() => (new CanCompileScriptsCache(1.3))).should.throw(/The passed version is not valid/);
    });

    it('return a valid instance, if the a valid parameter "version" is passed', function () {
        (new CanCompileScriptsCache('2.3.25')).should.be.an.instanceof(CanCompileScriptsCache);
    });

    describe('#getVersion()', function () {
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(function () {
            instance = undefined;
        });

        it('return the version passed at instantiation', function () {
            (instance.getVersion()).should.be.a.string(version);
        });
    });

    describe('#setCachePath([path])', function () {
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(function () {
            instance = undefined;
        });

        it(`no parameter "path" is passed, so concatinate the "current working directory", the
                default CACHE_DIR and the current set version and store the path into the
                instance property "cachePath"`, function () {
            (instance.getCachePath()).should.be.a.string(path.resolve(DEFAULT_CACHE_DIR, version));
        });

        it(`an invalid parameter "path" is passed, so concatinate the "current working directory",
                the default CACHE_DIR and the current set version and store the path into the
                instance property "cachePath"`, function () {
            instance.setCachePath('');
            (instance.getCachePath()).should.be.a.string(path.resolve(DEFAULT_CACHE_DIR, version));

            instance.setCachePath({ foo: 'bar' });
            (instance.getCachePath()).should.be.a.string(path.resolve(DEFAULT_CACHE_DIR, version));

            instance.setCachePath([1, 2, 3]);
            (instance.getCachePath()).should.be.a.string(path.resolve(DEFAULT_CACHE_DIR, version));
        });

        it('set a custom path and store this path into the instance property "cachePath"', function () {
            const testCacheDir = path.resolve(CACHE_DIR, version);

            instance.setCachePath(testCacheDir);
            (instance.getCachePath()).should.be.a.string(testCacheDir);
        });

        it('is chainable', function () {
            const instanceFromChain = instance.setCachePath();

            (instanceFromChain).should.be.eql(instance);
        });
    });

    describe('#getCachePath()', function () {
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(function () {
            instance = undefined;
        });

        it('returns the path to the cached files of the current set version 2.3.24', function () {
            (instance.getCachePath()).should.be.a.string(path.resolve(DEFAULT_CACHE_DIR, '2.3.24'));
        });
    });

    describe('#getNeededVendorScripts()', function () {
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(function () {
            instance = undefined;
        });

        it('return an empty array, if the needed vendor scripts are not set', function () {
            instance.neededVendorScripts = [];
            (instance.getNeededVendorScripts()).should.be.eql([]);

            instance.neededVendorScripts = null;
            (instance.getNeededVendorScripts()).should.be.eql([]);

            instance.neededVendorScripts = undefined;
            (instance.getNeededVendorScripts()).should.be.eql([]);
        });

        it('return a list of the needed vendor scripts', function () {
            (instance.getNeededVendorScripts()).should.be.eql(instance.neededVendorScripts);
        });
    });

    describe('#setNeededVendorScripts(urlList)', function () {
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(function () {
            instance = undefined;
        });

        it('do nothing, if parameter "urlList" is not an array', function () {
            const neededVendorScripts = instance.getNeededVendorScripts();

            instance.setNeededVendorScripts();
            (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);

            instance.setNeededVendorScripts('');
            (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);

            instance.setNeededVendorScripts({});
            (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);
        });

        it('overwrite the instance property "neededVendorScripts" with the passed parameter "urlList"', function () {
            instance.setNeededVendorScripts([1, 2, 3]);
            (instance.getNeededVendorScripts()).should.be.eql([1, 2, 3]);
        });

        it('is chainable', function () {
            const instanceFromChain = instance.setNeededVendorScripts([1, 2, 3]);

            (instanceFromChain).should.be.eql(instance);
        });
    });

    describe('#setCachedFiles()', function () {
        const fileList = [
            './test1.js',
            './test2.js',
            './test3.js'
        ];
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(function () {
            instance = undefined;
        });

        it(`the instance property "cachedFiles" has not been touched, if setCachedFiles is called
                with an invalid value`, function () {
            const cachedFilesBefore = instance.cachedFiles;

            instance.setCachedFiles();
            (instance.cachedFiles).should.be.eql(cachedFilesBefore);

            instance.setCachedFiles('Foo');
            (instance.cachedFiles).should.be.eql(cachedFilesBefore);

            instance.setCachedFiles({ foo: 'bar' });
            (instance.cachedFiles).should.be.eql(cachedFilesBefore);
        });

        it('the instance property "cachedFiles" constains the passed file list', function () {
            instance.setCachedFiles(fileList);
            (instance.cachedFiles).should.be.eql(fileList);
        });

        it('is chainable', function () {
            const instanceFromChain = instance.setNeededVendorScripts([1, 2, 3]);

            (instanceFromChain).should.be.eql(instance);
        });
    });

    describe('#getCachedFiles()', function () {
        const fileList = [
            './test2.1.js',
            './test2.2.js',
            './test2.3.js'
        ];
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(function () {
            instance = undefined;
        });

        it('return a list of local file paths of the cached vendor scripts', function () {
            instance.cachedFiles = fileList;
            (instance.getCachedFiles()).should.be.eql(fileList);
        });
    });

    describe('#readCachedFiles()', function () {
        const testCacheDir = path.resolve(CACHE_DIR, version);
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
        });

        afterEach(function () {
            instance = undefined;

            return del([testCacheDir]);
        });

        after(function () {
            return del([CACHE_DIR]);
        });

        it(`evaluate a rejected promise with the corresponding error, if the cache directory
                doesn't exist`, function (done) {
            instance.setCachePath(testCacheDir);
            (instance.readCachedFiles())
                .then(() => {
                    done(new Error('AssertionError: expected Promise.resolve to be Promise.reject'));
                }, () => {
                    done();
                });
        });

        it(`evaluate a resolved promise with an empty array, if only the cache directory exist
                (no cached files)`, function () {
            instance.setCachePath(testCacheDir);

            return new Promise((resolve, reject) => {
                mkdirp.sync(testCacheDir);

                (instance.readCachedFiles())
                    .then((files) => {
                        (files).should.be.an('array');
                        (files).should.be.emtpy;
                        resolve();
                    }, reject)
                    .catch((error) => {
                        reject(error);
                    });
            });
        });

        it(`evaluate a resolved promise with the corresponding list of cached files, if the cache
                directory and the cached files exist`, function () {
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

    describe('.getListOfVendorScripts(version)', function () {
        const tests = [
            { args: [], label: 'undefined' },
            { args: [[]], label: '[]' },
            { args: [{}], label: '{}' },
            { args: ['foo'], label: 'foo' },
            { args: [1.2], label: '1.2' }
        ];

        tests.forEach(function (test) {
            it(`return an empty array, if the passed "version" is an invalid version string: "${test.label}"`, () => {
                (Reflect.apply(CanCompileScriptsCache.getListOfVendorScripts, null, test.args)).should.be.eql([]);
            });
        });

        it('return a list of urls, if the passed "version" is a valid version string', function () {
            (CanCompileScriptsCache.getListOfVendorScripts('2.3.25')).should.be.eql([
                'http://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js',
                'http://canjs.com/release/2.3.25/can.jquery.js',
                'http://canjs.com/release/2.3.25/can.ejs.js',
                'http://canjs.com/release/2.3.25/can.stache.js'
            ]);
        });
    });

    describe('.getFilenameFromUrl(url)', function () {
        const tests = [
            {
                args: [],
                label: 'return "undefined", if passed parameter "url" is "empty"'
            }, {
                args: [[]],
                label: 'return "undefined", if passed parameter "url" is an "array"'
            }, {
                args: [{}],
                label: 'return "undefined", if passed parameter "url" is an "object"'
            }, {
                args: [null],
                label: 'return "undefined", if passed parameter "url" is "null"'
            }, {
                args: [undefined],
                label: 'return "undefined", if passed parameter "url" is "undefined"'
            }, {
                args: [''],
                label: 'return "undefined", if passed parameter "url" is an "empty string"'
            }, {
                args: ['http://foo.bar/'],
                label: 'return "undefined", if passed parameter "url" is an invalid file-url ("http://foo.bar/")'
            }, {
                args: ['http://foo.bar/canjs'],
                label: 'return "undefined", if passed parameter "url" is an invalid file-url ("http://foo.bar/canjs")'
            }
        ];

        tests.forEach((test) => {
            it(`return "undefined", if passed parameter "url" is ${test.label}`, function () {
                should.equal(Reflect.apply(CanCompileScriptsCache.getFilenameFromUrl, null, test.args), undefined);
            });
        });

        it('return the filename', function () {
            (CanCompileScriptsCache.getFilenameFromUrl('http://foo.bar/canjs.js')).should.be.a.string('canjs.js');
        });
    });

    describe('.convertToCanCompilePathsObject(files)', function () {
        describe('is passed by invalid "files"', function () {
            const tests = [
                { args: [], label: 'empty' },
                { args: [undefined], label: 'undefined' },
                { args: [null], label: 'null' },
                { args: ['string'], label: 'a string' },
                { args: [100], label: 'a number' },
                { args: [{}], label: 'an object' }
            ];

            tests.forEach((test) => {
                it(`throw an exception, if the passed parameter "files" is ${test.label}`, function () {
                    (() => Reflect.apply(CanCompileScriptsCache.convertToCanCompilePathsObject, null, test.args))
                        .should.throw(/must be an array/);
                });
            });
        });

        describe('is passed by valid "files"', function () {
            const tests = [{
                args: [[
                    'path/to/cached/files/2.3.24/can.jquery.js',
                    'path/to/cached/files/2.3.23/can.jquery.js'
                ]],
                expects: { can: 'path/to/cached/files/2.3.23/can.jquery.js' },
                label: 'the array contains the same vendor script type multiple times and return the last one'
            }, {
                args: [[
                    'path/to/cached/files/2.3.23/jquery.min.js',
                    'path/to/cached/files/2.3.23/can.jquery.js',
                    'path/to/cached/files/2.3.23/can.ejs.js',
                    'path/to/cached/files/2.3.23/can.stache.js'
                ]],
                expects: {
                    can: 'path/to/cached/files/2.3.23/can.jquery.js',
                    ejs: 'path/to/cached/files/2.3.23/can.ejs.js',
                    jquery: 'path/to/cached/files/2.3.23/jquery.min.js',
                    stache: 'path/to/cached/files/2.3.23/can.stache.js'
                },
                label: 'return an object with each vendor script type'
            }];

            tests.forEach((test) => {
                it(`${test.label}`, function () {
                    (Reflect.apply(CanCompileScriptsCache.convertToCanCompilePathsObject, null, test.args))
                        .should.be.deep.equal(test.expects);
                });
            });
        });
    });

    describe('.getScriptType(filePath)', function () {
        describe('is passed by invalid "filePath"', function () {
            const tests = [
                { args: [], label: 'empty' },
                { args: [undefined], label: 'undefined' },
                { args: [null], label: 'null' },
                { args: [100], label: 'a number' },
                { args: [{}], label: 'an object' },
                { args: ['string'], label: 'an unknown vendor script type' }
            ];

            tests.forEach((test) => {
                it(`return 'undefined', if the passed parameter "filePath" is ${test.label}`, function () {
                    should.equal(Reflect.apply(CanCompileScriptsCache.getScriptType, null, test.args), undefined);
                });
            });
        });

        describe('is passed by valid "filePath"', function () {
            const tests = [{
                args: ['path/to/cached/files/2.3.23/jquery.min.js'],
                expects: 'jquery',
                label: 'return the type "jquery", if the "filePath" contains "/jquery"'
            }, {
                args: ['path/to/cached/files/2.3.23/can.jquery.js'],
                expects: 'can',
                label: 'return the type "can", if the "filePath" contains "/can"'
            }, {
                args: ['path/to/cached/files/2.3.23/can.ejs.js'],
                expects: 'ejs',
                label: 'return the type "ejs", if the "filePath" contains "ejs"'
            }, {
                args: ['path/to/cached/files/2.3.23/can.stache.js'],
                expects: 'stache',
                label: 'return the type "stache", if the "filePath" contains "stache"'
            }, {
                args: ['path/to/cached/files/2.3.23/can.mustache.js'],
                expects: 'mustache',
                label: 'return the type "mustache", if the "filePath" contains "mustache"'
            }];

            tests.forEach((test) => {
                it(`${test.label}`, function () {
                    (Reflect.apply(CanCompileScriptsCache.getScriptType, null, test.args))
                        .should.be.equal(test.expects);
                });
            });
        });
    });
});
