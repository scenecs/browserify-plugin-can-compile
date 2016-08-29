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
import CanCompileScriptsCache from './library/CanCompileScriptsCache';
import es6Promise from 'es6-promise';

// Polyfill
es6Promise.polyfill();


/**
 * @property instance
 * @private
 * @static
 * @type BrowserifyPluginCanCompile
 * @default undefined
 */
let instance;

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
 *  import BrowserifyPluginCanCompile from 'browserify-plugin-can-compile';
 *
 *  let b = browserify();
 *
 *  b.add('./app.js')
 *   .plugin(BrowserifyPluginCanCompile.compile, {
 *      "filename": "./views-app.js"
 *    })
 *   .bundle().pipe(process.stdout);
 * ```
 *
 * @class BrowserifyPluginCanCompile
 */
export default class BrowserifyPluginCanCompile {
  /**
   *
   * @constructor
   * @param {Browserify} bundle Browserify instance
   * @see https://github.com/substack/node-browserify#browserifyfiles--opts
   * @param {Object} options Can-compile options to influence the compile process. This options will
   *    be piped to the module "can-compile".
   * @see https://github.com/canjs/can-compile#programmatically
   */
  constructor(bundle, options){
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
     *   "extensions": {
     *     "stache": "stache",
     *     "ejs": "ejs",
     *     "mustache": "mustache"
     *   }
     * }
     */
    this.options = {
      "extensions": {
        "stache": "stache",
        "ejs": "ejs",
        "mustache": "mustache"
      },
      "paths": undefined,
      "filename": undefined,
      "version": undefined,
      "normalizer": undefined,
      "wrapper": 'module.exports = {{{content}}};',
      "wrapperForExternalTemplateFile": undefined,
      "cacheCanCompileScripts": true
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
     * @default new Promise((resolve, reject) => {})
     */
    this.promise = new Promise((resolve, reject) => {});
    
    if(!bundle || !bundle.pipeline) {
      throw new Error('The passed parameter "bundle" seems to be not a valid instance of "Browserify"!');
    }
    
    if(!options || !options.version) {
      throw new Error('Missing option "options.version"! Pass the currently used version of canJS.');
    }

    this.browserifyInstance = bundle;
    this.setOptions(options);
    
    if(this.constructor.isNone(this.options.normalizer)) {
      this.options.normalizer = this.getDefaultNormalizer();
    }

    if(this.constructor.isNone(this.options.paths) && true === this.options.cacheCanCompileScripts) {
      let canCompileScriptsCache = CanCompileScriptsCache.createCache(this.options.version);

      /* istanbul ignore next */
      canCompileScriptsCache.on("ready", (instance) => {
        this.setPaths(instance.getPaths());
        this.promise = Promise.resolve();
      });
      
      /* istanbul ignore next */
      canCompileScriptsCache.on('error', (error) => {
        this.promise = Promise.reject(error);
      });
    }
    
    this.extendBrowserifyPipeline();
  }

  /**
   * @method extendBrowserifyPipeline
   * @private
   */
  extendBrowserifyPipeline() {
    let bundle = this.browserifyInstance;
    // Browserify has an internal labeled-stream-splicer pipeline.
    // The Stream will be extended the state "deps".
    bundle.pipeline.get("deps").splice(1, 0, through2.obj(this.constructor.transformFunction, this.constructor.flushFunction));
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
   * @method setPaths
   * @private
   * @chainable 
   * @param {Array} paths
   * @return {BrowserifyPluginCanCompile}
   */
  setPaths(paths) {
    if(!Array.isArray(paths)) {
      throw new Error('The passed parameter "paths" must be an array!');
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
    
    let flags = "ig";
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
 
    return function normalizer(file){
      let filename;
 
      try {
        filename = (fileExtRegEx.exec(file))[1];
      } catch(err) {
        filename = file;
      }
 
      return filename;
    }
  }

  /**
   * @method compile
   * @static
   * @param {Browserify} bundle Browserify instance
   * @see https://github.com/substack/node-browserify#browserifyfiles--opts
   * @param {Object} options Can-compile options to influence the compile process. This options will
   *    be piped to the module "can-compile".
   * @see https://github.com/canjs/can-compile#programmatically
   * @return {BrowserifyPluginCanCompile}
   */
  static compile(bundle, options) {
    if(!instance) {
      instance = new BrowserifyPluginCanCompile(bundle, options);
    }
    
    return instance;
  }
  
  /**
   * @method getInstance
   * @static
   * @return {BrowserifyPluginCanCompile} Returns the current instance
   */
  static getInstance() {
    return instance;
  }
  
  /**
   * @method reset
   * @static
   */
  static reset() {
    instance = undefined;
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
  
  /**
   * @method transformFunction
   * @private
   * @static
   * @param {String|Buffer} chunk
   * @param {String} encoding
   * @param {Function} callback
   */
  /* istanbul ignore next */
  static transformFunction(chunk, encoding, callback) {
    let currentInstance = BrowserifyPluginCanCompile.getInstance();
    let options = currentInstance.getOptions();
    let file = chunk["id"];
    let fileExtRegEx = currentInstance.getFileExtensionRegExp();
    let currentWrapper = options.wrapper;
  
    if(fileExtRegEx.test(file)) {
  
      if(!BrowserifyPluginCanCompile.isNone(options.filename)) {
        currentWrapper = options.wrapperForExternalTemplateFile;
      }

      canCompiler(file, options, (err, result) => {
        if(err) {
          return callback(err);
        }
  
        let bufferedResult = new Buffer(result);
  
        if(BrowserifyPluginCanCompile.isNone(options.filename)){
          chunk["source"] = bufferedResult;
        } else {
          Array.prototype.push.call(currentInstance.buffer, bufferedResult);
          chunk["source"] = "module.export = can.view('" + options.normalizer(file) + "');";
        }
        
        this.push(chunk);
        callback();
      });
      return;
    }

    this.push(chunk);
    callback();
  }
  
  /**
   * @method flushFunction
   * @private
   * @static
   * @param {Function} callback(error)
   */
  /* istanbul ignore next */
  static flushFunction(callback) {
    let currentInstance = BrowserifyPluginCanCompile.getInstance();
    let options = currentInstance.getOptions();

    if(!BrowserifyPluginCanCompile.isNone(options.filename)) {
      let writeStream;
      let file = path.normalize(options.filename);
      let filePath = path.dirname(file);
  
      mkdirp.sync(filePath);
      writeStream = fs.createWriteStream(file, { "flags": "w", "defaultEncoding": "utf8" });
      writeStream.on('error', (error) => {
        callback(error);
      });
      
      Array.prototype.forEach.call(currentInstance.buffer, function(item, index){
        writeStream.write(item);
      });
      
      writeStream.end();
    }
    this.push(null);
    callback();
  }
}

module.exports = BrowserifyPluginCanCompile;