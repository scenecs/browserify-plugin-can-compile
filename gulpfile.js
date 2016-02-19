/**
 * @package browserify-plugin-can-compile
 * @category javascript
 * @author scenecs <scenecs@t-online.de>
 */

'use strict';

var gulp = require("gulp"),
    Q = require("q"),
    path = require("path"),
    globby = require("globby"),
    browserify = require("browserify"),
    vinylFsFake = require("vinyl-fs-fake");
    
    
  
gulp.task("compileVendor", function(callback){
  var deferred = Q.defer();

  globby(['./vendor.development/**/*.js']).then(function(entries) {
    var fakeSources = [],
        itemsDeferreds = [];

    entries.forEach(function(item, index){
      var b = browserify(item)
            .on("error", function(error){
              deferred.reject(new Error(error));
            }),
          itemDeferred = Q.defer();

      b.bundle(function(err, buf){
        if(err) { 
          deferred.reject(new Error(err));
        }
        
        // remove the first dir
        var splittedPath = item.split(path.sep),
            newPath;

        splittedPath.splice(0, 2);
        newPath = splittedPath.join(path.sep);
        
        fakeSources.push({
          "path": newPath,
          "contents": buf
        });
        
        itemDeferred.resolve();
      });
      
      itemsDeferreds.push(itemDeferred.promise);
    });
    
    Q.all(itemsDeferreds).then(function(){
      vinylFsFake.src(fakeSources)
        .on("end", function(){
          deferred.resolve();
        })
        .on("error", function(error){
          deferred.reject(new Error(error));
        })
        .pipe(gulp.dest("./vendor"));
    }, function (error) {
      deferred.reject(new Error(error));
    });
  });

  return deferred.promise;
});

gulp.task("default", ["compileVendor"]);