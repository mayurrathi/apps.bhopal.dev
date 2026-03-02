import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore build output and Node.js utility scripts that use require/CommonJS
  globalIgnores([
    'dist',
    'scripts/**',
    'src/generate_phrases.js',
    'generate_phrases.js',
    'update_phrases.js',
    'evaluate_audio_size.js',
    '.commitlintrc.js',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        // Firebase Studio / Vercel injected globals
        __firebase_config: 'readonly',
        __app_id: 'readonly',
        __initial_auth_token: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Allow unused vars if they start with _ (catch parameters) or are uppercase
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_|^e$',
      }],
      // Allow empty catch blocks — used intentionally for silent fallbacks
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
])

