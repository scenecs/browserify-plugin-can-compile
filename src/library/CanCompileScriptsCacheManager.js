/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

import es6Promise from 'es6-promise';
import semver from 'semver';
import CanCompileScriptsCache from './CanCompileScriptsCache';

// Polyfill
es6Promise.polyfill();

/**
 * CanCompileScriptsCacheManager
 * ==============================
 *
 *
 *
 *
 *
 *
 * @class CanCompileScriptsCacheManager
 */
export default class CanCompileScriptsCacheManager {
  
  /**
   * @constructor
   * @private
   */
  constructor() {
    /**
     * @property caches
     * @type Array
     * @default []
     */
    this.caches = [];
  }
  
  /**
   * @method create
   * @param {String} version
   * @param {Object} options
   * @return {Romise} Returns an instance of the Promise for the corresponding caching task based on
   *  the canJS version.
   */
  createCache(...args){
    const [version, options] = [...args];
    let cachePromise;

    if(!semver.valid(version)) {
      throw new Error('The passed version is not valid: "' + version + '"')
    }

    if(Array.prototype.indexOf.call(this.caches, version)) {
      cachePromise = this.caches[version];
    }

    if(!cachePromise) {
      this.caches[version] = cachePromise = new Promise((resolve, reject) => {
        const instance = CanCompileScriptsCache.createCache(version, options);

        /* istanbul ignore next */
        instance.on("finish", (files) => {
          resolve(files);
        });
        
        /* istanbul ignore next */
        instance.on('error', (error) => {
          reject(error);
        });
      });
    }

    return cachePromise;
  }

  /**
   * @method getInstance
   * @static
   * @retun {CanCompileScriptsCacheManager} Returns an instance of the CanCompileScriptsCacheManager.
   */
  static getInstance() {
    if(!this.instance) {
      this.instance = new CanCompileScriptsCacheManager();
    }
    
    return this.instance;
  }
}

module.exports = CanCompileScriptsCacheManager;