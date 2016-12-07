Browserify Plugin: browserify-plugin-can-compile
=================================================

A [Browserify](https://github.com/substack/node-browserify) plugin to require canJs template
files in a javascript file. The template will be precompiled with module "can-compile" and will
be bundled with the other javascript code. It is possible to save all required templates in an
external javascript file.

b.plugin(BrowserifyPluginCanCompile.compile [, options])
---------------------------------------------------------

### options

   - `filename` {String}: The name of the file to be compiled
   - `version` {String}: The CanJS version to be used
   - `log` {Function}: A logger function (e..g `console.log.bind(console)`)
   - `normalizer` {Function}: A Function that returns the normalized path name
   - `tags` {Array}: A list of all your can.Component tags. They need to be registered in order to pre-compile views properly.
   - `extensions` {Object}: An object to map custom file extensions to the standard extension (e.g. `{ 'mst' : 'mustache' }`)
   - `viewAttributes` {Array}: A list of attribute names (RegExp or String), used for additional behavior for an attribute in a view (can.view.attr)
   - `paths` an object with `ejs`, `mustache` or `stache` and a `jquery` property pointing to files of existing versions or CanJS and jQuery instead of the CDN links.

All options are optional. If the option `filename` is defined, the precompiled templates will be
saved in this external file.

For more information please see at can-compile dokumentation: https://github.com/canjs/can-compile

Example
--------

```javascript
 const browserify = require('browserify');
 const browserifyPluginCanCompile = require('browserify-plugin-can-compile');

 let b = browserify();

 b.add('./app.js')
  .plugin(browserifyPluginCanCompile, {
     "version": "2.3.23",
     "filename": "./views-app.js"
   })
  .bundle().pipe(process.stdout);
```

