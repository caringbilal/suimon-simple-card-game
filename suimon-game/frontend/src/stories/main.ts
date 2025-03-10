import { StorybookConfig } from '@storybook/react-webpack5';
import { Configuration } from 'webpack';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config: Configuration) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.modules) {
      config.resolve.modules = [];
    }
    if (!config.module) {
      config.module = { rules: [] };
    }
    if (!config.module.rules) {
      config.module.rules = [];
    }

    config.resolve.modules = [...config.resolve.modules, 'node_modules'];
    
    // Add CSS rule
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
      include: /src/,
    });

    // Ensure TypeScript is handled
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: 'ts-loader',
      include: /src/,
    });

    return config;
  },
};

export default config;