module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
    overrides: [{
      test: (filename) => filename.includes('react-native-ble-plx'),
      plugins: [require.resolve('@babel/plugin-transform-flow-strip-types')],
    }],
  };
};
