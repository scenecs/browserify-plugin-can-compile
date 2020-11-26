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

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _CanCompileScriptsCache = require('./CanCompileScriptsCache');

var _CanCompileScriptsCache2 = _interopRequireDefault(_CanCompileScriptsCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Polyfill
_es6Promise2.default.polyfill();

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

var CanCompileScriptsCacheManager = function () {

  /**
   * @constructor
   * @private
   */
  function CanCompileScriptsCacheManager() {
    _classCallCheck(this, CanCompileScriptsCacheManager);

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


  _createClass(CanCompileScriptsCacheManager, [{
    key: 'createCache',
    value: function createCache() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var _ref = [].concat(args),
          version = _ref[0],
          options = _ref[1];

      var cachePromise = void 0;

      if (!_semver2.default.valid(version)) {
        throw new Error('The passed version is not valid: "' + version + '"');
      }

      if (Array.prototype.indexOf.call(this.caches, version)) {
        cachePromise = this.caches[version];
      }

      if (!cachePromise) {
        this.caches[version] = cachePromise = new Promise(function (resolve, reject) {
          var instance = _CanCompileScriptsCache2.default.createCache(version, options);

          /* istanbul ignore next */
          instance.on("finish", function (files) {
            resolve(files);
          });

          /* istanbul ignore next */
          instance.on('error', function (error) {
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

  }], [{
    key: 'getInstance',
    value: function getInstance() {
      if (!this.instance) {
        this.instance = new CanCompileScriptsCacheManager();
      }

      return this.instance;
    }
  }]);

  return CanCompileScriptsCacheManager;
}();

exports.default = CanCompileScriptsCacheManager;


module.exports = CanCompileScriptsCacheManager;