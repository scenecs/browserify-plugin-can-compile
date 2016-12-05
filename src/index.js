/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

import through2 from 'through2';
import canCompiler from 'can-compile';
import fs from 'fs';
import path from 'path';
import CanCompileScriptsCacheManager from './library/CanCompileScriptsCacheManager';
import es6Promise from 'es6-promise';

// Polyfill
es6Promise.polyfill();

/**
 * Browserify Plugin: browserify-plugin-can-compile
 * =================================================
 *
 * A [Browserify](https://github.com/substack/node-browserify) plugin to require canJs template
 * files in a javascript file. The template will be precompiled with module "can-compile" and will
 * be bundled with the other javascript code. It is possible to save all required templates in an
 * external javascript file.
 *
 * b.plugin(BrowserifyPluginCanCompile.compile [, options])
 * ---------------------------------------------------------
 *
 * ### options
 *
 * The options object allows the following configuration options:
 *
 *    - `filename` {String}: The name of the file to be compiled
 *    - `version` {String}: The CanJS version to be used
 *    - `log` {Function}: A logger function (e..g `console.log.bind(console)`)
 *    - `normalizer` {Function}: A Function that returns the normalized path name
 *    - `tags` {Array}: A list of all your can.Component tags. They need to be registered in order to pre-compile views properly.
 *    - `extensions` {Object}: An object to map custom file extensions to the standard extension (e.g. `{ 'mst' : 'mustache' }`)
 *    - `viewAttributes` {Array}: A list of attribute names (RegExp or String), used for additional behavior for an attribute in a view (can.view.attr)
 *    - `paths` an object with `ejs`, `mustache` or `stache` and a `jquery` property pointing to files of existing versions or CanJS and jQuery instead of the CDN links.
 *
 * All options are optional. If the option `filename` is defined, the precompiled templates will be
 * saved in this external file.
 *
 * For more information please see at can-compile dokumentation: https://github.com/canjs/can-compile
 *
 * Example
 * --------
 * 
 * ```javascript
 *  import browserify from 'browserify';
 *  import browserifyPluginCanCompile from 'browserify-plugin-can-compile';
 *
 *  let b = browserify();
 *
 *  b.add('./app.js')
 *   .plugin(browserifyPluginCanCompile, {
 *      "version": "2.3.23",
 *      "filename": "./views-app.js"
 *    })
 *   .bundle().pipe(process.stdout);
 * ```
 *
 * @class BrowserifyPluginCanCompile
 */
export class BrowserifyPluginCanCompile {
  /**
   *
   * @constructor
   * @param {Browserify} bundle Browserify instance
   * @see https://github.com/substack/node-browserify#browserifyfiles--opts
   * @param {Object} options Can-compile options to influence the compile process. This options will
   *    be piped to the module "can-compile".
   * @see https://github.com/canjs/can-compile#programmatically
   */
  constructor(bundle, options) {
    /**
     * @property buffer
     * @private
     * @type Array
     * @default []
     */
    this.buffer = [];
    
    /**
     * @property options
     * @private
     * @type Object
     * @default {
     *    "extensions": {
     *      "stache": "stache",
     *      "ejs": "ejs",
     *      "mustache": "mustache"
     *    },
     *    "paths": undefined,
     *    "requirePaths": {
     *      'jquery': 'jquery',
     *      'can': 'can',
     *      'ejs': 'can/view/ejs/ejs',
     *      'stache': 'can/view/stache/stache',
     *      'mustache': 'can/view/mustache/mustache'
     *    },
     *    "filename": undefined,
     *    "version": undefined,
     *    "normalizer": undefined,
     *    "wrapper": 'module.exports = {{{content}}};',
     *    "wrapperForExternalTemplateFile": undefined,
     *    "cacheCanCompileScripts": true,
     *    "transformGlobally": true
     * }
     */
    this.options = {
      "extensions": {
        "stache": "stache",
        "ejs": "ejs",
        "mustache": "mustache"
      },
      "paths": undefined,
      "requirePaths": {
        'jquery': 'jquery',
        'can': 'can',
        'ejs': 'can/view/ejs/ejs',
        'stache': 'can/view/stache/stache',
        'mustache': 'can/view/mustache/mustache'
      },
      "filename": undefined,
      "version": undefined,
      "normalizer": undefined,
      "wrapper": 'module.exports = {{{content}}};',
      "wrapperForExternalTemplateFile": undefined,
      "cacheCanCompileScripts": true,
      "transformGlobally": true
    };

    /**
     * contains the passed browserify instance
     *
     * @property browserifyInstance
     * @type Browserify
     * @default undefined
     */
    this.browserifyInstance = undefined;
    
    /**
     * @property promise
     * @type Promise
     * @default Promise.resolve(this)
     */
    this.promise = Promise.resolve(this);
    
    if(!bundle || !bundle.pipeline) {
      throw new Error('The passed parameter "bundle" seems to be not a valid instance of "Browserify"!');
    }
    this.browserifyInstance = bundle;
    
    
    if(!options || !options.version) {
      throw new Error('Missing option "options.version"! Pass the currently used version of canJS.');
    }
    this.setOptions(options);
    
    if(this.constructor.isNone(this.options.normalizer)) {
      this.options.normalizer = this.getDefaultNormalizer();
    }

    if(this.constructor.isNone(this.options.paths) && true === this.options.cacheCanCompileScripts) {
      this.promise = new Promise((resolve, reject) => {
        const canCompileScriptsCacheManager = CanCompileScriptsCacheManager.getInstance();
        
        canCompileScriptsCacheManager.createCache(this.options.version).then(
          (files) => {
            this.setPaths(files);
            resolve(this);
          }, reject);
      });
    }
    
    this.extendBrowserifyPipeline();
  }

  /**
   * @method setOptions
   * @private
   * @chainable
   * @param {Object} options
   * @return {BrowserifyPluginCanCompile}
   */
  setOptions(options) {
    if('object' !== typeof options || Array.isArray(options)) {
      throw new Error('The passed parameter "options" must be an object!');
    }

    Array.prototype.forEach.call(Object.keys(options), (key, index) => {
      this.options[key] = options[key];
    });
    
    return this;
  }
  
  /**
   * @method getOptions
   * @private
   * @return {Object} Returns the options.
   */
  getOptions() {
    return this.options;
  }
  
  /**
   * @method shouldBeTransformedGlobally
   * @return {Boolean} Returns true, if options.global === true.
   */
  shouldBeTransformedGlobally() {
    return (true === this.options.transformGlobally);
  }
   
  /**
   * @method setPaths
   * @private
   * @chainable 
   * @param {Object} paths
   * @return {BrowserifyPluginCanCompile}
   */
  setPaths(paths) {
    if('object' !== typeof paths || Array.isArray(paths)) {
      throw new Error('The passed parameter "paths" must be an object!');
    }

    this.options.paths = paths;
    return this;
  }
  
  /**
   * @method getPaths
   * @private
   * @return {Array} Return an array of the path of the vendor scripts.
   */
  getPaths() {
    return this.options.paths;
  }

  /**
   * @method extendBrowserifyPipeline
   * @private
   */
  extendBrowserifyPipeline() {
    const instance = this.browserifyInstance;
    const transformOption = {
      "global": this.shouldBeTransformedGlobally()
    };
    
    instance.transform(BrowserifyPluginCanCompile.transform(this), transformOption);
  }
  
  /**
   * Creates a Regular Expressions for the defined template extensions.
   *
   * @method getFileExtensionRegExp
   * @private
   * @return {RegExp} Returns the generated Regular Expressions with capturing parentheses for
   *    filename and file extension
   */
  getFileExtensionRegExp() {
    const optionExtensions = this.options.extensions;
    
    if("object" !== typeof optionExtensions || Array.isArray(optionExtensions)) {
      throw new Error('Option "extensions" must be a key-value object!');
    }
    
    let flags = "i";
    let fileExtensions = Object.keys(this.options.extensions).map(function(item, index){
      return item.replace(new RegExp("[^\\w-]", flags), "");
    });
 
    return new RegExp("^.*\\" + path.sep + "([\\w-]+)\\.(" + fileExtensions.join("|") + ")$", flags);
  }

  /**
   * The normalizer returns a normalized key for the parsed template. With this key is it possible
   *    to call the template in the application. By default, the key is the filename of the template.
   *
   * The normalizer can be overwritten via plugin configuration. For more information please see
   *    at can-compile dokumentation: https://github.com/canjs/can-compile
   *
   * @method getDefaultNormalizer
   * @private
   * @return {String} Returns the key for the rendered can template.
   *
   * @see https://github.com/canjs/can-compile#programmatically
   */
  getDefaultNormalizer() {
    let fileExtRegEx = this.getFileExtensionRegExp();
 
    return function normalizer(file) {
      let filename;
      
      try {
        filename = (Array.prototype.splice.call(fileExtRegEx.exec(file), 1, 1)).join("");
      } catch(err) {
        filename = file;
      }
 
      return filename;
    };
  }

  /**
   * @method transform
   * @static
   * @private
   * @param {String} file path of the current file
   * @return {BrowserifyPluginCanCompile}
   */
  static transform(instance) {
    const currentInstance = instance;
    const fileExtRegEx = instance.getFileExtensionRegExp();
    
    return function transform(file) {
      if(!fileExtRegEx.test(file)) {
        return through2.obj();
      }
      
      return through2.obj(BrowserifyPluginCanCompile.transformFunction(currentInstance, file), BrowserifyPluginCanCompile.flushFunction(currentInstance));
    }
  }

  /**
   * @method transformFunction
   * @static
   * @private
   * @param {String} file
   * @return {Function} Returns the transform function
   */
  static transformFunction(instance, file) {
    const currentInstance = instance;
    const _file = file;

    return function transform(chunk, encoding, callback){
      currentInstance.promise.then((instance) => {
        let options = instance.getOptions();
        let currentWrapper = options.wrapper;
      
        if(!BrowserifyPluginCanCompile.isNone(options.filename)) {
          currentWrapper = options.wrapperForExternalTemplateFile;
        }
    
        canCompiler(_file, options, (err, result) => {
          if(err) {
            return callback(err);
          }
          let bufferedResult = new Buffer(result, "utf8");
    
          if(BrowserifyPluginCanCompile.isNone(options.filename)){
            chunk = bufferedResult;
          } else {
            Array.prototype.push.call(instance.buffer, bufferedResult);
            chunk = new Buffer("module.export = can.view('" + options.normalizer(_file) + "');", "utf8");
          }
          
          this.push(chunk);
          callback();
        });
      }, (error) => {
        callback(error);
      });
    }
  }
  
  /**
   * @method flushFunction
   * @static
   * @private
   * @return {Function} Returns the flush function
   */
  static flushFunction(instance) {
    const currentInstance = instance;
    
    return function flush(callback){
    
      currentInstance.promise.then((instance) => {
        let options = instance.getOptions();
    
        if(!BrowserifyPluginCanCompile.isNone(options.filename)) {
          let writeStream;
          let file = path.normalize(options.filename);
          let filePath = path.dirname(file);
      
          mkdirp.sync(filePath);
          writeStream = fs.createWriteStream(file, { "flags": "w", "defaultEncoding": "utf8" });
          writeStream.on('error', (error) => {
            callback(error);
          });
          
          Array.prototype.forEach.call(instance.buffer, function(item, index){
            writeStream.write(item);
          });
          
          writeStream.end();
        }
        this.push(null);
        callback();
      }, (error) => {
        callback(error);
      });
    }
  }

  /**
   * @method addPlugin
   * @static
   * @param {Browserify} bundle Browserify instance
   * @see https://github.com/substack/node-browserify#browserifyfiles--opts
   * @param {Object} options Can-compile options to influence the compile process. This options will
   *    be piped to the module "can-compile".
   * @see https://github.com/canjs/can-compile#programmatically
   * @return {BrowserifyPluginCanCompile}
   */
  static addPlugin(bundle, options) {
    return new BrowserifyPluginCanCompile(bundle, options);
  }

  /**
   * Returns true if the passed value is null or undefined.
   *
   * ```javascript
   * BrowserifyPluginCanCompile.isNone();              // true
   * BrowserifyPluginCanCompile.isNone(null);          // true
   * BrowserifyPluginCanCompile.isNone(undefined);     // true
   * BrowserifyPluginCanCompile.isNone('');            // false
   * BrowserifyPluginCanCompile.isNone([]);            // false
   * BrowserifyPluginCanCompile.isNone(function() {});  // false
   * ```
   * @method isNone
   * @private
   * @static
   * @param {mixed} obj Value to test
   * @return {Boolean}
   */
  static isNone(obj) {
    return obj === null || obj === undefined;
  }
}

export default BrowserifyPluginCanCompile.addPlugin;