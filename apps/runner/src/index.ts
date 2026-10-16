import http from 'node:http';
import { readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { execFile } from 'node:child_process';
import {
  sandboxRequestSchema,
  runRequestSchema,
  executionFailure,
} from '../../../packages/shared/src/index.js';
import {
  cleanupSandboxes,
  recoverSandboxes,
  runnerReady,
  beginShutdown,
  executeCode,
  executeSandbox,
  JobQueue,
  RunnerError,
} from './sandbox.js';

const token = process.env.RUNNER_TOKEN_FILE
  ? readFileSync(process.env.RUNNER_TOKEN_FILE, 'utf8').trim()
  : process.env.RUNNER_TOKEN;
if (!token || token.length < 32)
  throw new Error(
    'Для runner необходим RUNNER_TOKEN длиной не менее 32 символов. Выполните npm run setup.',
  );
const queue = new JobQueue(2, 8);
let recovered = false;
// Readiness stays false until orphan cleanup has succeeded.
await recoverSandboxes();
recovered = true;
function authorized(header: string | undefined): boolean {
  const actual = Buffer.from(header ?? '');
  const expected = Buffer.from(`Bearer ${token}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function send(response: http.ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}
const server = http.createServer(
  { maxHeaderSize: 8_192, requestTimeout: 10_000 },
  async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      const healthy = await new Promise<boolean>((resolve) =>
        execFile(
          'docker',
          ['image', 'inspect', process.env.SANDBOX_IMAGE ?? 'code-systems-sandbox:local'],
          { timeout: 3000, maxBuffer: 64_000 },
          (error) => resolve(!error),
        ),
      );
      return send(response, healthy && recovered && runnerReady() ? 200 : 503, {
        ok: healthy && recovered && runnerReady(),
        ...queue.size,
      });
    }
    if (!authorized(request.headers.authorization))
      return send(response, 401, executionFailure('Неавторизованный запрос к runner.'));
    if (request.method !== 'POST' || !['/execute', '/check'].includes(request.url ?? ''))
      return send(response, 404, executionFailure('Маршрут не найден.'));
    if (!request.headers['content-type']?.startsWith('application/json'))
      return send(response, 415, executionFailure('Ожидается JSON.'));
    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of request) {
        const buffer = Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > 300_000) {
          send(response, 413, executionFailure('Запрос слишком большой.', 'resource_limit'));
          request.resume();
          return;
        }
        chunks.push(buffer);
      }
      let json: unknown;
      try {
        json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        return send(response, 400, executionFailure('Некорректный JSON.'));
      }
      let result;
      if (request.url === '/execute') {
        const parsed = runRequestSchema.safeParse(json);
        if (!parsed.success)
          throw new RunnerError(parsed.error.issues[0]?.message ?? 'Некорректные параметры.', 400);
        result = await queue.run(() => executeCode(parsed.data));
      } else {
        const parsed = sandboxRequestSchema.safeParse(json);
        if (!parsed.success) throw new RunnerError('Некорректные параметры проверки задания.', 400);
        result = await queue.run(() => executeSandbox(parsed.data));
      }
      send(response, 200, result);
    } catch (error) {
      const code = error instanceof RunnerError ? error.statusCode : 500;
      const message =
        error instanceof RunnerError ? error.message : 'Внутренняя ошибка среды выполнения.';
      send(
        response,
        code,
        request.url === '/check'
          ? { error: message }
          : executionFailure(
              message,
              code === 429 ? 'resource_limit' : code === 504 ? 'timeout' : 'internal_error',
            ),
      );
    }
  },
);
server.maxConnections = 64;
server.headersTimeout = 10_000;
server.setTimeout(130_000, (socket) => socket.destroy());
server.listen(Number(process.env.RUNNER_PORT ?? 4001), process.env.RUNNER_HOST ?? '127.0.0.1', () =>
  process.stdout.write('Runner готов к изолированным запускам.\n'),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, () => {
    recovered = false;
    queue.close();
    beginShutdown();
    server.close(() => {
      void cleanupSandboxes().then(
        () => process.exit(0),
        () => process.exit(1),
      );
    });
  });
