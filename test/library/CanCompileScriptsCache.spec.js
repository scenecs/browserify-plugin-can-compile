/**
 * @package browserify-plugin-can-compile
 * @category javascript/test
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

var chai = require('chai'),
    should = chai.should(),
    CanCompileScriptsCache = require('../../src/library/CanCompileScriptsCache'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    fs = require('fs'),
    del = require('del'),
    util = require('util'),
    EventEmitter = require('events'),
    es6Promise = require('es6-promise').polyfill();

var CACHE_DIR_NAME = "node_modules/.can_compile_cache";
var version = "2.3.24";

/**************************************************************************************************
 *
 * Mocked Functions/ Classes
 * ==========================
 *
 */ 
var downloadVendorScriptOriginal = CanCompileScriptsCache.downloadVendorScript;
var downloadVendorScriptMocked = function downloadVendorScript(url, target) {
  return new Promise(function(resolve, reject){
    fs.writeFile(target, "Dummyfile", function(error){
      if(error) {
        return reject(error);
      }
      resolve(target);
    });
  });
}

CanCompileScriptsCache.downloadVendorScript = downloadVendorScriptMocked;

var createCacheDummyFiles = function createCacheDummyFiles(testCacheDir) {
  mkdirp.sync(testCacheDir);
  
  return Promise.all([
    // create "jquery.min.js" Dummy
    new Promise(function(resolve, reject){
      fs.writeFile(path.resolve(testCacheDir, "dummy.jquery.min.js"), "Dummyfile", function(error){
        if(error) {
          return reject(error);
        }
        
        resolve();
      })
    }), 

    // create "can.jquery.js" Dummy
    new Promise(function(resolve, reject){
      fs.writeFile(path.resolve(testCacheDir, "dummy.can.jquery.js"), "Dummyfile", function(error){
        if(error) {
          return reject(error);
        }
        
        resolve();
      })
    }),

    // create "can.ejs.js" Dummy
    new Promise(function(resolve, reject){
      fs.writeFile(path.resolve(testCacheDir, "dummy.can.ejs.js"), "Dummyfile", function(error){
        if(error) {
          return reject(error);
        }
        
        resolve();
      })
    }),

    // create "can.stache.js" Dummy
    new Promise(function(resolve, reject){
      fs.writeFile(path.resolve(testCacheDir, "dummy.can.stache.js"), "Dummyfile", function(error){
        if(error) {
          return reject(error);
        }
        
        resolve();
      })
    })
  ]);
}

/**************************************************************************************************/

describe('CanCompileScriptsCache', function(){
  it('throw an error, if the class is instantiating with an invalid version', function(){
    (function(){ new CanCompileScriptsCache(); }).should.throw(/The passed version is not valid/);
    (function(){ new CanCompileScriptsCache("foo"); }).should.throw(/The passed version is not valid/);
    (function(){ new CanCompileScriptsCache([]); }).should.throw(/The passed version is not valid/);
    (function(){ new CanCompileScriptsCache({}); }).should.throw(/The passed version is not valid/);
    (function(){ new CanCompileScriptsCache(1.3); }).should.throw(/The passed version is not valid/);
  });
  
  it('return a valid instance, if the a valid parameter "version" is passed', function(){
    (new CanCompileScriptsCache("2.3.25")).should.be.an.instanceof(CanCompileScriptsCache);
  });
  
  describe('#getVersion()', function(){
    var instance = undefined;

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
    });
    
    afterEach(function(){
      instance = undefined;
    });
    
    it('return the version passed at instantiation', function(){
      (instance.getVersion()).should.be.a.string(version);
    });
  });
  
  describe('#setCachePath([path])', function(){
    var instance = undefined;

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
    });
    
    afterEach(function(){
      instance = undefined;
    });
    
    it('no parameter "path" is passed, so concatinate the "current working directory", the default CACHE_DIR_NAME and the current set version and store the path into the instance property "cachePath"', function(){
      (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, version));
    });
    
    it('an invalid parameter "path" is passed, so concatinate the "current working directory", the default CACHE_DIR_NAME and the current set version and store the path into the instance property "cachePath"', function(){
      instance.setCachePath("");
      (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, version));

      instance.setCachePath({"foo": "bar"});
      (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, version));

      instance.setCachePath([1,2,3]);
      (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, version));
    });
    
    it('set a custom path and store this path into the instance property "cachePath"', function(){
      var testCacheDir = path.resolve(process.cwd(), "test_" + CACHE_DIR_NAME, version);

      instance.setCachePath(testCacheDir);
      (instance.getCachePath()).should.be.a.string(testCacheDir);
    });
    
    it('is chainable', function(){
      var instanceFromChain = instance.setCachePath();
      (instanceFromChain).should.be.eql(instance);
    });
  });
  
  describe('#getCachePath()', function(){
    var instance = undefined;

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
    });
    
    afterEach(function(){
      instance = undefined;
    });
    
    it('returns the path to the cached files of the current set version 2.3.24', function(){
      (instance.getCachePath()).should.be.a.string(path.resolve(process.cwd(), CACHE_DIR_NAME, '2.3.24'));
    });
  });
  
  describe('#getNeededVendorScripts()', function(){
    var instance = undefined;

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
    });
    
    afterEach(function(){
      instance = undefined;
    });
    
    it('return an empty array, if the needed vendor scripts are not set', function(){
      instance.neededVendorScripts = [];
      (instance.getNeededVendorScripts()).should.be.eql([]);
      
      instance.neededVendorScripts = null;
      (instance.getNeededVendorScripts()).should.be.eql([]);
      
      instance.neededVendorScripts = undefined;
      (instance.getNeededVendorScripts()).should.be.eql([]);
    });
    
    it('return a list of the needed vendor scripts', function(){
      (instance.getNeededVendorScripts()).should.be.eql(instance.neededVendorScripts);
    });
  });
  
  describe('#setNeededVendorScripts(urlList)', function(){
    var instance = undefined;

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
    });
    
    afterEach(function(){
      instance = undefined;
    });

    it('do nothing, if parameter "urlList" is not an array', function(){
      var neededVendorScripts = instance.getNeededVendorScripts();
      
      instance.setNeededVendorScripts();
      (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);
      
      instance.setNeededVendorScripts("");
      (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);
      
      instance.setNeededVendorScripts({});
      (instance.getNeededVendorScripts()).should.be.eql(neededVendorScripts);
    });
    
    it('overwrite the instance property "neededVendorScripts" with the passed parameter "urlList"', function(){
      instance.setNeededVendorScripts([1,2,3]);
      (instance.getNeededVendorScripts()).should.be.eql([1,2,3]);
    });
    
    it('is chainable', function(){
      var instanceFromChain = instance.setNeededVendorScripts([1,2,3]);
      (instanceFromChain).should.be.eql(instance);
    });
  });
  
  describe('#setCachedFiles()', function(){
    var instance = undefined;
    var fileList = [
      "./test1.js",
      "./test2.js",
      "./test3.js"
    ];

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
    });

    afterEach(function(){
      instance = undefined;
    });

    it('the instance property "cachedFiles" has not been touched, if setCachedFiles is called with an invalid value', function(){
      var cachedFilesBefore = instance.cachedFiles;

      instance.setCachedFiles();
      (instance.cachedFiles).should.be.eql(cachedFilesBefore);

      instance.setCachedFiles("Foo");
      (instance.cachedFiles).should.be.eql(cachedFilesBefore);

      instance.setCachedFiles({"foo": "bar"});
      (instance.cachedFiles).should.be.eql(cachedFilesBefore);
    });
    
    it('the instance property "cachedFiles" constains the passed file list', function(){
      var cachedFilesBefore = instance.cachedFiles;

      instance.setCachedFiles(fileList);

      (instance.cachedFiles).should.be.eql(fileList);
    })
    
    it('is chainable', function(){
      var instanceFromChain = instance.setNeededVendorScripts([1,2,3]);
      (instanceFromChain).should.be.eql(instance);
    });
  });

  describe('#getCachedFiles()', function(){
    var instance = undefined;
    var fileList = [
      "./test2.1.js",
      "./test2.2.js",
      "./test2.3.js"
    ];

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
    });

    afterEach(function(){
      instance = undefined;
    });
    
    it('return a list of local file paths of the cached vendor scripts', function(){
      instance.cachedFiles = fileList;
      (instance.getCachedFiles()).should.be.eql(fileList);
    });
  });

  describe('#readCachedFiles()', function(){
    var instance = undefined;
    var testCacheDir = path.resolve(process.cwd(), "test_" + CACHE_DIR_NAME, version);

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
    });
    
    afterEach(function(){
      instance = undefined;
      return del([testCacheDir]);
    });

    after(function(){
      return del(path.resolve(process.cwd(), "test_" + CACHE_DIR_NAME));
    });

    it('evaluate a rejected promise with the corresponding error, if the cache directory doesn\'t exist', function(done){
      instance.setCachePath(testCacheDir);
      (instance.readCachedFiles())
        .then(function(){
          done(new Error('AssertionError: expected Promise.resolve to be Promise.reject'));
        }, function(){
          done();
        });
    });

    it('evaluate a resolved promise with an empty array, if only the cache directory exist (no cached files)', function(){
      instance.setCachePath(testCacheDir);
      return new Promise(function(resolve, reject) {
        mkdirp.sync(testCacheDir);
        
        (instance.readCachedFiles())
          .then(function(files){
            (files).should.be.an('array');
            (files).should.be.emtpy;
            resolve();
          },reject)
          .catch(function(error){
            reject(error);
          });
      });
    });

    it('evaluate a resolved promise with the corresponding list of cached files, if the cache directory and the cached files exist', function(){
      instance.setCachePath(testCacheDir);
      return new Promise(function(resolve, reject) {
        createCacheDummyFiles(testCacheDir).then(function(){
          (instance.readCachedFiles())
            .then(function(files){
              (files).should.be.an('array');
              (files.length).should.be.above(0);
              resolve();
            },reject)
            .catch(reject);
        }, reject);
      });
    });
  });
  
  describe('#cacheVendorScripts()', function(){
    var instance = undefined;
    var testCacheDir = path.resolve(process.cwd(), CACHE_DIR_NAME, version);

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
      instance.setCachePath(testCacheDir);
    });
    
    afterEach(function(){
      instance = undefined;
      return del([testCacheDir]);
    });

    after(function(){
      return del(path.resolve(process.cwd(), CACHE_DIR_NAME));
    });

    it('return a promise instance', function(){
      (instance.cacheVendorScripts()).should.be.an.instanceof(Promise);
    });

    it('save vendor script files into cache directory', function(){
      return new Promise(function(resolve, reject){
        (instance.cacheVendorScripts())
          .then(function(files){
            var countNeededVendorScripts = (CanCompileScriptsCache.getListOfVendorScripts(version)).length;

            fs.readdir(instance.getCachePath(), (error, files) => {
              if(error) {
                return reject(error);
              }

              (files.length).should.be.eql(countNeededVendorScripts);
              return resolve();
            });
          }, reject)
          .catch(reject);
      });
    });
    
    it('use existing cache', function(){
      return new Promise(function(resolve, reject){
        createCacheDummyFiles(testCacheDir)
          .then(function(){
            instance.cacheVendorScripts()
              .then(function(files){
                (files).should.be.an('array');
                (files).should.be.emtpy;
                resolve();
              }, reject)
              .catch(reject);
          }, reject)
          .catch(reject);
      });
    });
    
    it('emit an "error" event, if the download of vendor scripts failed', function(done){
      instance.setNeededVendorScripts([undefined, undefined, undefined]);
      instance.cacheVendorScripts();

      instance.on('error', function(error){
        (error).should.be.an.instanceof(Error);
        (error.toString()).should.match(/Invalid filename/);
        done();
      });
    });
  });
  
  describe('#createCache()', function(){
    var testCacheDir = path.resolve(process.cwd(), CACHE_DIR_NAME, version);

    afterEach(function(){
      return del([testCacheDir]);
    });

    after(function(){
      return del(path.resolve(process.cwd(), CACHE_DIR_NAME));
    });

    it('return a new instance of "CanCompileScriptsCache"', function(){
      var instance = CanCompileScriptsCache.createCache(version);

      (instance).should.be.an.instanceof(CanCompileScriptsCache);
    });
  });
  
  describe('#downloadVendorScript(url, target)', function(){
    var instance = undefined;
    var testCacheDir = path.resolve(process.cwd(), CACHE_DIR_NAME, version);

    before(function(){
      CanCompileScriptsCache.downloadVendorScript = downloadVendorScriptOriginal;
    });

    beforeEach(function(){
      instance = new CanCompileScriptsCache(version);
      instance.setCachePath(testCacheDir);
    });
    
    afterEach(function(){
      instance = undefined;
      return del([testCacheDir]);
    });

    after(function(){
      CanCompileScriptsCache.downloadVendorScript = downloadVendorScriptMocked;
      return del(path.resolve(process.cwd(), CACHE_DIR_NAME));
    });

    it('return a promise instance', function(){
      (instance.cacheVendorScripts()).should.be.an.instanceof(Promise);
    });

    it('throw an error, if the passed url invalid', function(){
      return new Promise(function(resolve, reject){
        mkdirp.sync(testCacheDir);
        CanCompileScriptsCache.downloadVendorScript("Foo.bar", path.resolve(testCacheDir, "test.js"))
        .then(reject, function(error){
          (error).should.be.an.instanceof(Error);
          (error).should.match(/In-valid url/);
          resolve();
        })
        .catch(reject);
      });
    });

  });
  
  
  describe('#getListOfVendorScripts(version)', function(){
    var tests = [
      {"args": [], "label": "undefined"},
      {"args": [[]], "label": "[]"},
      {"args": [{}], "label": "{}"},
      {"args": ["foo"], "label": "foo"},
      {"args": [1.2], "label": "1.2"}
    ];
    
    tests.forEach(function(test) {
      it('return an empty array, if the passed "version" is an invalid version string: "' + test.label + '"', function(){
        (CanCompileScriptsCache.getListOfVendorScripts.apply(null, test.args)).should.be.eql([]);
      });
    });
    
    it('return a list of urls, if the passed "version" is a valid version string', function(){
      (CanCompileScriptsCache.getListOfVendorScripts("2.3.25")).should.be.eql([
        "http://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js",
        "http://canjs.com/release/2.3.25/can.jquery.js",
        "http://canjs.com/release/2.3.25/can.ejs.js",
        "http://canjs.com/release/2.3.25/can.stache.js"
      ]);
    });
  });
  
  describe('#getFilenameFromUrl(url)', function(){
    it('return "undefined", if passed parameter "url" is not a string', function(){
      (undefined === CanCompileScriptsCache.getFilenameFromUrl()).should.be.true;
      (undefined === CanCompileScriptsCache.getFilenameFromUrl([])).should.be.true;
      (undefined === CanCompileScriptsCache.getFilenameFromUrl({})).should.be.true;
      (undefined === CanCompileScriptsCache.getFilenameFromUrl(undefined)).should.be.true;
    });
    
    it('return "undefined", if an invalid file-url is passed', function(){
      (undefined === CanCompileScriptsCache.getFilenameFromUrl("")).should.be.true;
      (undefined === CanCompileScriptsCache.getFilenameFromUrl("undefined")).should.be.true;
      (undefined === CanCompileScriptsCache.getFilenameFromUrl("http://foo.bar/")).should.be.true;
      (undefined === CanCompileScriptsCache.getFilenameFromUrl("http://foo.bar/canjs")).should.be.true;
    });
    
    it('return the filename', function(){
      (CanCompileScriptsCache.getFilenameFromUrl("http://foo.bar/canjs.js")).should.be.a.string('canjs.js');
    });
  });
});