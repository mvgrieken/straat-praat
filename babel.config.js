module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add React global for web
      [
        'babel-plugin-transform-globals',
        {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
      ],
    ],
  };
};