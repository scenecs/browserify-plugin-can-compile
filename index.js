/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs
 */

'use strict';

var through2 = require("through2"),
    canCompiler = require("can-compile"),
    fs = require("fs"),
    path = require("path"),


    createFileExtensionRegExp = function createFileExtensionRegExp(fileExtensions){
      var _fileExtensions = [],
          _flags = "ig";
      
      switch(true) {
        case ("string" == typeof fileExtensions):
          _fileExtensions = (fileExtensions.split(new RegExp("[,;]"))).map(function(item, index){
            return item.replace(new RegExp("[^\\w-]", _flags), "");
          });
          break;

        case (Array.isArray(fileExtensions)):
          _fileExtensions = fileExtensions.map(function(item, index){
            return item.replace(new RegExp("[^\\w-]", _flags), "");
          });
          break;

        default:
          _fileExtensions.push("*");
      }

      return new RegExp("^.*\\/([\\w-]+)\\.(" + _fileExtensions.join("|") + ")$", _flags);
    };

module.exports = function canCompile(bundle, options){

  let _options = {
    "fileExtensions": ["stache", "ejs", "mustache"],
    "basedir": process.cwd(),
    "dest": null,
  };

  Object.keys(options).forEach(function(key) {

    switch(key) {
      case "basedir":
        _options.basedir = options[key];
        break;
      case "fileExtensions":
        _options.fileExtensions = options[key];
        break;
    }
  });
  
  bundle.pipeline.get("deps").splice(1, 0, through2.obj(function(row, enc, next) {
      var file = row["id"],
          fileExtRegEx = createFileExtensionRegExp(_options.fileExtensions);
  

      if(fileExtRegEx.test(file)) {

        if("undefined" == typeof this.chunkBuffer) {
          this.chunkBuffer = [];
        }
        
        var _this = this,
            _canCompileOptions = {
              "version": '2.3.2',
              "normalizer": function(file){
                var fileExtRegEx = createFileExtensionRegExp(_options.fileExtensions),
                    filename;

                try {
                  filename = (fileExtRegEx.exec(file))[1];
                } catch(err) {
                  filename = file;
                }

                return filename;
              }
            };
        
        canCompiler(file, _canCompileOptions, function (err, result){

          if(err) {
            return next(err);
          }
 
          var bufferedResult = new Buffer(result);

          if(null === _options.dest){
            row["source"] = bufferedResult;
            _this.push(row);
          } else {
            _this.chunkBuffer.push(bufferedResult);
          }
          
          next();
        });
        return;
      }
      
      this.push(row);
      next();
    },
    function flush(done) {
      
      if(null !== _options.dest) {
        var chunkBuffer = this.chunkBuffer;
        
        if(Array.isArray(chunkBuffer)) {
          var writeStream = fs.createWriteStream(path.normalize(_options.dest), { "flags": "w", "defaultEncoding": "utf8" });
          
          chunkBuffer.forEach(function(item, index){
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