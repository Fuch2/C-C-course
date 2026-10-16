import { closeSync, existsSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const target = new URL('../.env', import.meta.url);
if (!existsSync(target)) {
  const template = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  writeFileSync(
    target,
    template.replace('RUNNER_TOKEN=""', `RUNNER_TOKEN="${randomBytes(32).toString('hex')}"`),
    { mode: 0o600 },
  );
  process.stdout.write('Создан .env с отдельным ключом runner.\n');
}
// Prisma 6 migrate deploy ожидает существующий файл пустой SQLite.
closeSync(openSync(new URL('../prisma/dev.db', import.meta.url), 'a'));
