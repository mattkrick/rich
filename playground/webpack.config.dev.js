const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx'],
  },
  entry: {
    app: [path.join(__dirname, './index.tsx')]
  },
  output: {
    path: path.join(__dirname, '../static'),
    filename: 'app.js',
    publicPath: '/static/',
  },
  module: {
    rules: [
      // {
      //   test: /\.(js|jsx|mjs)$/,
      //   loader: require.resolve('babel-loader'),
      //   options: {
      //     babelrc: false,
      //     cacheDirectory: true,
      //     presets: ['react'],
      //     plugins: [
      //       'syntax-object-rest-spread',
      //       'syntax-dynamic-import',
      //       'transform-class-properties',
      //     ],
      //   },
      //   // include: [
      //   //   path.resolve(__dirname),
      //   //   path.resolve(__dirname, 'node_modules', '@mattkrick/simple-swarm')
      //   // ]
      // },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
    ]
  }
}
