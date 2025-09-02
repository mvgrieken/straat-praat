const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// NativeWind v2 configuration
config.resolver.alias = {
  ...config.resolver.alias,
};

// Add NativeWind transformer
config.transformer.babelTransformerPath = require.resolve('nativewind/metro');

module.exports = config;