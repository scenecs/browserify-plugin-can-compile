/**
 * @author scenecs <scenecs@t-online.de>
 * @license MIT
 */
const chai = require('chai');
const sinon = require('sinon');
const http = require('follow-redirects/http');
const CanCompileScriptsCache = require('../../../library/CanCompileScriptsCache');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const del = require('del');
const EventEmitter = require('events');

const CACHE_DIR = path.resolve(process.cwd(), 'node_modules/.test_functional_can_compile_cache');
const version = '2.3.24';

chai.should();
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

class HttpResponseMock extends EventEmitter {
    constructor(...args) {
        super(...args);
        this.statusCode = 200;
    }

    setEncoding() {
        return this;
    }

    setStatusCode(code) {
        this.statusCode = code;
    }
}

class HttpRequestMock extends EventEmitter {}

/* ********************************************************************************************** */


describe('CanCompileScriptsCache', function () {
    after(function () {
        return del(CACHE_DIR);
    });

    describe('.createCache()', function () {
        const testCacheDir = path.resolve(CACHE_DIR, version);

        afterEach(function () {
            return del([testCacheDir]);
        });

        after(function () {
            return del(CACHE_DIR);
        });

        it('return a new instance of "CanCompileScriptsCache"', function () {
            const instance = CanCompileScriptsCache.createCache(version);

            (instance).should.be.an.instanceof(CanCompileScriptsCache);
        });
    });

    describe('#cacheVendorScripts()', function () {
        const testCacheDir = path.resolve(CACHE_DIR, version);
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
            instance.setCachePath(testCacheDir);
        });

        afterEach(function () {
            instance = undefined;

            return del([testCacheDir]);
        });

        after(function () {
            return del([CACHE_DIR]);
        });

        it('return a promise instance', function () {
            return new Promise((resolve, reject) => {
                const promise = instance.cacheVendorScripts();

                (promise).should.be.an.instanceof(Promise);

                promise.then(resolve, reject);
            });
        });

        it('save vendor script files into cache directory', function () {
            return new Promise((resolve, reject) => {
                (instance.cacheVendorScripts())
                    .then(() => {
                        const countNeededVendorScripts = (CanCompileScriptsCache
                            .getListOfVendorScripts(version)).length;

                        fs.readdir(instance.getCachePath(), (error, files) => {
                            if (error) {
                                return reject(error);
                            }

                            (files.length).should.be.eql(countNeededVendorScripts);

                            return resolve();
                        });
                    }, reject)
                    .catch(reject);
            });
        });

        it('use existing cache', function () {
            return new Promise((resolve, reject) => {
                createCacheDummyFiles(testCacheDir)
                    .then(() => {
                        instance.cacheVendorScripts()
                            .then((files) => {
                                (files).should.contain.all.keys(['ejs', 'stache']);
                                resolve();
                            }, reject)
                            .catch(reject);
                    }, reject)
                    .catch(reject);
            });
        });

        it('emit an "error" event, if the download of vendor scripts failed', function () {
            return new Promise((resolve) => {
                instance.setNeededVendorScripts([undefined, undefined, undefined]);
                instance.cacheVendorScripts();

                instance.on('error', (error) => {
                    (error).should.be.an.instanceof(Error);
                    (error.toString()).should.match(/Invalid filename/);
                    resolve();
                });
            });
        });
    });

    describe('.downloadVendorScript(url, target)', function () {
        const testCacheDir = path.resolve(CACHE_DIR, version);
        let instance;

        beforeEach(function () {
            instance = new CanCompileScriptsCache(version);
            instance.setCachePath(testCacheDir);
        });

        afterEach(function () {
            instance = undefined;

            return del([testCacheDir]);
        });

        after(function () {
            return del(path.resolve(CACHE_DIR));
        });

        describe('is passed by an invalid value for parameter "url"', function () {
            const tests = [
                {
                    args: [],
                    label: 'empty'
                }, {
                    args: [[]],
                    label: 'an array'
                }, {
                    args: [{}],
                    label: 'an object'
                }, {
                    args: [null],
                    label: '"null"'
                }, {
                    args: [undefined],
                    label: '"undefined"'
                }, {
                    args: [''],
                    label: 'an empty string'
                }
            ];

            tests.forEach((test) => {
                it(`reject the promise, if the passed value is ${test.label}`, function () {
                    return new Promise((resolve, reject) => {
                        Reflect.apply(CanCompileScriptsCache.downloadVendorScript, null, test.args)
                            .then(reject, (error) => {
                                error.should.be.an.instanceOf(Error);
                                error.should.match(/In-valid url/);
                                resolve();
                            })
                            .catch(reject);
                    });
                });
            });
        });

        describe('is passed by an invalid value for parameter "target"', function () {
            const tests = [
                {
                    args: ['http://canjs.com/release/2.3.24/can.jquery.js'],
                    label: 'empty'
                }, {
                    args: ['http://canjs.com/release/2.3.24/can.jquery.js', []],
                    label: 'an array'
                }, {
                    args: ['http://canjs.com/release/2.3.24/can.jquery.js', {}],
                    label: 'an object'
                }, {
                    args: ['http://canjs.com/release/2.3.24/can.jquery.js', null],
                    label: '"null"'
                }, {
                    args: ['http://canjs.com/release/2.3.24/can.jquery.js', undefined],
                    label: '"undefined"'
                }, {
                    args: ['http://canjs.com/release/2.3.24/can.jquery.js', ''],
                    label: 'an empty string'
                }
            ];

            tests.forEach((test) => {
                it(`reject the promise, if the passed value is ${test.label}`, function () {
                    return new Promise((resolve, reject) => {
                        Reflect.apply(CanCompileScriptsCache.downloadVendorScript, null, test.args)
                            .then(reject, (error) => {
                                error.should.be.an.instanceOf(Error);
                                error.should.match(/In-valid target file/);
                                resolve();
                            })
                            .catch(reject);
                    });
                });
            });
        });

        describe('send a GET request for a specific vendor script', function () {
            const vendorScriptURL = `http://canjs.com/release/${version}/can.jquery.js`;
            const vendorScriptTarget = path.resolve(`${CACHE_DIR}`, 'can.jquery.js');
            const request = new HttpRequestMock();
            let response;

            before(function () {
                mkdirp.sync(testCacheDir);
            });

            after(function () {
                return del([testCacheDir]);
            });

            beforeEach(function () {
                response = new HttpResponseMock();
                sinon.stub(http, 'get', function (url, callback) {
                    callback(response);

                    return request;
                });
            });

            afterEach(function () {
                http.get.restore();
            });

            it('return a Promise instance', function () {
                return new Promise((resolve, reject) => {
                    const promise = CanCompileScriptsCache.downloadVendorScript(vendorScriptURL, vendorScriptTarget);

                    response.emit('end');
                    promise
                        .then(() => {
                            promise.should.be.an.instanceOf(Promise);
                            resolve();
                        })
                        .catch(reject);
                });
            });
        });

        describe('send a GET request for a specific vendor script', function () {
            const vendorScriptURL = `http://canjs.com/release/${version}/can.jquery.js`;
            const vendorScriptTarget = path.resolve(`${CACHE_DIR}`, 'can.jquery.js');
            const request = new HttpRequestMock();
            let response;

            before(function () {
                mkdirp.sync(testCacheDir);
            });

            after(function () {
                return del([testCacheDir]);
            });

            beforeEach(function () {
                response = new HttpResponseMock();
                sinon.stub(http, 'get', function (url, callback) {
                    callback(response);

                    return request;
                });
            });

            afterEach(function () {
                http.get.restore();
            });

            it('reject the promise, if the http status code is greater than 400', function () {
                return new Promise((resolve, reject) => {
                    const promise = CanCompileScriptsCache.downloadVendorScript(vendorScriptURL, vendorScriptTarget);

                    response.setStatusCode(500);
                    response.emit('data', '');
                    response.emit('end');
                    promise
                        .then(reject, resolve)
                        .catch(reject);
                });
            });

            it('reject the promise, if the http status code is less than 100', function () {
                return new Promise((resolve, reject) => {
                    const promise = CanCompileScriptsCache.downloadVendorScript(vendorScriptURL, vendorScriptTarget);

                    response.setStatusCode(100);
                    response.emit('data', '');
                    response.emit('end');
                    promise
                        .then(reject, resolve)
                        .catch(reject);
                });
            });

            it('reject the promise, if the request has am error', function () {
                return new Promise((resolve, reject) => {
                    const promise = CanCompileScriptsCache.downloadVendorScript(vendorScriptURL, vendorScriptTarget);

                    request.emit('error');
                    promise
                        .then(reject, resolve)
                        .catch(reject);
                });
            });
        });

        describe('send a GET request for a specific vendor script', function () {
            const vendorScriptURL = `http://canjs.com/release/${version}/can.jquery.js`;
            const vendorScriptTarget = path.resolve(`${CACHE_DIR}`, 'can.jquery.js');

            before(function () {
                mkdirp.sync(testCacheDir);
            });

            after(function () {
                return del([testCacheDir]);
            });

            it('resolve the promise and get the target file', function () {
                return new Promise((resolve, reject) => {
                    const promise = CanCompileScriptsCache.downloadVendorScript(vendorScriptURL, vendorScriptTarget);

                    promise
                        .then((target) => {
                            target.should.be.equal(vendorScriptTarget);
                            resolve();
                        }, reject)
                        .catch(reject);
                });
            });
        });
    });
});
