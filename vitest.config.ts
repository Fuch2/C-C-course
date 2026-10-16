import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@course/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
      '@course/course-engine': fileURLToPath(
        new URL('./packages/course-engine/src/index.ts', import.meta.url),
      ),
    },
  },
  test: { environment: 'node', testTimeout: 30_000, hookTimeout: 30_000 },
});
