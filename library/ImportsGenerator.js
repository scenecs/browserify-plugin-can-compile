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

var _CanCompileScriptsCache = require('./CanCompileScriptsCache');

var _CanCompileScriptsCache2 = _interopRequireDefault(_CanCompileScriptsCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ImportsGenerator = function () {
  function ImportsGenerator() {
    _classCallCheck(this, ImportsGenerator);
  }

  _createClass(ImportsGenerator, null, [{
    key: 'getImports',


    /**
     * @method getImports
     * @static
     * @param {String} version
     * @param {String} fileExtension
     * @param {Object} importPaths
     * @return {String} Returns the import statements
     */
    value: function getImports(version, fileExtension, importPaths) {
      return "// import";
    }
  }]);

  return ImportsGenerator;
}();

exports.default = ImportsGenerator;


module.exports = ImportsGenerator;

// function(version, type, paths) {
//     var requires = ['var can = require(\'' + paths.can + '\');\n'];
// 	for(var plugin in versionMap.plugins) {
// 		if(type === plugin && semver.satisfies(version, versionMap.plugins[plugin]) && paths[plugin]){
// 			requires.push('require(\'' + paths[plugin] + '\');\n');
// 		}
// 	}
//     return requires.join('');
// }