module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@components': '/Users/bilal/Desktop/suimon-simple-card-game/suimon-game/frontend/src/components',
        '@data': '/Users/bilal/Desktop/suimon-simple-card-game/suimon-game/frontend/src/data'
      };
      return webpackConfig;
    }
  }
};