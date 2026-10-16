import {
  chmodSync,
  chownSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  writeFileSync,
} from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

for (const directory of ['/data', '/secrets']) {
  mkdirSync(directory, { recursive: true });
  chownSync(directory, 10001, 10001);
  chmodSync(directory, 0o750);
}
if (!existsSync('/secrets/runner-token'))
  writeFileSync('/secrets/runner-token', randomBytes(32).toString('hex'), { mode: 0o640 });
chownSync('/secrets/runner-token', 10001, 10001);
closeSync(openSync('/data/course.db', 'a'));
execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
  stdio: 'inherit',
});
chownSync('/data/course.db', 10001, 10001);
chmodSync('/data/course.db', 0o640);
process.stdout.write('База курса и ключ runner готовы.\n');
