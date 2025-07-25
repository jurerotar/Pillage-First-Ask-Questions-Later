import reactCompiler from 'eslint-plugin-react-compiler';
import { parser } from 'typescript-eslint';

// npm i --save-dev @typescript-eslint/parser typescript-eslint eslint-plugin-react-compiler eslint

export default [
  reactCompiler.configs.recommended,
  {
    ignores: [
      'build',
      '*.config.ts',
      'scripts',
      'node_modules',
      '.react-router',
    ],
  },
  {
    files: ['app/**/*.tsx'],
    languageOptions: {
      parser,
    },
  },
];
