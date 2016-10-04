/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

import CanCompileScriptsCache from './CanCompileScriptsCache';


export default class ImportsGenerator {
  
  /**
   * @method getImports
   * @static
   * @param {String} version
   * @param {String} fileExtension
   * @param {Object} importPaths
   * @return {String} Returns the import statements
   */
  static getImports(version, fileExtension, importPaths) {
    return "// import";
  }
}

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