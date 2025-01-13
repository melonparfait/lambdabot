// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['src/**.ts', 'tests/**.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended
    ],

  },
  {
    files: [
      'tests/**.ts'
    ],
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
);