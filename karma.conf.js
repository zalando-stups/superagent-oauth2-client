var webpackConfig = require('./webpack.config'),
    webpack = require('webpack'),
    path = require('path');

webpackConfig.plugins = [
    new webpack.DefinePlugin({
        ENV_PRODUCTION: false
    })
];

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',

    plugins: [
        'karma-webpack',
        'karma-mocha',
        'karma-chai-plugins',
        'karma-story-reporter',
        'karma-chrome-launcher'
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'chai-as-promised'],

    // insert webpack config
    webpack: webpackConfig,

    // load only test files, source files will magically be found by webpack
    files: [
        'test/**/*.test.js'
    ],

    // webpack preprocessor will create one entrypoint for each test
    preprocessors: {
        'test/**/*.test.js': ['webpack']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [ 'story' ],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // drop chrome once phantomjs 2 is available
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};