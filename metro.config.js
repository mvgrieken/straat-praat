const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force development mode
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Web-specific configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure React is available globally for web
config.resolver.alias = {
  ...config.resolver.alias,
  'react': require.resolve('react'),
  'react-dom': require.resolve('react-dom'),
};

// Add web-specific plugins
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

module.exports = config;