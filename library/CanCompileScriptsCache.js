/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _http = require('follow-redirects/http');

var _http2 = _interopRequireDefault(_http);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _resolveScripts = require('can-compile/lib/resolveScripts');

var _resolveScripts2 = _interopRequireDefault(_resolveScripts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Polyfill
_es6Promise2.default.polyfill();

var CACHE_DIR_NAME = "node_modules/.can_compile_cache";

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

var CanCompileScriptsCache = function (_EventEmitter) {
  _inherits(CanCompileScriptsCache, _EventEmitter);

  /**
   * @constructor
   * @param {String} version
   * @param {Object} options
   */
  function CanCompileScriptsCache() {
    _classCallCheck(this, CanCompileScriptsCache);

    var _this = _possibleConstructorReturn(this, (CanCompileScriptsCache.__proto__ || Object.getPrototypeOf(CanCompileScriptsCache)).call(this));

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _ref = [].concat(args),
        version = _ref[0],
        options = _ref[1];

    /**
     * Contains the current version of canJS
     *
     * @property version
     * @type String
     * @default undefined
     */


    _this.version = undefined;

    /**
     * Contains the path to the cached files
     *
     * @property cachePath
     * @type String
     * @default undefined
     */
    _this.cachePath = undefined;

    /**
     * @property neededVendorScripts
     * @type Array
     * @default undefined
     */
    _this.neededVendorScripts = undefined;

    /**
     * Contains the paths to the cached files
     *
     * @property cachedFiles
     * @type Array
     * @default []
     */
    _this.cachedFiles = [];

    if (!_semver2.default.valid(version)) {
      throw new Error('The passed version is not valid: "' + version + '"');
    }

    _this.version = version;

    _this.setCachePath();
    _this.setNeededVendorScripts(CanCompileScriptsCache.getListOfVendorScripts(_this.version));
    return _this;
  }

  /**
   * @method getVersion
   * @return {String} Returns the version.
   */


  _createClass(CanCompileScriptsCache, [{
    key: 'getVersion',
    value: function getVersion() {
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

  }, {
    key: 'setCachePath',
    value: function setCachePath(target) {

      if ('string' === typeof target && 0 < target.length) {
        this.cachePath = target;
      } else {
        this.cachePath = _path2.default.resolve(process.cwd(), CACHE_DIR_NAME, this.version);
      }
      return this;
    }

    /**
     * @method getCachePath
     * @return {String} Returns the path to the cached files of the current version.
     */

  }, {
    key: 'getCachePath',
    value: function getCachePath() {
      return this.cachePath;
    }

    /**
     * @method setNeededVendorScripts
     * @chainable
     * @param {Array} urlList
     * @return {CanCompileScriptsCache}
     */

  }, {
    key: 'setNeededVendorScripts',
    value: function setNeededVendorScripts(urlList) {
      if (Array.isArray(urlList)) {
        this.neededVendorScripts = urlList;
      }
      return this;
    }

    /**
     * @method getNeededVendorScripts
     * @return {Array} Returns a list of urls to the vendor scripts
     */

  }, {
    key: 'getNeededVendorScripts',
    value: function getNeededVendorScripts() {
      return this.neededVendorScripts || [];
    }

    /**
     * @method setCachedFiles
     * @chainable
     * @param {Array} files
     * @return {}
     */

  }, {
    key: 'setCachedFiles',
    value: function setCachedFiles(files) {
      if (Array.isArray(files)) {
        this.cachedFiles = files;
      }

      return this;
    }

    /**
     * @method getCachedFiles
     * @return {Array} Returns a list of paths of the cached files.
     */

  }, {
    key: 'getCachedFiles',
    value: function getCachedFiles() {
      return this.cachedFiles;
    }

    /**
     * @method readCachedFiles
     * @return {Promise} On Resolve a list of cached files are returned. On Reject the error is
     *    returned.
     */

  }, {
    key: 'readCachedFiles',
    value: function readCachedFiles() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var cachePath = _this2.getCachePath();

        _fs2.default.readdir(cachePath, function (error, files) {
          if (error) {
            return reject(error);
          }

          return resolve(Array.prototype.map.call(files, function (file, index) {
            return _path2.default.resolve(cachePath, file);
          }));
        });
      });
    }

    /**
     * @method cacheVendorScripts
     * @chainable
     * @return {Promise}
     */

  }, {
    key: 'cacheVendorScripts',
    value: function cacheVendorScripts() {
      var _this3 = this;

      var cachePath = this.getCachePath();

      return new Promise(function (resolve, reject) {
        _this3.readCachedFiles().then(function (files) {
          _this3.setCachedFiles(files);
          _this3.emit('finish', CanCompileScriptsCache.convertToCanCompilePathsObject(_this3.getCachedFiles()));
          resolve(CanCompileScriptsCache.convertToCanCompilePathsObject(_this3.getCachedFiles()));
        }, function (error) {
          _mkdirp2.default.sync(_this3.getCachePath());
          Promise.all(Array.prototype.map.call(_this3.getNeededVendorScripts(), function (url, index) {
            var filename = CanCompileScriptsCache.getFilenameFromUrl(url);

            if (!filename) {
              return Promise.reject(new Error('Invalid filename: "' + filename + '"'));
            }

            var target = _path2.default.resolve(cachePath, filename);

            console.info('    Download file: ' + filename + ' ("' + url + '")');

            return CanCompileScriptsCache.downloadVendorScript(url, target);
          })).then(function (files) {
            _this3.setCachedFiles(files);
            console.info('    Download finished.');
            _this3.emit('finish', CanCompileScriptsCache.convertToCanCompilePathsObject(_this3.getCachedFiles()));
            resolve(CanCompileScriptsCache.convertToCanCompilePathsObject(_this3.getCachedFiles()));
          }, function (error) {
            console.error('    Download failed: ' + error);
            _this3.emit('error', error);
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

  }], [{
    key: 'createCache',
    value: function createCache() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var instance = new (Function.prototype.bind.apply(CanCompileScriptsCache, [null].concat(args)))();

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

  }, {
    key: 'downloadVendorScript',
    value: function downloadVendorScript(url, target) {
      return new Promise(function (resolve, reject) {
        if (!new RegExp('^(https?|ftp)://[^\\s/$.?#].[^\\s]*$', 'i').test(url)) {
          return reject(new Error('In-valid url: ' + url + '!'));
        }

        var fileWriteStream = _fs2.default.createWriteStream(target, {
          "defaultEncoding": "utf8"
        });

        /* istanbul ignore next */
        var request = _http2.default.get(url, function (res) {
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            if (400 > res.statusCode) {
              fileWriteStream.write(chunk);
            }
          });
          res.on('end', function () {
            fileWriteStream.end();
            resolve(target);
          });
        });

        /* istanbul ignore next */
        request.on('error', function (error) {
          reject(error);
        });
      });
    }

    /**
     * Ask the node module "can-compile" based on a specific version, which vendor scripts are needed.
     *
     * @method getListOfVendorScripts
     * @static
     * @param {String} version
     * @return {Object} Returns a collection of vendor scripts.
     */

  }, {
    key: 'getListOfVendorScripts',
    value: function getListOfVendorScripts(version) {
      if (_semver2.default.valid(version)) {
        return (0, _resolveScripts2.default)(version);
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

  }, {
    key: 'getFilenameFromUrl',
    value: function getFilenameFromUrl(url) {
      if ('string' !== typeof url) {
        return undefined;
      }

      var filename = Array.prototype.pop.call(url.split("/"));
      return -1 < filename.indexOf(".") ? filename : undefined;
    }

    /**
     * @static
     * @param {Array} files
     * @return {Object} Returns the expected can-compile paths object.
     */

  }, {
    key: 'convertToCanCompilePathsObject',
    value: function convertToCanCompilePathsObject(files) {
      if (!(Array.isArray(files) && files.length > 0)) {
        throw new Error('The passed parameter "cachedFiles" must be an array!');
      }

      var pathsObject = {};

      Array.prototype.map.call(files, function (file, index) {
        var scriptType = CanCompileScriptsCache.getScriptType(file);

        if (scriptType) {
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

  }, {
    key: 'getScriptType',
    value: function getScriptType(filePath) {
      var filename = CanCompileScriptsCache.getFilenameFromUrl(filePath);

      if (filename.indexOf('/jquery') > -1) {
        return 'jquery';
      }

      if (filename.indexOf('ejs') > -1) {
        return 'ejs';
      }

      if (filename.indexOf('mustache') > -1) {
        return 'mustache';
      }

      if (filename.indexOf('stache') > -1) {
        return 'stache';
      }

      if (filename.indexOf('/can') > -1) {
        return 'can';
      }

      return undefined;
    }
  }]);

  return CanCompileScriptsCache;
}(_events2.default);

exports.default = CanCompileScriptsCache;


module.exports = CanCompileScriptsCache;