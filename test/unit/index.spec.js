/* eslint-env node, mocha */
/**
 * @module browserify-plugin-can-compile
 * @author scenecs <scenecs@t-online.de>
 * @license MIT
 */
const chai = require('chai');
const browserify = require('browserify');
const BrowserifyPluginCanCompile = require('../../').BrowserifyPluginCanCompile;
const dummyFunction = function dummyFunction() {}; // eslint-disable-line no-empty-function

chai.should();

describe('BrowserifyPluginCanCompile', () => {
    describe('BrowserifyPluginCanCompile.addPlugin(bundle, options)', () => {
        it('throw an error, if the passed parameter "bundle" is not a vaild instance of "Browserify"', () => {
            (function exceptionFunc() {
                BrowserifyPluginCanCompile.addPlugin();
            }).should.throw(/The passed parameter "bundle" seems to be not a valid instance of "Browserify"/);

            (function exceptionFunc() {
                BrowserifyPluginCanCompile.addPlugin({ test: 'haha' });
            }).should.throw(/The passed parameter "bundle" seems to be not a valid instance of "Browserify"/);
        });

        it('throw an error, if the currently used version of canJS is not set', () => {
            (function exceptionFunc() {
                BrowserifyPluginCanCompile.addPlugin(browserify());
            }).should.throw(/Missing option "options.version"/);
        });

        it('create an instance of BrowserifyPluginCanCompile', () => {
            (BrowserifyPluginCanCompile.addPlugin(
                browserify(),
                { paths: [], version: '2.3.21' }
            )).should.be.an.instanceof(BrowserifyPluginCanCompile);
        });

        it('set the default normalizer function, if no normalizer is passed', () => {
            const instance = BrowserifyPluginCanCompile.addPlugin(
                browserify(),
                { paths: [], version: '2.3.21' }
            );

            (instance.options.normalizer.toString()).should.be.eql((instance.getDefaultNormalizer()).toString());
        });

        it('overwrite the default normalizer function', () => {
            const instance = BrowserifyPluginCanCompile.addPlugin(
                browserify(),
                { normalizer: dummyFunction, paths: [], version: '2.3.21' }
            );

            (instance.options.normalizer.toString()).should.be.eql(dummyFunction.toString());
        });

        it('disable caching of can-compile vendor scripts', () => {
            const instance = BrowserifyPluginCanCompile.addPlugin(
                browserify(),
                { cacheCanCompileScripts: false, version: '2.3.21' }
            );

            (instance.options.cacheCanCompileScripts).should.be.equal(false);
        });

        it('use path for con-compile vendor scripts from passed options', () => {
            const vendorScripts = [
                './test1.js',
                './test2.js',
                './test3.js',
                './test4.js'
            ];
            const instance = BrowserifyPluginCanCompile.addPlugin(
                browserify(),
                { paths: vendorScripts, version: '2.3.21' }
            );

            (instance.options.paths).should.be.equal(vendorScripts);
        });

        it('allow caching of the can-compile vendor scripts', () => {
            // @Todo: implement test
            const instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { version: '2.3.21' });
        });
    });

    describe('#extendBrowserifyPipeline()', () => {
        it('extend the browserify pipeline "deps" with with the duplex stream', () => {
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

    describe('#setOptions(options)', () => {
        const testInvalidOptionsParameter = [
            { args: [], label: 'undefined' },
            { args: [''], label: 'a string' },
            { args: [[]], label: 'an array' },
            { args: [dummyFunction], label: 'a function' }
        ];
        let instance;

        beforeEach(() => {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: [], version: '2.3.21' });
        });

        afterEach(() => {
            instance = undefined;
        });

        testInvalidOptionsParameter.forEach((testItem) => {
            it(`throw an error, if the passed parameter "options" is "${testItem.label}"`, () => {
                (function exceptionFunc() {
                    Reflect.apply(instance.setOptions, null, testItem.args);
                }).should.throw(/The passed parameter "options" must be an object/);
            });
        });

        it('do nothing, if the passed parameter "options" is an empty object', () => {
            const options = {};

            Object.assign(options, instance.options);

            instance.setOptions({});
            (instance.options).should.be.deep.equal(options);
        });

        it('overwrite the default property "this.options.extensions" with {"stache": "sta"}', () => {
            const options = {};

            Object.assign(options, instance.options, { extensions: { stache: 'sta' } });

            instance.setOptions({ extensions: { stache: 'sta' } });
            (instance.options).should.be.deep.equal(options);
        });
    });

    describe('#getOptions()', () => {
        let instance;

        beforeEach(() => {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: [], version: '2.3.21' });
        });

        afterEach(() => {
            instance = undefined;
        });

        it('return the current options', () => {
            const options = {};

            Object.assign(options, instance.options);

            (instance.getOptions()).should.be.eql(options);
        });
    });

    describe('#setPaths(paths)', () => {
        const testInvalidOptionsParameter = [
            { args: [], label: 'undefined' },
            { args: [''], label: 'a string' },
            { args: [1234], label: 'a string' },
            { args: [{}], label: 'an object' },
            { args: [dummyFunction], label: 'a function' }
        ];
        let instance;

        beforeEach(() => {
            instance = BrowserifyPluginCanCompile.addPlugin(
                browserify(),
                { paths: ['./test1.js', './test2.js'], version: '2.3.21' }
            );
        });

        afterEach(() => {
            instance = undefined;
        });

        testInvalidOptionsParameter.forEach((testItem) => {
            it(`throw an error, if the passed parameter "paths" is "${testItem.label}"`, () => {
                (function exceptionFunc() {
                    Reflect.apply(instance.setPaths, null, testItem.args);
                }).should.throw(/The passed parameter "paths" must be an array/);
            });
        });

        it('overwrite the existing paths', () => {
            const newPaths = ['./test2.js', './test3.js'];

            instance.setPaths(newPaths);
            (instance.getPaths()).should.be.eql(newPaths);
        });
    });

    describe('#getPaths()', () => {
        const newPaths = ['./test2.js', './test3.js'];
        let instance;

        beforeEach(() => {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: newPaths, version: '2.3.21' });
        });

        afterEach(() => {
            instance = undefined;
        });

        it('return an array with the passed paths options from instantiation', () => {
            (instance.getPaths()).should.be.eql(newPaths);
        });
    });

    describe('#getFileExtensionRegExp()', () => {
        const testInvalidOptionsParameter = [
          { extensions: undefined, label: 'undefined' },
          { extensions: ['test', 'test1'], label: 'an array' },
          { extensions: 1234, label: 'a number' },
          { extensions: dummyFunction, label: 'a function' }
        ];
        let instance;

        beforeEach(() => {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: [], version: '2.3.21' });
        });

        afterEach(() => {
            instance = undefined;
        });

        testInvalidOptionsParameter.forEach((testItem) => {
            it(`throw an error, if "options.extensions" is "${testItem.label}"`, () => {
                instance.options.extensions = testItem.extensions;
                (function exceptionFunc() {
                    instance.getFileExtensionRegExp();
                }).should.throw(/Option "extensions" must be a key-value object/);
            });
        });

        it('creates a regular expressions form the property "options.extensions"', () => {
            (instance.getFileExtensionRegExp())
                .should.be.eql(new RegExp('^.*\\/([\\w-]+)\\.(stache|ejs|mustache)$', 'i'));
        });
    });

    describe('#getDefaultNormalizer()', () => {
        let instance;
        let defaultNormalizer;

        beforeEach(() => {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: [], version: '2.3.21' });
            defaultNormalizer = instance.getDefaultNormalizer();
        });

        afterEach(() => {
            defaultNormalizer = null;
            instance = undefined;
        });

        it('return a normalizer function', () => {
            (defaultNormalizer).should.be.a('function');
        });

        it('normalize the path "./foo/bar/template.stache" to "template"', () => {
            console.log(defaultNormalizer('./foo/bar/template.stache'));
            (defaultNormalizer('./foo/bar/template.stache')).should.be.a.string('template');
        });

        it('normalize the path "./foo/bar/user-template.stache" to "user-template"', () => {
            (defaultNormalizer('./foo/bar/user-template.stache')).should.be.a.string('user-template');
        });

        it('normalize the path "./foo/bar/user_template.stache" to "user_template"', () => {
            (defaultNormalizer('./foo/bar/user_template.stache')).should.be.a.string('user_template');
        });

        it('normalize the path "./foo/bar/userTemplate.stache" to "userTemplate"', () => {
            (defaultNormalizer('./foo/bar/userTemplate.stache')).should.be.a.string('userTemplate');
        });

        it('normalize the path "./foo/bar/template.phtml" to "template.phtml"', () => {
            (defaultNormalizer('./foo/bar/template.phtml')).should.be.a.string('template.phtml');
        });
    });

    // @todo: implement test
    describe('#transform()');
    // @todo: implement test
    describe('#transformFunction(file)');
    // @todo:  implement test
    describe('#flushFunction()');

    describe('BrowserifyPluginCanCompile.isNone()', () => {
        const testInvalidOptionsParameter = [
            { args: [], expects: true, label: 'not defined' },
            { args: [null], expects: true, label: 'null' },
            { args: [undefined], expects: true, label: 'undefined' },
            { args: [''], expects: false, label: 'an empty sting' },
            { args: ['Test'], expects: false, label: 'a sting' },
            { args: [[]], expects: false, label: 'an empty array' },
            { args: [['String', 123]], expects: false, label: 'an array' },
            { args: [{}], expects: false, label: 'an empty object' },
            { args: [{ test: 'value' }], expects: false, label: 'an object' },
            { args: [dummyFunction], expects: false, label: 'a function' }
        ];

        testInvalidOptionsParameter.forEach((testItem) => {
            it(`return ${testItem.expects}, if the passed parameter is "${testItem.label}"`, () => {
                (Reflect.apply(BrowserifyPluginCanCompile.isNone, null, testItem.args)).should.be.eql(testItem.expects);
            });
        });
    });
});
