/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

var extend = require("extend"),
    through2 = require("through2"),
    canCompiler = require("can-compile"),
    fs = require("fs"),
    path = require("path"),
    mkdirp = require("mkdirp"),


    /**
     * can-compile needs jQuery and canJs to compile the templates. By default, it loads all files
     * from the internet. Thus always an Internet connection necessary.
     *
     * The attribute "isVendorScriptsInstalled" is true, if the needed vendors are installed.
     *
     * This browserify plugin expects the following file structure for the vendors:
     *    - vendor/jquery
     *    - vendor/canjs
     *
     * @attribute isVendorScriptsInstalled
     * @type boolean
     * @default false
     */
    isVendorScriptsInstalled = false,
    
    /**
     * Returns true if the passed value is null or undefined.
     *
     * ```javascript
     * isNone();              // true
     * isNone(null);          // true
     * isNone(undefined);     // true
     * isNone('');            // false
     * isNone([]);            // false
     * isNone(function() {});  // false
     * ```
     * @method isNone
     * @private
     * @param {mixed} obj Value to test
     * @return {Boolean}
     */
    isNone = function isNone(obj) {
      return obj === null || obj === undefined;
    },

    /**
     * Creates a Regular Expressions for the defined template extensions.
     *
     * @method createFileExtensionRegExp
     * @private
     * @param {String|Array} fileExtensions Extensions as string list or array list
     * @return {RegExp} Returns the generated Regular Expressions with capturing parentheses for
     *    filename and file extension
     */
    createFileExtensionRegExp = function createFileExtensionRegExp(fileExtensions){
      var _fileExtensions = [],
          _flags = "ig";

      if(Array.isArray(fileExtensions)) {
        _fileExtensions = fileExtensions;
      }
      
      if("string" == typeof fileExtensions) {
        _fileExtensions = fileExtensions.split(new RegExp("[,;]"));
      }

      _fileExtensions = _fileExtensions.map(function(item, index){
        return item.replace(new RegExp("[^\\w-]", _flags), "");
      });

      return new RegExp("^.*\\" + path.sep + "([\\w-]+)\\.(" + (_fileExtensions.join("|") || "[\\w]+") + ")$", _flags);
    },

    /**
     * The normalizer returns a normalized key for the parsed template. With this key is it possible
     *    to call the template in the application. By default, the key is the filename of the template.
     *
     * The normalizer can be overwritten via plugin configuration. For more information please see
     *    at can-compile dokumentation: https://github.com/canjs/can-compile
     *
     * @method canCompileDefaultNormalizer
     * @private
     * @param {RegExp} fileExtensions Regular Expressions with capturing parentheses for
     *    filename and file extension
     * @return {String} Returns the key for the rendered can template.
     *
     * @see https://github.com/canjs/can-compile#programmatically
     */
    canCompileDefaultNormalizer = function(fileExtensions){
      var _fileExtensions = fileExtensions;

      return function normalizer(file){
        var fileExtRegEx = createFileExtensionRegExp(_fileExtensions),
            filename;

        try {
          filename = (fileExtRegEx.exec(file))[1];
        } catch(err) {
          filename = file;
        }

        return filename;
      }
    };


// checks, if vendors are installed
try {
  if(!isNone(fs.statSync(path.resolve(__dirname + "/vendor")))) {
    isVendorScriptsInstalled = true;
  }
} catch(error) {
  isVendorScriptsInstalled = false;
}

/**
 * Browserify Plugin: browserify-plugin-can-compile
 * =================================================
 *
 * A [Browserify](https://github.com/substack/node-browserify) plugin to require canJs template
 * files in a javascript file. The template will be precompiled with module "can-compile" and will
 * be bundled with the other javascript code. It is possible to save all required templates in an
 * external javascript file.
 *
 * b.plugin(canCompile [, options])
 * ---------------------------------
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
 *  var browserify = require('browserify'),
 *      canCompile = require('browserify-plugin-can-compile');
 *
 *  var b = browserify();
 *
 *  b.add('./app.js')
 *   .plugin(canCompile, {
 *      "filename": "./views-app.js"
 *    })
 *   .bundle().pipe(process.stdout);
 * ```
 *
 * @class canCompile
 * @constructor
 * @param {Browserify} bundle Browserify instance
 * @see https://github.com/substack/node-browserify#browserifyfiles--opts
 * @param {Object} options Can-compile options to influence the compile process. This options will
 *    be piped to the module "can-compile".
 * @see https://github.com/canjs/can-compile#programmatically
 */
module.exports = function canCompile(bundle, options){

  /**
   * @property _options
   * @private
   * @type Object
   * @default {
   *     "extensions": {
   *       "stache": "stache",
   *       "ejs": "ejs",
   *       "mustache": "mustache"
   *     },
   *     "paths": undefined,
   *     "filename": undefined,
   *     "version": "2.3.2",
   *     "normalizer": canCompileDefaultNormalizer()
   *   }
   */
  var _options = {
        "extensions": {
          "stache": "stache",
          "ejs": "ejs",
          "mustache": "mustache"
        },
        "paths": undefined,
        "filename": undefined,
        "version": "2.3.2",
        "normalizer": canCompileDefaultNormalizer(),
        "wrapper": 'module.exports = {{{content}}}',
        "wrapperForExternalTemplateFile": undefined
      };

  // check if vendors are installed
  if(true === isVendorScriptsInstalled) {
    _options.paths = {
      'jquery': path.resolve(__dirname + "/vendor/jquery/dist/jquery.js"),
      'can': path.resolve(__dirname + "/vendor/canjs/can.jquery.js"),
      'ejs': path.resolve(__dirname + "/vendor/canjs/can.ejs.js"),
      'mustache': path.resolve(__dirname + "/vendor/canjs/can.view.mustache.js"),
      'stache': path.resolve(__dirname + "/vendor/canjs/can.stache.js")
    };
  }

  // Browserify has an internal labeled-stream-splicer pipeline.
  // The Stream will be extended the state "deps".
  bundle.pipeline.get("deps").splice(1, 0, through2.obj(function(row, enc, next) {
      _options = extend(true, {}, _options, options);
    
      var _this = this,
          file = row["id"],
          fileExtRegEx = createFileExtensionRegExp(Object.keys(_options.extensions));

      this.bpccOptions = _options;
        
      if(fileExtRegEx.test(file)) {

        if("undefined" == typeof this.bpccBuffer) {
          this.bpccBuffer = [];
        }
        if(!isNone(_options.filename)) {
          _options.wrapper = _options.wrapperForExternalTemplateFile;
        }

        canCompiler(file, _options, function (err, result){

          if(err) {
            return next(err);
          }
 
          var bufferedResult = new Buffer(result);

          if(isNone(_options.filename)){
            row["source"] = bufferedResult;
          } else {
            _this.bpccBuffer.push(bufferedResult);
            row["source"] = "module.export = can.view('" + _options.normalizer(file) + "')";
          }
          
          _this.push(row);
          next();
        });
        return;
      }
      
      this.push(row);
      next();
    },
    function flush(done) {
      
      var _options = this.bpccOptions;

      if(!isNone(_options.filename)) {
        var bpccBuffer = this.bpccBuffer,
            file = path.normalize(_options.filename),
            filePath = path.dirname(file);

        if(Array.isArray(bpccBuffer)) {
          mkdirp.sync(filePath);
          var writeStream = fs.createWriteStream(file, { "flags": "w", "defaultEncoding": "utf8" });
          
          bpccBuffer.forEach(function(item, index){
            writeStream.write(item);
          });
          
          writeStream.end();
        }
      }

      this.push(null);
      done();
    })
  );
};