import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Base ESLint config shared across packages and apps.
 */
export const baseConfig = tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
);

/**
 * Strict rules for @vanguarda/core (zero platform/non-deterministic APIs).
 */
export const coreConfig = tseslint.config(...baseConfig, {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['apps/*', '**/apps/**'],
            message: 'core package cannot import from apps.',
          },
          {
            group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
            message: 'React APIs are prohibited in @vanguarda/core.',
          },
          {
            group: ['react-native', 'react-native/*'],
            message: 'React Native APIs are prohibited in @vanguarda/core.',
          },
          {
            group: ['node:*', 'fs', 'path', 'http', 'https', 'os', 'child_process'],
            message: 'Node.js runtime APIs are prohibited in @vanguarda/core.',
          },
        ],
      },
    ],
    'no-restricted-globals': [
      'error',
      { name: 'window', message: 'window is prohibited in @vanguarda/core.' },
      { name: 'document', message: 'document is prohibited in @vanguarda/core.' },
      { name: 'localStorage', message: 'localStorage is prohibited in @vanguarda/core.' },
      { name: 'sessionStorage', message: 'sessionStorage is prohibited in @vanguarda/core.' },
      { name: 'fetch', message: 'fetch is prohibited in @vanguarda/core.' },
      { name: 'setTimeout', message: 'setTimeout is prohibited in @vanguarda/core (use world.tick).' },
      { name: 'setInterval', message: 'setInterval is prohibited in @vanguarda/core (use world.tick).' },
      { name: 'Date', message: 'Date is prohibited in @vanguarda/core (use world.tick for determinism).' },
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'Math',
        property: 'random',
        message: 'Math.random() is prohibited in @vanguarda/core. Use seeded PRNG.',
      },
      {
        object: 'performance',
        property: 'now',
        message: 'performance.now() is prohibited in @vanguarda/core.',
      },
      {
        object: 'Date',
        property: 'now',
        message: 'Date.now() is prohibited in @vanguarda/core.',
      },
    ],
  },
});

export default baseConfig;

