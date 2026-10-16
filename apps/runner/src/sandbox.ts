import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  sandboxRequestSchema,
  runRequestSchema,
  executionLimits,
  type SandboxRequest,
  type SandboxResult,
  type ProcessResult,
  type RunRequest,
  type RunResponse,
} from '../../../packages/shared/src/index.js';

export class RunnerError extends Error {
  constructor(
    message: string,
    public statusCode = 503,
  ) {
    super(message);
  }
}
export const owner = process.env.RUNNER_INSTANCE_ID ?? 'code-systems-local';
export function sandboxArguments(name: string, image: string): string[] {
  return [
    'run',
    '--detach',
    '--rm',
    '--init',
    '--pull',
    'never',
    '--name',
    name,
    '--label',
    'code-systems.sandbox=true',
    '--label',
    `code-systems.owner=${owner}`,
    '--network',
    'none',
    '--memory',
    '256m',
    '--memory-swap',
    '256m',
    '--cpus',
    '1',
    '--pids-limit',
    '64',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges:true',
    '--user',
    '10001:10001',
    '--ulimit',
    'nofile=64:64',
    '--ulimit',
    'fsize=16777216:16777216',
    '--ulimit',
    'core=0:0',
    '--tmpfs',
    '/work:rw,exec,nosuid,nodev,size=64m,uid=10001,gid=10001,mode=700',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=16m,uid=10001,gid=10001,mode=700',
    '--log-driver',
    'none',
    '--env',
    'LANG=C.UTF-8',
    '--env',
    'HOME=/tmp',
    '--entrypoint',
    '/usr/bin/sleep',
    image,
    '90',
  ];
}
type CommandResult = {
  stdout: Buffer;
  stderr: Buffer;
  code: number | null;
  durationMs: number;
  timeout: boolean;
  overflow: boolean;
};
/** Docker is the only host executable. Never invoke a shell, compiler or submitted binary here. */
function docker(
  args: string[],
  options: { stdin?: string; timeoutMs?: number; maxBytes?: number } = {},
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [],
      stderr: Buffer[] = [];
    let bytes = 0,
      timeout = false,
      overflow = false;
    const cap = options.maxBytes ?? 65_536;
    const timer = setTimeout(() => {
      timeout = true;
      child.kill('SIGKILL');
    }, options.timeoutMs ?? 10_000);
    const collect = (chunks: Buffer[], chunk: Buffer) => {
      const keep = Math.max(0, cap - bytes);
      if (keep) chunks.push(chunk.subarray(0, keep));
      bytes += chunk.length;
      if (bytes > cap) {
        overflow = true;
        child.kill('SIGKILL');
      }
    };
    child.stdout.on('data', (b: Buffer) => collect(stdout, b));
    child.stderr.on('data', (b: Buffer) => collect(stderr, b));
    child.stdin.on('error', () => {});
    child.once('error', () => {
      clearTimeout(timer);
      reject(new RunnerError('Не удалось обратиться к Docker. Проверьте, запущен ли Docker.'));
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      resolve({
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        code,
        durationMs: Math.round(performance.now() - started),
        timeout,
        overflow,
      });
    });
    child.stdin.end(options.stdin ?? '');
  });
}
async function control(args: string[]) {
  const result = await docker(args);
  if (result.code !== 0 || result.timeout || result.overflow)
    throw new RunnerError('Ошибка управления sandbox. Проверьте Docker и образ среды выполнения.');
  return result.stdout.toString('utf8');
}
const activeContainers = new Set<string>();
export async function removeContainer(name: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const removed = await docker(['rm', '--force', name], { timeoutMs: 5000 });
    if (removed.code === 0 || /No such container/i.test(removed.stderr.toString())) {
      activeContainers.delete(name);
      return;
    }
  }
  throw new RunnerError('Не удалось удалить sandbox. Новые запуски остановлены до очистки.');
}
export async function cleanupSandboxes(): Promise<void> {
  const results = await Promise.allSettled([...activeContainers].map(removeContainer));
  if (results.some((r) => r.status === 'rejected'))
    throw new RunnerError('Docker не подтвердил очистку контейнеров.');
}
/** Restart recovery touches only containers assigned to this runner instance. */
export async function recoverSandboxes() {
  const version = (await control(['info', '--format', '{{.CgroupVersion}}'])).trim();
  if (version !== '2')
    throw new RunnerError('Runner требует Docker с cgroup v2 для контроля лимитов ресурсов.');
  const names = (
    await control([
      'ps',
      '-a',
      '--filter',
      'label=code-systems.sandbox=true',
      '--filter',
      `label=code-systems.owner=${owner}`,
      '--format',
      '{{.Names}}',
    ])
  )
    .trim()
    .split('\n')
    .filter(Boolean);
  for (const name of names) if (/^code-systems-[a-f0-9-]+$/.test(name)) await removeContainer(name);
}
async function resourceExceeded(name: string) {
  // Kernel cgroup files are read-only. Submitted stdout is never used as telemetry.
  const counters = await docker(
    ['exec', name, '/bin/cat', '/sys/fs/cgroup/memory.events', '/sys/fs/cgroup/pids.events'],
    { timeoutMs: 1500, maxBytes: 4096 },
  );
  if (counters.code === 0)
    return /^(?:oom_kill|oom|max) [1-9][0-9]*$/m.test(counters.stdout.toString());
  // Saturating pids.max can prevent exec; top does not create an in-container process.
  const processes = await docker(['top', name, '-eo', 'pid'], { timeoutMs: 1500, maxBytes: 8192 });
  return processes.code === 0 && processes.stdout.toString().trim().split('\n').length - 1 >= 60;
}
function decode(buffer: Buffer) {
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer).replace(/\uFFFD/g, '?');
}
async function phase(
  name: string,
  command: string[],
  stdin: string,
  timeoutMs: number,
): Promise<ProcessResult> {
  const result = await docker(['exec', '--interactive', '--workdir', '/work', name, ...command], {
    stdin,
    timeoutMs,
    maxBytes: executionLimits.outputBytes,
  });
  const limited = await resourceExceeded(name);
  const status = result.overflow
    ? 'output_limit'
    : limited || result.code === 153
      ? 'resource_limit'
      : result.timeout
        ? 'timeout'
        : result.code === 0
          ? 'ok'
          : 'runtime_error';
  return {
    stdout: decode(result.stdout),
    stderr: decode(result.stderr),
    exitCode: result.code,
    durationMs: result.durationMs,
    status,
  };
}
let cleanupFailed = false;
let stopping = false;
export function beginShutdown() {
  stopping = true;
}
// Режим выбирается доверенным проверяющим скриптом, не публичным запросом.
export type DiagnosticMode = 'none' | 'sanitizers' | 'valgrind';
export async function executeSandbox(
  input: SandboxRequest,
  diagnosticOverride?: DiagnosticMode,
): Promise<SandboxResult> {
  const request = sandboxRequestSchema.parse(input);
  const diagnostic = diagnosticOverride ?? request.diagnostics ?? 'none';
  if (!['none', 'sanitizers', 'valgrind'].includes(diagnostic))
    throw new RunnerError('Неизвестный режим диагностики.', 400);
  if (cleanupFailed)
    throw new RunnerError('Запуски остановлены: требуется подтверждённая очистка Docker.');
  if (stopping) throw new RunnerError('Runner останавливается.');
  runRequestSchema.parse({
    language: request.standard.startsWith('c++') ? 'cpp' : 'c',
    standard: request.standard,
    compiler: request.compiler,
    sourceCode: request.source,
    stdin: request.stdin,
    timeoutMs: request.timeoutMs ?? 2000,
  });
  if (request.cases.some((c) => Buffer.byteLength(c.stdin) > executionLimits.stdinBytes))
    throw new RunnerError('Входные данные превышают лимит.', 400);
  const image = process.env.SANDBOX_IMAGE ?? 'code-systems-sandbox:local';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_./:@-]+$/.test(image))
    throw new RunnerError('Некорректное имя образа sandbox');
  const directory = await mkdtemp(path.join(tmpdir(), 'code-systems-source-'));
  const sourceName = request.standard.startsWith('c++') ? 'main.cpp' : 'main.c';
  const sourcePath = path.join(directory, sourceName);
  let compilation: ProcessResult | undefined;
  const runs: ProcessResult[] = [];
  const deadline = performance.now() + 90_000;
  try {
    await writeFile(sourcePath, request.source, { mode: 0o444 });
    // Every test gets a fresh compiler, source, filesystem and PID namespace. Binaries stay in Docker.
    for (const testcase of request.cases) {
      if (stopping) throw new RunnerError('Runner останавливается.');
      const name = `code-systems-${randomUUID()}`;
      activeContainers.add(name);
      try {
        await control(sandboxArguments(name, image));
        if (stopping) throw new RunnerError('Runner останавливается.');
        // Docker cp cannot write to a read-only container root. tee writes only into our bounded tmpfs.
        const upload = await docker(
          ['exec', '--interactive', name, '/usr/bin/tee', `/work/${sourceName}`],
          { stdin: request.source, maxBytes: executionLimits.sourceBytes },
        );
        if (upload.code !== 0 || upload.timeout || upload.overflow)
          throw new RunnerError('Не удалось передать исходник в sandbox.');
        const cpp = request.standard.startsWith('c++');
        const compiler =
          request.compiler === 'gcc'
            ? cpp
              ? '/usr/bin/g++'
              : '/usr/bin/gcc'
            : cpp
              ? '/usr/bin/clang++'
              : '/usr/bin/clang';
        const remaining = () => Math.max(1, deadline - performance.now());
        const compiled = await phase(
          name,
          [
            compiler,
            `-std=${request.standard}`,
            '-Wall',
            '-Wextra',
            '-Wpedantic',
            '-O0',
            diagnostic === 'none' ? '-g0' : '-g',
            ...(diagnostic === 'sanitizers'
              ? [
                  '-fsanitize=address,undefined',
                  '-fno-sanitize-recover=all',
                  '-fno-omit-frame-pointer',
                ]
              : []),
            '-fdiagnostics-color=never',
            sourceName,
            '-o',
            '/work/program',
            '-pthread',
            '-lm',
            '-lsqlite3',
          ],
          '',
          Math.min(executionLimits.compileTimeoutMs, remaining()),
        );
        compilation ??= compiled;
        if (compiled.status !== 'ok') {
          compilation = compiled;
          break;
        }
        if (stopping) throw new RunnerError('Runner останавливается.');
        runs.push(
          await phase(
            name,
            diagnostic === 'sanitizers'
              ? [
                  '/usr/bin/env',
                  'ASAN_OPTIONS=detect_leaks=1:halt_on_error=1',
                  'UBSAN_OPTIONS=halt_on_error=1:print_stacktrace=1',
                  '/work/program',
                ]
              : diagnostic === 'valgrind'
                ? [
                    '/usr/bin/valgrind',
                    '--error-exitcode=99',
                    '--leak-check=full',
                    '--show-leak-kinds=all',
                    '--errors-for-leak-kinds=definite,indirect,possible',
                    '--track-origins=yes',
                    '/work/program',
                  ]
                : ['/work/program'],
            testcase.stdin,
            Math.min(diagnostic === 'valgrind' ? 30_000 : (request.timeoutMs ?? 2000), remaining()),
          ),
        );
      } finally {
        try {
          await removeContainer(name);
        } catch (error) {
          cleanupFailed = true;
          throw error;
        }
      }
      if (performance.now() > deadline && runs.length < request.cases.length)
        throw new RunnerError('Истёк общий лимит проверки задания.', 504);
    }
    if (!compilation) throw new RunnerError('Компиляция не была выполнена.');
    return { compilation, runs };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
export async function executeCode(input: RunRequest): Promise<RunResponse> {
  const request = runRequestSchema.parse(input);
  const result = await executeSandbox({
    source: request.sourceCode,
    standard: request.standard,
    compiler: request.compiler,
    stdin: request.stdin,
    timeoutMs: request.timeoutMs,
    cases: [{ stdin: request.stdin }],
  });
  const { compilation } = result;
  const run = result.runs[0];
  const current = compilation.status === 'ok' ? run : compilation;
  if (!current) throw new RunnerError('Среда не вернула результат выполнения.');
  const status: RunResponse['status'] =
    current.status === 'ok'
      ? 'success'
      : current.status === 'timeout'
        ? 'timeout'
        : current.status === 'output_limit' || current.status === 'resource_limit'
          ? 'resource_limit'
          : compilation.status !== 'ok'
            ? 'compile_error'
            : 'runtime_error';
  return {
    status,
    compilerOutput: compilation.stdout + compilation.stderr,
    stdout: run?.stdout ?? '',
    stderr: run?.stderr ?? '',
    exitCode: run?.exitCode ?? null,
    executionTimeMs: run?.durationMs ?? 0,
  };
}
export class JobQueue {
  private running = 0;
  private closed = false;
  private readonly waiting: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];
  constructor(
    private readonly concurrency = 2,
    private readonly capacity = 8,
    private readonly waitTimeoutMs = 20_000,
  ) {}
  get size() {
    return { running: this.running, waiting: this.waiting.length };
  }
  close() {
    this.closed = true;
    for (const item of this.waiting.splice(0)) {
      clearTimeout(item.timer);
      item.reject(new RunnerError('Сервис перезапускается. Повторите запрос.'));
    }
  }
  async run<T>(job: () => Promise<T>): Promise<T> {
    if (this.closed) throw new RunnerError('Сервис останавливается.');
    if (this.running >= this.concurrency) {
      if (this.waiting.length >= this.capacity)
        throw new RunnerError('Очередь заполнена. Повторите запуск немного позже.', 429);
      await new Promise<void>((resolve, reject) => {
        const item = {
          resolve,
          reject,
          timer: setTimeout(() => {
            const index = this.waiting.indexOf(item);
            if (index >= 0) this.waiting.splice(index, 1);
            reject(new RunnerError('Истекло время ожидания в очереди.', 429));
          }, this.waitTimeoutMs),
        };
        this.waiting.push(item);
      });
    } else this.running += 1;
    try {
      return await job();
    } finally {
      const next = this.waiting.shift();
      if (next) {
        clearTimeout(next.timer);
        next.resolve();
      } else this.running -= 1;
    }
  }
}
export const runnerReady = () => !cleanupFailed;
