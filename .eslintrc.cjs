module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'airbnb',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    'storybook/storybook-static/',
    'storybook-static/',
    'packages/storybook/storybook-static/',
    'packages/storybook/.storybook-home/',
    'lib/dist/',
    '.storybook-home/',
    'storybook/.storybook-home/',
    'packages/core/src/lib/',
    'packages/core/src/viewports/',
    'packages/core/src/shaderlib/',
  ],
  overrides: [
    {
      files: [
        '.storybook/*.js',
        'storybook/.storybook/*.js',
        'packages/storybook/.storybook/*.js',
        'vite.config.js',
        'lib/vite.config.js',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
      },
    },
    {
      files: ['lib/src/layers/**/*.js'],
      rules: {
        'import/no-unresolved': 'off',
      },
    },
    {
      files: ['packages/storybook/src/**/*.jsx'],
      rules: {
        'import/no-unresolved': 'off',
      },
    },
    {
      files: ['packages/storybook/src/**/*.stories.jsx'],
      rules: {
        'import/no-anonymous-default-export': 'off',
      },
    },
  ],
  rules: {
    semi: ['error', 'never'],
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    'no-param-reassign': 'off',
    'object-curly-newline': 'off',
    'operator-linebreak': 'off',
    'prefer-destructuring': 'off',
    'no-bitwise': 'off',
    'import/extensions': 'off',
    'import/no-relative-packages': 'off',
    'import/order': 'off',
    'no-restricted-exports': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/destructuring-assignment': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
    'import/prefer-default-export': 'off',
    'no-console': 'off',
  },
}
