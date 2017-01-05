/**
 * @module browserify-plugin-can-compile
 * @author scenecs <scenecs@t-online.de>
 * @license MIT
 */
const chai = require('chai');
const sinon = require('sinon');
const path = require('path');
const del = require('del');
const through2 = require('through2');
const browserify = require('browserify');
const BrowserifyPluginCanCompile = require('../../').BrowserifyPluginCanCompile;
const DEFAULT_CACHE_DIR = path.resolve(process.cwd(), 'node_modules/.can_compile_cache');

chai.should();
chai.config.includeStack = true;

describe('BrowserifyPluginCanCompile', function () {
    afterEach(function () {
        return del([DEFAULT_CACHE_DIR]);
    });

    it('create an instance of BrowserifyPluginCanCompile and use vendor script cache', function () {
        (new BrowserifyPluginCanCompile(
            browserify(),
            { cacheCanCompileScripts: true, path: undefined, version: '2.3.21' }
        )).should.be.an.instanceof(BrowserifyPluginCanCompile);
    });

    describe('#extendBrowserifyPipeline()', function () {
        it('extend the browserify pipeline "deps" with with the duplex stream', function () {
            const instance = BrowserifyPluginCanCompile.addPlugin(
                browserify(),
                { cacheCanCompileScripts: false, version: '2.3.21' }
            );
            const newBrowserifyInstance = browserify();
            let numberOfTransformers;

            numberOfTransformers = newBrowserifyInstance._transformOrder; // eslint-disable-line no-underscore-dangle
            instance.browserifyInstance = newBrowserifyInstance;
            instance.extendBrowserifyPipeline();
            (instance.browserifyInstance._transformOrder).should.be.equal(numberOfTransformers += 1); // eslint-disable-line no-underscore-dangle
        });
    });

    describe('.transform()', function () {
        let instance;

        before(function () {
            sinon.spy(BrowserifyPluginCanCompile, 'transformFunction');
        });

        after(function () {
            BrowserifyPluginCanCompile.transformFunction.restore();
        });

        beforeEach(function () {
            sinon.spy.reset();
            instance = new BrowserifyPluginCanCompile(
                browserify(),
                { cacheCanCompileScripts: true, path: undefined, version: '2.3.21' }
            );
        });

        it('return an empty through2 object transform-stream, if the passed file is not a template', function () {
            (BrowserifyPluginCanCompile.transform(instance)('path/to/test.doc')._transform) // eslint-disable-line no-underscore-dangle
                .should.be.deep.equal(through2.obj()._transform); // eslint-disable-line no-underscore-dangle
        });

        it('return a through2 object transform-stream with the can-compile transformer', function () {
            BrowserifyPluginCanCompile.transform(instance)('path/to/test.stache');
            (BrowserifyPluginCanCompile.transformFunction.calledWith(instance, 'path/to/test.stache')).should.be.true;
            (BrowserifyPluginCanCompile.transformFunction.calledOnce).should.be.true;
        });
    });
    // @todo: implement test
    describe('.transformFunction(file)');
    // @todo:  implement test
    describe('.flushFunction()');

    describe('.addPlugin(bundle, options)', function () {
        it('allow caching of the can-compile vendor scripts', function () {
            // @Todo: implement test
            // const instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { version: '2.3.21' });
        });
    });
});
