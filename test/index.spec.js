/**
 * @package browserify-plugin-can-compile
 * @category javascript/test
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

var chai = require('chai'),
    should = chai.should(),
    browserify = require('browserify'),
    BrowserifyPluginCanCompile = require('../src'),
    del = require('del'),
    path = require('path'),
    fs = require('fs'),
    es6Promise = require('es6-promise').polyfill();


describe('BrowserifyPluginCanCompile', function(){
  describe('#compile(bundle, options)', function(){
    
    afterEach(function(){
      BrowserifyPluginCanCompile.reset();
    });
    
    it('throw an error, if the passed parameter "bundle" is not a vaild instance of "Browserify"', function(){
      (function(){ BrowserifyPluginCanCompile.compile(); }).should.throw(/The passed parameter "bundle" seems to be not a valid instance of "Browserify"/);
      (function(){ BrowserifyPluginCanCompile.compile({"test": "haha"}); }).should.throw(/The passed parameter "bundle" seems to be not a valid instance of "Browserify"/);
    });
    
    it('throw an error, if the currently used version of canJS is not set', function(){
      (function(){ BrowserifyPluginCanCompile.compile(browserify()); }).should.throw(/Missing option "options.version"/);
    });
    
    it('create an instance of BrowserifyPluginCanCompile', function(){
      (BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": []})).should.be.an.instanceof(BrowserifyPluginCanCompile);
    });
    
    it('set the default normalizer function, if no normalizer is passed', function(){
      var instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": []});
      (instance.options.normalizer.toString()).should.be.eql((instance.getDefaultNormalizer()).toString());
      instance = undefined;
    });
    
    it('overwrite the default normalizer function', function(){
      var dummyFunction = function(){};
      var instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": [], "normalizer": dummyFunction});
      (instance.options.normalizer.toString()).should.be.eql(dummyFunction.toString());
      instance = undefined;
    });
    
    it('disable caching of can-compile vendor scripts', function(){
      var instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "cacheCanCompileScripts": false});
      (instance.options.cacheCanCompileScripts).should.be.false;
    });
    
    it('use path for con-compile vendor scripts from passed options', function(){
      var vendorScripts = [
          "./test1.js",
          "./test2.js",
          "./test3.js",
          "./test4.js"
        ];
      var instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": vendorScripts});
      (instance.options.paths).should.be.equal(vendorScripts);
    });
    
    it('allow caching of the can-compile vendor scripts', function(){
      var instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21"});
    });
  });
  
  describe('#extendBrowserifyPipeline()', function(){
    it('extend the browserify pipeline "deps" with with the duplex stream', function(){
      var instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "cacheCanCompileScripts": false});
      var newBrowserifyInstance = browserify();
      var numberOfPipelineStreams = newBrowserifyInstance.pipeline.get('deps').length;
      
      instance.browserifyInstance = newBrowserifyInstance;
      instance.extendBrowserifyPipeline();
      (instance.browserifyInstance.pipeline.get('deps').length).should.be.equal(numberOfPipelineStreams+=1);
    });
  });
  
  describe('#setOptions(options)', function(){
    var instance = undefined;
    var testInvalidOptionsParameter = [
      { "args": [], "label": "undefined" },
      { "args": [""], "label": "a string" },
      { "args": [[]], "label": "an array"},
      { "args": [function(){}], "label": "a function" }
    ];
    
    beforeEach(function(){
      instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": []});
    });
    
    afterEach(function(){
      BrowserifyPluginCanCompile.reset();
      instance = undefined;
    });
    
    testInvalidOptionsParameter.forEach(function(testItem, index){
      it('throw an error, if the passed parameter "options" is "' + testItem.label + '"', function(){
        (function(){ instance.setOptions.apply(null, testItem.args); }).should.throw(/The passed parameter "options" must be an object/);
      });
    });
    
    it('do nothing, if the passed parameter "options" is an empty object', function(){
      var options = {};
      Object.assign(options, instance.options);

      instance.setOptions({});
      (instance.options).should.be.deep.equal(options);
    });
    
    it('overwrite the default property "this.options.extensions" with {"stache": "sta"}', function(){
      var options = {};
      Object.assign(options, instance.options, {"extensions": {"stache": "sta"}});

      instance.setOptions({"extensions": {"stache": "sta"}});
      (instance.options).should.be.deep.equal(options);
    });
  });
  
  describe('#getOptions()', function(){
    var instance = undefined;
    
    beforeEach(function(){
      instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": []});
    });
    
    afterEach(function(){
      BrowserifyPluginCanCompile.reset();
      instance = undefined;
    });
    
    it('return the current options', function(){
      var options = {};
      Object.assign(options, instance.options);
      
      (BrowserifyPluginCanCompile.getInstance().getOptions()).should.be.eql(options);
    });
  });
  
  describe('#setPaths(paths)', function(){
    var instance;
    var testInvalidOptionsParameter = [
      { "args": [], "label": "undefined" },
      { "args": [""], "label": "a string" },
      { "args": [1234], "label": "a string" },
      { "args": [{}], "label": "an object"},
      { "args": [function(){}], "label": "a function" }
    ];

    beforeEach(function(){
      instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": ["./test1.js", "./test2.js"]});
    });
    
    afterEach(function(){
      instance = BrowserifyPluginCanCompile.reset();
    });
    
    testInvalidOptionsParameter.forEach(function(testItem, index){
      it('throw an error, if the passed parameter "paths" is "' + testItem.label + '"', function(){
        (function(){ instance.setPaths.apply(null, testItem.args); }).should.throw(/The passed parameter "paths" must be an array/);
      });
    });
    
    it('overwrite the existing paths', function(){
      var newPaths = ["./test2.js", "./test3.js"];
      instance.setPaths(newPaths);
      (instance.getPaths()).should.be.eql(newPaths);
    });
  });
  
  describe('#getPaths()', function(){
    var instance;
    var newPaths = ["./test2.js", "./test3.js"];

    beforeEach(function(){
      instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": newPaths});
    });
    
    afterEach(function(){
      instance = BrowserifyPluginCanCompile.reset();
    });
    
    it('return an array with the passed paths options from instantiation', function(){
      (instance.getPaths()).should.be.eql(newPaths);
    });
  });
  
  describe('#getFileExtensionRegExp()', function(){
    var instance;
    var testInvalidOptionsParameter = [
      { "extensions": undefined, "label": "undefined" },
      { "extensions": ["test", "test1"], "label": "an array" },
      { "extensions": 1234, "label": "a number"},
      { "extensions": function(){}, "label": "a function" }
    ];

    beforeEach(function(){
      instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": []});
    });
    
    afterEach(function(){
      instance = BrowserifyPluginCanCompile.reset();
    });
    
    testInvalidOptionsParameter.forEach(function(testItem, index){
      it('throw an error, if "options.extensions" is "' + testItem.label + '"', function(){
        instance.options.extensions = testItem.extensions;
        (function(){ instance.getFileExtensionRegExp(); }).should.throw(/Option "extensions" must be a key-value object/);
      });
    });
    
    it('creates a regular expressions form the property "options.extensions"', function(){
      (instance.getFileExtensionRegExp()).should.be.eql(new RegExp('^.*\/([\\w-]+)\\.(stache|ejs|mustache)$', "gi"));
    });
  });
  
  describe('#getDefaultNormalizer()', function(){
    var normalizer;
    
    before(function(){
      var instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": []});
      normalizer = instance.getDefaultNormalizer();
    });
    
    after(function(){
      normalizer = null;
      BrowserifyPluginCanCompile.reset();
    });
    
    it('return a normalizer function', function(){
      normalizer.should.be.a('function');
    });

    it('normalize the path "./foo/bar/template.stache" to "template"', function(){
      (normalizer('./foo/bar/template.stache')).should.be.a.string('template');
    });

    it('normalize the path "./foo/bar/user-template.stache" to "user-template"', function(){
      (normalizer('./foo/bar/user-template.stache')).should.be.a.string('user-template');
    });

    it('normalize the path "./foo/bar/user_template.stache" to "user_template"', function(){
      (normalizer('./foo/bar/user_template.stache')).should.be.a.string('user_template');
    });

    it('normalize the path "./foo/bar/userTemplate.stache" to "userTemplate"', function(){
      (normalizer('./foo/bar/userTemplate.stache')).should.be.a.string('userTemplate');
    });

    it('normalize the path "./foo/bar/template.phtml" to "template.phtml"', function(){
      (normalizer('./foo/bar/template.phtml')).should.be.a.string('template.phtml');
    });
  });
  
  describe('#isNone()', function(){
    var testInvalidOptionsParameter = [
      { "args": [], "label": "not defined", "expects": true },
      { "args": [null], "label": "null", "expects": true },
      { "args": [undefined], "label": "undefined", "expects": true },
      { "args": [""], "label": "an empty sting", "expects": false },
      { "args": ["Test"], "label": "a sting", "expects": false },
      { "args": [[]], "label": "an empty array", "expects": false },
      { "args": [["String", 123]], "label": "an array", "expects": false },
      { "args": [{}], "label": "an empty object", "expects": false },
      { "args": [{"test": "value"}], "label": "an object", "expects": false },
      { "args": [function(){}], "label": "a function", "expects": false }
    ];

    testInvalidOptionsParameter.forEach(function(testItem, index){
      it('return ' + testItem.expects + ', if the passed parameter is "' + testItem.label + '"', function(){
        (BrowserifyPluginCanCompile.isNone.apply(null, testItem.args)).should.be.eql(testItem.expects);
      });
    });
  });
  
  describe('#getInstance()', function(){
    var instance = undefined;
    
    beforeEach(function(){
      instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": []});
    });
    
    afterEach(function(){
      instance = BrowserifyPluginCanCompile.reset();
    });
    
    it('return the current instance', function(){
      (instance).should.be.eql(BrowserifyPluginCanCompile.getInstance());
    });
  });
  
  describe('#reset()', function(){
    it('reset the current instance', function(){
      var instance = BrowserifyPluginCanCompile.compile(browserify(), {"version": "2.3.21", "paths": []});

      instance = BrowserifyPluginCanCompile.reset();
      (undefined === BrowserifyPluginCanCompile.getInstance()).should.be.true;
    });
  });
  
  describe('#transformFunction(chunk, encoding, callback)', function(){
    
  });

  describe('#flushFunction(callback)', function(){
    
  });
});