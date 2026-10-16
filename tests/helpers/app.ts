import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, readdirSync, rmSync, openSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

export async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Не удалось выделить тестовый порт');
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}
async function stop(child: ChildProcess) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 5000);
    child.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
export async function startTestApp(withRunner = false) {
  const directory = mkdtempSync(path.join(tmpdir(), 'course-api-test-'));
  const database = path.join(directory, 'test.db');
  closeSync(openSync(database, 'a'));
  const client = new PrismaClient({ datasourceUrl: `file:${database}` });
  for (const entry of readdirSync('prisma/migrations')
    .filter((name) => /^\d/.test(name))
    .sort()) {
    for (const sql of readFileSync(`prisma/migrations/${entry}/migration.sql`, 'utf8')
      .split(';')
      .filter((s) => s.trim()))
      await client.$executeRawUnsafe(sql);
  }
  await client.$disconnect();
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const runnerPort = await freePort();
  const environment = {
    ...process.env,
    APP_ORIGIN: origin,
    DATABASE_URL: `file:${database}`,
    NEXT_DIST_DIR: `.next-integration-${port}`,
    NEXT_TELEMETRY_DISABLED: '1',
    COURSE_CACHE: '1',
    RUNNER_PORT: String(runnerPort),
    RUNNER_INSTANCE_ID: `integration-${runnerPort}`,
    RUNNER_URL: `http://127.0.0.1:${runnerPort}`,
    RUNNER_TOKEN: 'integration-only-secret-value-at-least-32-bytes',
    RUNNER_TOKEN_FILE: '',
  };
  const runner = withRunner
    ? spawn(process.execPath, ['--import', 'tsx', 'apps/runner/src/index.ts'], {
        env: environment,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    : null;
  const web = spawn(
    process.execPath,
    [
      path.resolve('node_modules/next/dist/bin/next'),
      'dev',
      '--webpack',
      '-H',
      '127.0.0.1',
      '-p',
      String(port),
    ],
    { cwd: path.resolve('apps/web'), env: environment, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let output = '';
  const capture = (chunk: Buffer) => {
    output = (output + chunk.toString()).slice(-12_000);
  };
  web.stdout?.on('data', capture);
  web.stderr?.on('data', capture);
  runner?.stdout?.on('data', capture);
  runner?.stderr?.on('data', capture);
  const cleanup = async () => {
    await stop(web);
    if (runner) await stop(runner);
    rmSync(directory, { recursive: true, force: true });
    rmSync(path.resolve(`apps/web/.next-integration-${port}`), { recursive: true, force: true });
  };
  try {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      try {
        // В dev первый запрос компилирует маршрут и валидирует весь файловый курс.
        // Общий deadline остаётся 60 секунд; короткий polling не должен отменять здоровый ответ.
        const response = await fetch(`${origin}/api/course`, {
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok)
          return { origin, cleanup, databaseUrl: `file:${database}`, logs: () => output };
      } catch {
        /* Сервер ещё компилирует начальный маршрут. */
      }
      if (web.exitCode !== null) throw new Error(output);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Тестовый сервер не запустился: ${output}`);
  } catch (error) {
    await cleanup();
    throw error;
  }
}

export function browserSession(origin: string) {
  let cookie = '';
  return async (
    route: string,
    options: { method?: string; body?: unknown; origin?: string } = {},
  ) => {
    const response = await fetch(`${origin}${route}`, {
      method: options.method ?? 'GET',
      headers: {
        Cookie: cookie,
        Origin: options.origin ?? origin,
        'Content-Type': 'application/json',
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0]!;
    return { response, body: await response.json() };
  };
}
