const path = require('path');

module.exports = {
  entry: {
    'case/forms/main-sales.form':    './src/case/forms/main-sales.form.ts',
    'case/forms/main-service.form':  './src/case/forms/main-service.form.ts',
    'case/forms/quick-create.form':  './src/case/forms/quick-create.form.ts',
    'case/ribbons/main.ribbon':      './src/case/ribbons/main.ribbon.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  devtool: 'source-map',
  optimization: {
    // Each file is registered independently in D365 — no shared chunks
    splitChunks: false
  }
};