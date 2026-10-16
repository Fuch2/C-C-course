import { db } from '@/lib/db';
import { json } from '@/lib/http';
export async function GET() {
  let database = false;
  let runner = false;
  await Promise.allSettled([
    db.$queryRaw`SELECT 1`.then(() => {
      database = true;
    }),
    fetch(`${process.env.RUNNER_URL ?? 'http://127.0.0.1:4001'}/health`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    }).then((r) => {
      runner = r.ok;
    }),
  ]);
  return json({ ok: database && runner, database, runner }, database && runner ? 200 : 503);
}
