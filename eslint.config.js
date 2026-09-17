import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'scripts/.smoke-bundle.cjs', 'scripts/.smoke-dest-bundle.cjs', 'scripts/.smoke-trips-page-bundle.cjs'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: { ecmaVersion: 'latest', ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      // framer-motion's `motion` proxy is only ever used as a JSX member
      // object (`motion.div`), which eslint-scope does not count as a usage.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|^motion$' }],
    },
  },
]
