import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['apps/arena-api/tsconfig.json'],
      },
    },
    rules: {
      // Disallow floating promises — critical for async Colyseus handlers
      '@typescript-eslint/no-floating-promises': 'error',
      // Prefer explicit return types on exported functions
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      // No any in server code
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
