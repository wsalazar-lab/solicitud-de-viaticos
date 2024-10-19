module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Permitir importaciones fuera de src/
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );
      return webpackConfig;
    },
  },
};