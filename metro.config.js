const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web-specific configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure React is available globally for web
config.resolver.alias = {
  ...config.resolver.alias,
  'react': require.resolve('react'),
  'react-dom': require.resolve('react-dom'),
};

module.exports = config;