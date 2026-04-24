const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const path = require('path');

const expoConfigDirectory = path.dirname(require.resolve('eslint-config-expo/package.json'));

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: expoConfigDirectory,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  {
    ignores: ['dist/**', 'coverage/**', '.expo/**', 'web-build/**', 'node_modules/**'],
  },
  {
    files: ['*.config.js', '.eslintrc.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
  },
  ...compat.extends('expo'),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
