var path = require('path')

module.exports = [
  {
    target: 'web',
    entry: {
      back: './js/background.js',
      front: './js/main.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      library: 'guld-chrome',
      libraryTarget: 'umd'
    },
    mode: 'development',
    devtool: 'source-map',
    watch: true,
    watchOptions: {
      aggregateTimeout: 1000,
      poll: 1000
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              forceEnv: 'browser'
            }
          }
        }
      ]
    }
  }
]
