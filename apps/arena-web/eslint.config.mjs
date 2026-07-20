import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/react'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // No untyped any in game/network code
      '@typescript-eslint/no-explicit-any': 'warn',
      // Enforce consistent hook dependency arrays
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {},
  },
];
