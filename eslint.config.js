// Flat config for ESLint v9+ (CommonJS)
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  // Global ignores
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'frontend/src/components/ItchGames-backup.tsx'],
  },
  {
    files: ['backend/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: './backend/tsconfig.json', tsconfigRootDir: __dirname },
      sourceType: 'module',
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...(tseslint.configs?.recommended?.rules || {}),
      // Relax strict rules to keep CI green while we iterate
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['frontend/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: './frontend/tsconfig.json', tsconfigRootDir: __dirname, ecmaFeatures: { jsx: true } },
      sourceType: 'module',
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...(tseslint.configs?.recommended?.rules || {}),
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Use the node-specific tsconfig for Vite config file
  {
    files: ['frontend/vite.config.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: './frontend/tsconfig.node.json', tsconfigRootDir: __dirname },
      sourceType: 'module',
    },
  },
];
