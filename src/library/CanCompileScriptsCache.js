/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

import fs from 'fs';
import path from 'path';
import http from 'follow-redirects/http';
import semver from 'semver';
import mkdirp from 'mkdirp';
import es6Promise from 'es6-promise';
import EventEmitter from 'events';
import canCompileResolveScripts from 'can-compile/lib/resolveScripts';

// Polyfill
es6Promise.polyfill();


const CACHE_DIR_NAME = "node_modules/.can_compile_cache";

/**
 * CanCompileScriptsCache
 * =======================
 *
 *
 *
 *
 *
 *
 * @class CanCompileScriptsCache
 */
export default class CanCompileScriptsCache extends EventEmitter {
  /**
   * @constructor
   * @param {String} version
   * @param {Object} options
   */
  constructor(...args) {
    super();
    
    const [version, options] = [...args];

    /**
     * Contains the current version of canJS
     *
     * @property version
     * @type String
     * @default undefined
     */
    this.version = undefined;
    
    /**
     * Contains the path to the cached files
     *
     * @property cachePath
     * @type String
     * @default undefined
     */
    this.cachePath = undefined;

    /**
     * @property neededVendorScripts
     * @type Array
     * @default undefined
     */
    this.neededVendorScripts = undefined;
    
    /**
     * Contains the paths to the cached files
     *
     * @property cachedFiles
     * @type Array
     * @default []
     */
    this.cachedFiles = [];

    if(!semver.valid(version)) {
      throw new Error('The passed version is not valid: "' + version + '"')
    }
    
    this.version = version;

    this.setCachePath();
    this.setNeededVendorScripts(CanCompileScriptsCache.getListOfVendorScripts(this.version));
  }
  
  /**
   * @method getVersion
   * @return {String} Returns the version.
   */
  getVersion() {
    return this.version;
  }

  /**
   * Set the target directory for the cached files. If the optional parameter "path" is set, then
   * the passed path will be used. Otherwise the default cache path will be used.
   *
   * @method setCachePath
   * @private
   * @chainable
   * @param {undefined|String} [target] 
   * @return {CanCompileScriptsCache}
   */
  setCachePath(target) {
    
    if('string' === typeof target && 0 < target.length) {
      this.cachePath = target;
    } else {
      this.cachePath = path.resolve(process.cwd(), CACHE_DIR_NAME, this.version);
    }
    return this;
  }
  
  /**
   * @method getCachePath
   * @return {String} Returns the path to the cached files of the current version.
   */
  getCachePath() {
    return this.cachePath;
  }
  
  /**
   * @method setNeededVendorScripts
   * @chainable
   * @param {Array} urlList
   * @return {CanCompileScriptsCache}
   */
  setNeededVendorScripts(urlList) {
    if(Array.isArray(urlList)) {
      this.neededVendorScripts = urlList;
    }
    return this;
  }
  
  
  /**
   * @method getNeededVendorScripts
   * @return {Array} Returns a list of urls to the vendor scripts
   */
  getNeededVendorScripts(){
    return this.neededVendorScripts || [];
  }
  
  /**
   * @method setCachedFiles
   * @chainable
   * @param {Array} files
   * @return {}
   */
  setCachedFiles(files) {
    if(Array.isArray(files)) {
      this.cachedFiles = files;
    }
    
    return this;
  }
  
  /**
   * @method getCachedFiles
   * @return {Array} Returns a list of paths of the cached files.
   */
  getCachedFiles() {
    return this.cachedFiles;
  }
  
  /**
   * @method readCachedFiles
   * @return {Promise} On Resolve a list of cached files are returned. On Reject the error is
   *    returned.
   */
  readCachedFiles() {
    return new Promise((resolve, reject) => {
      const cachePath = this.getCachePath();
      
      fs.readdir(cachePath, (error, files) => {
        if(error) {
          return reject(error);
        }

        return resolve(Array.prototype.map.call(files, (file, index) => {
          return path.resolve(cachePath, file);
        }));
      });
    });
  }
  
  /**
   * @method cacheVendorScripts
   * @chainable
   * @return {Promise}
   */
  cacheVendorScripts() {
    const cachePath = this.getCachePath();

    return new Promise((resolve, reject) => {
      (this.readCachedFiles()).then((files) => {
        this.setCachedFiles(files);
        this.emit('finish', CanCompileScriptsCache.convertToCanCompilePathsObject(this.getCachedFiles()));
        resolve(CanCompileScriptsCache.convertToCanCompilePathsObject(this.getCachedFiles()));
      }, (error) => {
        mkdirp.sync(this.getCachePath());
        (Promise.all(Array.prototype.map.call(this.getNeededVendorScripts(), (url, index) => {
          const filename = CanCompileScriptsCache.getFilenameFromUrl(url);
          
          if(!filename) {
            return Promise.reject(new Error('Invalid filename: "' + filename + '"'));
          }

          const target = path.resolve(cachePath, filename);
          
          console.info('    Download file: ' + filename + ' ("' + url + '")');

          return CanCompileScriptsCache.downloadVendorScript(url, target);
        }))).then((files) => {
            this.setCachedFiles(files);
            console.info('    Download finished.');
            this.emit('finish', CanCompileScriptsCache.convertToCanCompilePathsObject(this.getCachedFiles()));
            resolve(CanCompileScriptsCache.convertToCanCompilePathsObject(this.getCachedFiles()));
          }, (error) => {
            console.error('    Download failed: ' + error);
            this.emit('error', error);
            reject(error);
          });
      });
    });
  }

  /**
   * @method create
   * @static
   * @param {String} version
   * @param {Object} options
   * @return {CanCompileScriptsCache} Return the instance.
   */
  static createCache(...args){
    let instance = new CanCompileScriptsCache(...args);

    instance.cacheVendorScripts();

    return instance;
  }
  
  /**
   * @method downloadVendorScript
   * @static
   * @param {String} url
   * @param {String} target
   * @return {Promise} Returns a promise.
   */
  static downloadVendorScript(url, target) {
    return new Promise((resolve, reject) => {
      if(!(new RegExp('^(https?|ftp)://[^\\s/$.?#].[^\\s]*$', 'i')).test(url)) {
        return reject(new Error('In-valid url: ' + url + '!'));
      }
      
      let fileWriteStream = fs.createWriteStream(target, {
        "defaultEncoding": "utf8"
      });

      /* istanbul ignore next */
      let request = http.get(url, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          if(400 > res.statusCode) {
            fileWriteStream.write(chunk);
          }
        });
        res.on('end', () => {
          fileWriteStream.end();
          resolve(target);
        });
      });

      /* istanbul ignore next */
      request.on('error', (error) => {
        reject(error);
      });
    })
  }


  /**
   * Ask the node module "can-compile" based on a specific version, which vendor scripts are needed.
   *
   * @method getListOfVendorScripts
   * @static
   * @param {String} version
   * @return {Object} Returns a collection of vendor scripts.
   */
  static getListOfVendorScripts(version) {
    if(semver.valid(version)) {
      return canCompileResolveScripts(version);
    }
    
    return [];
  }
  
  /**
   * Extract the filename from the url of a static vendor script. If the url don't finish with a
   * valid filename (like "jQuery.js"), "getFilenameFromUrl" returns "undefined".
   *
   * ´´´
   *  
   * ´´´
   *
   * @method getFilenameFromUrl
   * @private
   * @static
   * @param {String} url
   * @return {undefined|String} Returns the filename.
   */
  static getFilenameFromUrl(url) {
    if('string' !== typeof url) {
      return undefined;
    }
    
    const filename = Array.prototype.pop.call(url.split("/"));
    return (-1 < filename.indexOf(".")) ? filename : undefined;
  }

  /**
   * @static
   * @param {Array} files
   * @return {Object} Returns the expected can-compile paths object.
   */
  static convertToCanCompilePathsObject(files) {
    if(!(Array.isArray(files) && files.length > 0)) {
      throw new Error('The passed parameter "cachedFiles" must be an array!');
    }

    const pathsObject = {};

    Array.prototype.map.call(files, (file, index) => {
      const scriptType = CanCompileScriptsCache.getScriptType(file);

      if(scriptType) {
        pathsObject[scriptType] = file;
      }
    });
    
    return pathsObject;
  }
  
  /**
   * @private
   * @static
   * @param {string} filePath
   * @return {string} Returns the type of the script.
   */
  static getScriptType(filePath) {
      const filename = CanCompileScriptsCache.getFilenameFromUrl(filePath);
      
      if(filename.indexOf('/jquery') > -1) {
          return 'jquery';
      }

      if(filename.indexOf('ejs') > -1) {
          return 'ejs';
      }

      if(filename.indexOf('mustache') > -1) {
          return 'mustache';
      }

      if(filename.indexOf('stache') > -1) {
          return 'stache';
      }

      if(filename.indexOf('/can') > -1) {
          return 'can';
      }

      return undefined;
  }
}

module.exports = CanCompileScriptsCache;