var webpack = require('webpack');

module.exports = {
    devtool: 'eval',
    entry: [
        './src/superagent.js'
    ],
    output: {
        path: __dirname + '/dist/',
        filename: 'superagent-oauth2-client.js',
        library: 'superagent-oauth2-client',
        libraryTarget: 'umd'
    },
    plugins: [
        new webpack.BannerPlugin(require('./banner'))
    ],
    resolve: {
        extensions: ['', '.js']
    },
    eslint: {
        configFile: '.eslintrc'
    },
    module: {
        preLoaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'eslint' },
        ],
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
        ]
    }
};