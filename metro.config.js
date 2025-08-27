const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// NativeWind v4 syntax
config.resolver.alias = {
  ...config.resolver.alias,
};

module.exports = config;