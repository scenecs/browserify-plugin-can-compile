/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author Markus Brandt
 */

'use strict';

var through2 = require("through2");

module.exports = function canCompile(bundle, options){

  let _options = {
    "fileExtensions": ['stache', "i"],
    "basedir": process.cwd()
  };

  Object.keys(options).forEach(function(key) {
    console.log(key, options[key]);

    switch(key) {
      case "basedir":
        _options.basedir = options[key];
        break;
      case "fileExtensions":
        var fileExtensions = options[key]
        if(!Array.isArray(fileExtensions)) {
          if("string" === typeof fileExtensions) {
            _options.fileExtensions = [];
            _options.fileExtensions.push("\\.(" + (fileExtensions.split(new RegExp("[,;]"))).join("|") + ")$");
            _options.fileExtensions.push("i");
          }
        } else {
          _options.fileExtensions = options[key];
        }
        break;
      default:
        break;
    }
  });
  
  let fileExtRegEx = RegExp.apply(null, _options.fileExtensions);
  
  bundle.transform({ "global": true }, function(filename) {

    if (!fileExtRegEx.test(filename)) {
      console.log("filename: ", fileExtRegEx.test(filename), fileExtRegEx, filename);
      return through2();
    }
    
    var buffer = "";

    return through2(
      function transform(chunk, encoding, next) {
        buffer += chunk.toString();
        next();
      },
      function flush(done) {
        this.push(null);
        done();
      }
    );
  });
};