import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: 'apps/web/' } } },
  // Исходники уроков — данные для scripts/lessons/build.ts.
  { files: ['content/**/lesson.src.mjs'], rules: { 'import/no-anonymous-default-export': 'off' } },
  globalIgnores([
    '**/.next/**',
    '**/.next-integration*/**',
    '**/dist/**',
    '**/node_modules/**',
    'apps/web/public/monaco/**',
    'apps/web/next-env.d.ts',
  ]),
]);
