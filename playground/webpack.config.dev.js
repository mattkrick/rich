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
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
    ]
  }
}
