// Unified ESLint config for monorepo (backend + frontend)
module.exports = {
  root: true,
  ignorePatterns: ['dist', 'node_modules', 'backend/test', '**/*.e2e-spec.ts'],
  overrides: [
    // Type-aware linting for Backend source files only
    {
      files: ['backend/src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './backend/tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // Backend tests/e2e - do NOT require a TS project (avoids parserOptions.project errors)
    {
      files: [
        'backend/test/**/*.ts',
        'backend/**/*.spec.ts',
        'backend/**/*.e2e-spec.ts',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: { tsconfigRootDir: __dirname },
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // Frontend (React + TS)
    {
      files: ['frontend/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './frontend/tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true },
      },
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
      ],
      settings: { react: { version: 'detect' } },
      rules: {
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
      },
    },
  ],
};
