const webpack = require('webpack');

module.exports = function (options) {
  return {
    ...options,
    externals: [], // Asegura que no se externalice nada que necesitemos
    plugins: [
      ...options.plugins,
      new webpack.ProvidePlugin({
        crypto: 'crypto', // Proporciona el módulo 'crypto' globalmente
      }),
    ],
    node: {
      __dirname: true,
      __filename: true,
      global: true, // Asegura que 'global' esté disponible
    },
    // Asegura que el target sea 'node' para que Webpack sepa que está construyendo para Node.js
    target: 'node',
  };
};
