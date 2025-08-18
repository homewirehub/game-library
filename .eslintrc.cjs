module.exports = {
  root: true,
  ignorePatterns: ['dist', 'node_modules'],
  overrides: [
    {
      files: ['backend/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: { project: './backend/tsconfig.json', tsconfigRootDir: __dirname },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['frontend/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: { project: './frontend/tsconfig.json', tsconfigRootDir: __dirname, ecmaFeatures: { jsx: true } },
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
      ],
      settings: { react: { version: 'detect' } },
      rules: {},
    },
  ],
};
