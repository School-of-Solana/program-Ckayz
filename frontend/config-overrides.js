const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer'),
    util: require.resolve('util'),
    stream: require.resolve('stream-browserify'),
    vm: require.resolve('vm-browserify'),
    // ESM module exports
    'process/browser': require.resolve('process/browser.js'),
    'process/browser.js': require.resolve('process/browser.js'),
  };

  // Add ProvidePlugin to automatically provide Buffer and process globally
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
    })
  );

  // Ignore source map warnings from dependencies (they don't affect functionality)
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /process\/browser/,
  ];

  return config;
};
