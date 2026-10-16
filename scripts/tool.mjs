// Запуск CLI без зависимости от PATH: пути рабочей папки могут содержать двоеточие.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
const require = createRequire(import.meta.url);
try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const entries = {
  tsc: 'typescript',
  tsx: 'tsx',
  eslint: 'eslint',
  prettier: 'prettier',
  vitest: 'vitest',
  prisma: 'prisma',
};
const [tool, ...args] = process.argv.slice(2);
if (!Object.hasOwn(entries, tool)) throw new Error('Неизвестный инструмент');
const manifest = require.resolve(`${entries[tool]}/package.json`);
const pkg = require(manifest);
const executable = path.resolve(
  path.dirname(manifest),
  typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[tool],
);
const child = spawn(process.execPath, [executable, ...args], {
  stdio: 'inherit',
  env: process.env,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
