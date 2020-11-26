/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BrowserifyPluginCanCompile = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _canCompile = require('can-compile');

var _canCompile2 = _interopRequireDefault(_canCompile);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _CanCompileScriptsCacheManager = require('./library/CanCompileScriptsCacheManager');

var _CanCompileScriptsCacheManager2 = _interopRequireDefault(_CanCompileScriptsCacheManager);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Polyfill
_es6Promise2.default.polyfill();

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

var BrowserifyPluginCanCompile = exports.BrowserifyPluginCanCompile = function () {
  /**
   *
   * @constructor
   * @param {Browserify} bundle Browserify instance
   * @see https://github.com/substack/node-browserify#browserifyfiles--opts
   * @param {Object} options Can-compile options to influence the compile process. This options will
   *    be piped to the module "can-compile".
   * @see https://github.com/canjs/can-compile#programmatically
   */
  function BrowserifyPluginCanCompile(bundle, options) {
    var _this = this;

    _classCallCheck(this, BrowserifyPluginCanCompile);

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

    if (!bundle || !bundle.pipeline) {
      throw new Error('The passed parameter "bundle" seems to be not a valid instance of "Browserify"!');
    }
    this.browserifyInstance = bundle;

    if (!options || !options.version) {
      throw new Error('Missing option "options.version"! Pass the currently used version of canJS.');
    }
    this.setOptions(options);

    if (this.constructor.isNone(this.options.normalizer)) {
      this.options.normalizer = this.getDefaultNormalizer();
    }

    if (this.constructor.isNone(this.options.paths) && true === this.options.cacheCanCompileScripts) {
      this.promise = new Promise(function (resolve, reject) {
        var canCompileScriptsCacheManager = _CanCompileScriptsCacheManager2.default.getInstance();

        canCompileScriptsCacheManager.createCache(_this.options.version).then(function (files) {
          _this.setPaths(files);
          resolve(_this);
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


  _createClass(BrowserifyPluginCanCompile, [{
    key: 'setOptions',
    value: function setOptions(options) {
      var _this2 = this;

      if ('object' !== (typeof options === 'undefined' ? 'undefined' : _typeof(options)) || Array.isArray(options)) {
        throw new Error('The passed parameter "options" must be an object!');
      }

      Array.prototype.forEach.call(Object.keys(options), function (key, index) {
        _this2.options[key] = options[key];
      });

      return this;
    }

    /**
     * @method getOptions
     * @private
     * @return {Object} Returns the options.
     */

  }, {
    key: 'getOptions',
    value: function getOptions() {
      return this.options;
    }

    /**
     * @method shouldBeTransformedGlobally
     * @return {Boolean} Returns true, if options.global === true.
     */

  }, {
    key: 'shouldBeTransformedGlobally',
    value: function shouldBeTransformedGlobally() {
      return true === this.options.transformGlobally;
    }

    /**
     * @method setPaths
     * @private
     * @chainable 
     * @param {Object} paths
     * @return {BrowserifyPluginCanCompile}
     */

  }, {
    key: 'setPaths',
    value: function setPaths(paths) {
      if ('object' !== (typeof paths === 'undefined' ? 'undefined' : _typeof(paths)) || Array.isArray(paths)) {
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

  }, {
    key: 'getPaths',
    value: function getPaths() {
      return this.options.paths;
    }

    /**
     * @method extendBrowserifyPipeline
     * @private
     */

  }, {
    key: 'extendBrowserifyPipeline',
    value: function extendBrowserifyPipeline() {
      var instance = this.browserifyInstance;
      var transformOption = {
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

  }, {
    key: 'getFileExtensionRegExp',
    value: function getFileExtensionRegExp() {
      var optionExtensions = this.options.extensions;

      if ("object" !== (typeof optionExtensions === 'undefined' ? 'undefined' : _typeof(optionExtensions)) || Array.isArray(optionExtensions)) {
        throw new Error('Option "extensions" must be a key-value object!');
      }

      var flags = "i";
      var fileExtensions = Object.keys(this.options.extensions).map(function (item, index) {
        return item.replace(new RegExp("[^\\w-]", flags), "");
      });

      return new RegExp("^.*\\" + _path2.default.sep + "([\\w-]+)\\.(" + fileExtensions.join("|") + ")$", flags);
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

  }, {
    key: 'getDefaultNormalizer',
    value: function getDefaultNormalizer() {
      var fileExtRegEx = this.getFileExtensionRegExp();

      return function normalizer(file) {
        var filename = void 0;

        try {
          filename = Array.prototype.splice.call(fileExtRegEx.exec(file), 1, 1).join("");
        } catch (err) {
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

  }], [{
    key: 'transform',
    value: function transform(instance) {
      var currentInstance = instance;
      var fileExtRegEx = instance.getFileExtensionRegExp();

      return function transform(file) {
        if (!fileExtRegEx.test(file)) {
          return _through2.default.obj();
        }

        return _through2.default.obj(BrowserifyPluginCanCompile.transformFunction(currentInstance, file), BrowserifyPluginCanCompile.flushFunction(currentInstance));
      };
    }

    /**
     * @method transformFunction
     * @static
     * @private
     * @param {String} file
     * @return {Function} Returns the transform function
     */

  }, {
    key: 'transformFunction',
    value: function transformFunction(instance, file) {
      var currentInstance = instance;
      var _file = file;

      return function transform(chunk, encoding, callback) {
        var _this3 = this;

        currentInstance.promise.then(function (instance) {
          var options = instance.getOptions();
          var currentWrapper = options.wrapper;

          if (!BrowserifyPluginCanCompile.isNone(options.filename)) {
            currentWrapper = options.wrapperForExternalTemplateFile;
          }

          (0, _canCompile2.default)(_file, options, function (err, result) {
            if (err) {
              return callback(err);
            }
            var bufferedResult = new Buffer(result, "utf8");

            if (BrowserifyPluginCanCompile.isNone(options.filename)) {
              chunk = bufferedResult;
            } else {
              Array.prototype.push.call(instance.buffer, bufferedResult);
              chunk = new Buffer("module.export = can.view('" + options.normalizer(_file) + "');", "utf8");
            }

            _this3.push(chunk);
            callback();
          });
        }, function (error) {
          callback(error);
        });
      };
    }

    /**
     * @method flushFunction
     * @static
     * @private
     * @return {Function} Returns the flush function
     */

  }, {
    key: 'flushFunction',
    value: function flushFunction(instance) {
      var currentInstance = instance;

      return function flush(callback) {
        var _this4 = this;

        currentInstance.promise.then(function (instance) {
          var options = instance.getOptions();

          if (!BrowserifyPluginCanCompile.isNone(options.filename)) {
            var writeStream = void 0;
            var file = _path2.default.normalize(options.filename);
            var filePath = _path2.default.dirname(file);

            mkdirp.sync(filePath);
            writeStream = _fs2.default.createWriteStream(file, { "flags": "w", "defaultEncoding": "utf8" });
            writeStream.on('error', function (error) {
              callback(error);
            });

            Array.prototype.forEach.call(instance.buffer, function (item, index) {
              writeStream.write(item);
            });

            writeStream.end();
          }
          _this4.push(null);
          callback();
        }, function (error) {
          callback(error);
        });
      };
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

  }, {
    key: 'addPlugin',
    value: function addPlugin(bundle, options) {
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

  }, {
    key: 'isNone',
    value: function isNone(obj) {
      return obj === null || obj === undefined;
    }
  }]);

  return BrowserifyPluginCanCompile;
}();

exports.default = BrowserifyPluginCanCompile.addPlugin;