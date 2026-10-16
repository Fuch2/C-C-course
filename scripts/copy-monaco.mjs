// Monaco и его worker обслуживаются локально; ESM использует исправленный DOMPurify из lockfile.
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const directory = new URL('../apps/web/public/monaco/', import.meta.url);
await mkdir(directory, { recursive: true });
await build({
  entryPoints: [require.resolve('monaco-editor/editor/editor.worker.js')],
  outfile: fileURLToPath(new URL('editor.worker.js', directory)),
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2022',
});
