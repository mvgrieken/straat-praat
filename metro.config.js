const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// NativeWind v2 configuration
config.resolver.alias = {
  ...config.resolver.alias,
};

module.exports = config;