import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginImport from 'eslint-plugin-import';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      import: eslintPluginImport,
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          trailingComma: 'all',
          printWidth: 100,
          tabWidth: 2,
        },
      ],
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn'],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
