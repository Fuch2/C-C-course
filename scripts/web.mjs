import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await import('./copy-monaco.mjs');
const require = createRequire(import.meta.url);
const child = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
