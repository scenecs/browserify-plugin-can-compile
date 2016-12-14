/**
 * @module browserify-plugin-can-compile
 * @author scenecs <scenecs@t-online.de>
 * @license MIT
 */
const chai = require('chai');
const BrowserifyPluginCanCompile = require('../../').BrowserifyPluginCanCompile;
const dummyFunction = function dummyFunction() {}; // eslint-disable-line no-empty-function
const browserify = require('browserify');

chai.should();
chai.config.includeStack = true;

describe('BrowserifyPluginCanCompile', function () {
    it('throw an error, if the currently used version of canJS is not set', function () {
        (() => new BrowserifyPluginCanCompile(browserify())).should.throw(/Missing option "options.version"/);
    });

    it('create an instance of BrowserifyPluginCanCompile', function () {
        (new BrowserifyPluginCanCompile(
            browserify(),
            { paths: [], version: '2.3.21' }
        )).should.be.an.instanceof(BrowserifyPluginCanCompile);
    });

    it('set the default normalizer function, if no normalizer is passed', function () {
        const instance = BrowserifyPluginCanCompile.addPlugin(
            browserify(),
            { paths: [], version: '2.3.21' }
        );

        (instance.options.normalizer.toString()).should.be.eql((instance.getDefaultNormalizer()).toString());
    });

    it('overwrite the default normalizer function', function () {
        const instance = BrowserifyPluginCanCompile.addPlugin(
            browserify(),
            { normalizer: dummyFunction, paths: [], version: '2.3.21' }
        );

        (instance.options.normalizer.toString()).should.be.eql(dummyFunction.toString());
    });

    it('disable caching of can-compile vendor scripts', function () {
        const instance = BrowserifyPluginCanCompile.addPlugin(
            browserify(),
            { cacheCanCompileScripts: false, version: '2.3.21' }
        );

        (instance.options.cacheCanCompileScripts).should.be.equal(false);
    });

    it('throw an error, if the passed parameter "bundle" is not a vaild instance of "Browserify"', function () {
        (function exceptionFunc() {
            BrowserifyPluginCanCompile.addPlugin();
        }).should.throw(/The passed parameter "bundle" seems to be not a valid instance of "Browserify"/);

        (function exceptionFunc() {
            BrowserifyPluginCanCompile.addPlugin({ test: 'haha' });
        }).should.throw(/The passed parameter "bundle" seems to be not a valid instance of "Browserify"/);
    });

    it('use path for can-compile vendor scripts from passed options', function () {
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

    describe('#setOptions(options)', function () {
        const testInvalidOptionsParameter = [
            { args: [], label: 'undefined' },
            { args: [''], label: 'a string' },
            { args: [[]], label: 'an array' },
            { args: [dummyFunction], label: 'a function' }
        ];
        let instance;

        beforeEach(function () {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: [], version: '2.3.21' });
        });

        afterEach(function () {
            instance = undefined;
        });

        testInvalidOptionsParameter.forEach((testItem) => {
            it(`throw an error, if the passed parameter "options" is "${testItem.label}"`, function () {
                (() => Reflect.apply(instance.setOptions, null, testItem.args))
                    .should.throw(/The passed parameter "options" must be an object/);
            });
        });

        it('do nothing, if the passed parameter "options" is an empty object', function () {
            const options = {};

            Object.assign(options, instance.options);

            instance.setOptions({});
            (instance.options).should.be.deep.equal(options);
        });

        it('overwrite the default property "this.options.extensions" with {"stache": "sta"}', function () {
            const options = {};

            Object.assign(options, instance.options, { extensions: { stache: 'sta' } });

            instance.setOptions({ extensions: { stache: 'sta' } });
            (instance.options).should.be.deep.equal(options);
        });
    });

    describe('#getOptions()', function () {
        let instance;

        beforeEach(function () {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: [], version: '2.3.21' });
        });

        afterEach(function () {
            instance = undefined;
        });

        it('return the current options', function () {
            const options = {};

            Object.assign(options, instance.options);

            (instance.getOptions()).should.be.eql(options);
        });
    });

    describe('#setPaths(paths)', function () {
        const testInvalidOptionsParameter = [
            { args: [], label: 'undefined' },
            { args: [''], label: 'a string' },
            { args: [1234], label: 'a string' },
            { args: [[]], label: 'an array' },
            { args: [dummyFunction], label: 'a function' }
        ];
        let instance;

        beforeEach(function () {
            instance = BrowserifyPluginCanCompile.addPlugin(
                browserify(),
                { paths: ['./test1.js', './test2.js'], version: '2.3.21' }
            );
        });

        afterEach(function () {
            instance = undefined;
        });

        testInvalidOptionsParameter.forEach((testItem) => {
            it(`throw an error, if the passed parameter "paths" is "${testItem.label}"`, function () {
                (function exceptionFunc() {
                    Reflect.apply(instance.setPaths, null, testItem.args);
                }).should.throw(/The passed parameter "paths" must be an object/);
            });
        });

        it('overwrite the existing paths', function () {
            const newPaths = { can: './test2.js', stache: './test3.js' };

            instance.setPaths(newPaths);
            (instance.getPaths()).should.be.eql(newPaths);
        });
    });

    describe('#getPaths()', function () {
        const newPaths = ['./test2.js', './test3.js'];
        let instance;

        beforeEach(function () {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: newPaths, version: '2.3.21' });
        });

        afterEach(function () {
            instance = undefined;
        });

        it('return an array with the passed paths options from instantiation', function () {
            (instance.getPaths()).should.be.eql(newPaths);
        });
    });

    describe('#getFileExtensionRegExp()', function () {
        const testInvalidOptionsParameter = [
          { extensions: undefined, label: 'undefined' },
          { extensions: ['test', 'test1'], label: 'an array' },
          { extensions: 1234, label: 'a number' },
          { extensions: dummyFunction, label: 'a function' }
        ];
        let instance;

        beforeEach(function () {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: [], version: '2.3.21' });
        });

        afterEach(function () {
            instance = undefined;
        });

        testInvalidOptionsParameter.forEach((testItem) => {
            it(`throw an error, if "options.extensions" is "${testItem.label}"`, function () {
                instance.options.extensions = testItem.extensions;
                (function exceptionFunc() {
                    instance.getFileExtensionRegExp();
                }).should.throw(/Option "extensions" must be a key-value object/);
            });
        });

        it('creates a regular expressions form the property "options.extensions"', function () {
            (instance.getFileExtensionRegExp())
                .should.be.eql(new RegExp('^.*\\/([\\w-]+)\\.(ejs|mustache|stache)$', 'i'));
        });
    });

    describe('#getDefaultNormalizer()', function () {
        let instance;
        let defaultNormalizer;

        beforeEach(function () {
            instance = BrowserifyPluginCanCompile.addPlugin(browserify(), { paths: [], version: '2.3.21' });
            defaultNormalizer = instance.getDefaultNormalizer();
        });

        afterEach(function () {
            defaultNormalizer = null;
            instance = undefined;
        });

        it('return a normalizer function', function () {
            (defaultNormalizer).should.be.a('function');
        });

        it('normalize the path "./foo/bar/template.stache" to "template"', function () {
            (defaultNormalizer('./foo/bar/template.stache')).should.be.a.string('template');
        });

        it('normalize the path "./foo/bar/user-template.stache" to "user-template"', function () {
            (defaultNormalizer('./foo/bar/user-template.stache')).should.be.a.string('user-template');
        });

        it('normalize the path "./foo/bar/user_template.stache" to "user_template"', function () {
            (defaultNormalizer('./foo/bar/user_template.stache')).should.be.a.string('user_template');
        });

        it('normalize the path "./foo/bar/userTemplate.stache" to "userTemplate"', function () {
            (defaultNormalizer('./foo/bar/userTemplate.stache')).should.be.a.string('userTemplate');
        });

        it('normalize the path "./foo/bar/template.phtml" to "template.phtml"', function () {
            (defaultNormalizer('./foo/bar/template.phtml')).should.be.a.string('template.phtml');
        });
    });

    describe('BrowserifyPluginCanCompile.isNone()', function () {
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
            it(`return ${testItem.expects}, if the passed parameter is "${testItem.label}"`, function () {
                (Reflect.apply(BrowserifyPluginCanCompile.isNone, null, testItem.args)).should.be.eql(testItem.expects);
            });
        });
    });
});
