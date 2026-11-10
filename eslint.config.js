import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const expoConfig = require('eslint-config-expo/flat');

export default [
  ...expoConfig,
  {
    settings: {
      'import/resolver': {
        node: true,
        typescript: { project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'] },
      },
    },
    // TypeScript already checks imported names; this rule misreads some Expo packages' typings.
    rules: { 'import/namespace': 'off' },
  },
  { ignores: ['**/dist/**', '**/.expo/**', 'site/**', '**/*.generated.ts', 'packages/core/database.types.ts'] },
  {
    // CLAUDE.md: no hard-coded user-facing strings in components; every word comes from i18n.
    files: ['apps/app/src/**/*.tsx', 'packages/ui/**/*.tsx'],
    rules: {
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true, allowedStrings: ['·', '›', '—'] }],
    },
  },
  {
    // Privacy by construction: the client never references a secret key.
    files: ['apps/**/*.{ts,tsx,js}', 'packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'Literal[value=/service_role|SERVICE_ROLE|sb_secret_/]',
        message: 'Service-role / secret keys must never appear in client code.',
      }, {
        selector: 'MemberExpression[property.name=/SERVICE_ROLE|SECRET/]',
        message: 'Secrets are server-only (site/api).',
      }],
    },
  },
];
