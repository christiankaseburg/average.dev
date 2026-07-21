import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../home-api/internal/driver/graphql/*.graphqls',
  documents: ['src/**/*.tsx', 'src/**/*.graphql', 'src/**/*.ts'],
  generates: {
    'src/graphql/generated/': {
      preset: 'client',
      plugins: [],
    },
  },
};

export default config;
