/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs
 */

'use strict';

var extend = require("extend"),
    through2 = require("through2"),
    canCompiler = require("can-compile"),
    fs = require("fs"),
    path = require("path"),


    /**
     * can-compile needs jQuery and canJs to compile the templates. By default, it loads all files down.
     * Thus always an Internet connection necessary.
     *
     *
     * The attribute "isVendorScriptsInstalled" is true, if the needed vendors are installed.
     *
     * This browserify plugin expects the following file structure:
     *    - vendor/jquery
     *    - vendor/canjs
     *
     * @attribute isVendorScriptsInstalled
     * @type boolean
     * @default false
     */
    isVendorScriptsInstalled = false,
    
    isNone = function isNone(obj) {
      return obj === null || obj === undefined;
    },

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


module.exports = function canCompile(bundle, options){
  
  var _options = {
        "extensions": {
          "stache": "stache",
          "ejs": "ejs",
          "mustache": "mustache"
        },
        "paths": undefined,
        "filename": undefined,
        "version": "2.3.2",
        "normalizer": canCompileDefaultNormalizer()
      };

  if(true === isVendorScriptsInstalled) {
    _options.paths = {
      'jquery': path.resolve(__dirname + "/vendor/jquery/dist/jquery.js"),
      'can': path.resolve(__dirname + "/vendor/canjs/can.jquery.js"),
      'ejs': path.resolve(__dirname + "/vendor/canjs/can.ejs.js"),
      'mustache': path.resolve(__dirname + "/vendor/canjs/can.view.mustache.js"),
      'stache': path.resolve(__dirname + "/vendor/canjs/can.stache.js")
    };
  }

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
        
        canCompiler(file, _options, function (err, result){

          if(err) {
            return next(err);
          }
 
          var bufferedResult = new Buffer(result);

          if(isNone(_options.filename)){
            row["source"] = bufferedResult;
            _this.push(row);
          } else {
            _this.bpccBuffer.push(bufferedResult);
          }
          
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
        var bpccBuffer = this.bpccBuffer;

        if(Array.isArray(bpccBuffer)) {
          var writeStream = fs.createWriteStream(path.normalize(_options.dest), { "flags": "w", "defaultEncoding": "utf8" });
          
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