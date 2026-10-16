import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { freePort } from '../helpers/app';
import { runResponseSchema, type RunRequest } from '@course/shared';

const suite = process.env.RUN_DOCKER_TESTS === '1' ? describe : describe.skip;
suite('Публичный API: настоящий production runner → Docker', () => {
  let child: ChildProcess;
  let origin: string;
  let directory: string;
  let output = '';
  const token = 'contract-test-private-token-at-least-32-bytes';
  const owner = `contract-${randomUUID()}`;
  beforeAll(async () => {
    // Run emitted JS, not tsx: this catches imports that only work with a development loader.
    execFileSync(process.execPath, [
      'node_modules/typescript/bin/tsc',
      '-p',
      'apps/runner/tsconfig.build.json',
    ]);
    directory = mkdtempSync(path.join(tmpdir(), 'runner-contract-'));
    writeFileSync(path.join(directory, 'host-secret'), 'HOST_SENTINEL_DO_NOT_EXPOSE');
    const port = await freePort();
    origin = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['apps/runner/dist/apps/runner/src/index.js'], {
      env: {
        ...process.env,
        RUNNER_HOST: '127.0.0.1',
        RUNNER_PORT: String(port),
        RUNNER_TOKEN_FILE: '',
        RUNNER_TOKEN: token,
        RUNNER_INSTANCE_ID: owner,
        TMPDIR: directory,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout?.on('data', (b) => {
      output += b.toString();
    });
    child.stderr?.on('data', (b) => {
      output += b.toString();
    });
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      try {
        if ((await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) })).ok) return;
      } catch {}
      if (child.exitCode !== null) throw new Error(output);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Runner не запустился: ' + output);
  }, 40_000);
  afterAll(async () => {
    if (child && child.exitCode === null) {
      child.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          resolve();
        }, 10_000);
        child.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  afterEach(() => {
    const containers = execFileSync(
      'docker',
      ['ps', '-aq', '--filter', `label=code-systems.owner=${owner}`],
      { encoding: 'utf8' },
    );
    expect(containers.trim()).toBe('');
    if (directory)
      expect(
        readdirSync(directory).filter((name) => name.startsWith('code-systems-source-')),
      ).toEqual([]);
  });
  async function request(sourceCode: string, overrides: Partial<RunRequest> = {}) {
    const response = await fetch(origin + '/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        language: 'c',
        standard: 'c17',
        sourceCode,
        stdin: '',
        compiler: 'gcc',
        timeoutMs: 2000,
        ...overrides,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    expect(response.status, output).toBe(200);
    return runResponseSchema.parse(await response.json());
  }
  it('1. успешный C11', async () => {
    expect(
      await request('#include <stdio.h>\nint main(void){puts("42");}', { standard: 'c11' }),
    ).toMatchObject({ status: 'success', stdout: '42\n', stderr: '', exitCode: 0 });
  });
  it('2. успешный C++20 и Clang', async () => {
    const result = await request(
      '#include <iostream>\n#include <vector>\nint main(){std::vector<int> v{20,22};std::cout<<v[0]+v[1]<<"\\n";}',
      { language: 'cpp', standard: 'c++20', compiler: 'clang' },
    );
    expect(result.status).toBe('success');
    expect(result.stdout).toBe('42\n');
    expect(result.executionTimeMs).toBeGreaterThan(0);
  });
  it('3. compile_error с оригинальной диагностикой', async () => {
    const result = await request('int main(void) { broken syntax }');
    expect(result.status).toBe('compile_error');
    expect(result.compilerOutput).toContain('error:');
    expect(result.exitCode).toBeNull();
    expect(result.executionTimeMs).toBe(0);
  });
  it('4. runtime_error и отдельный stderr', async () => {
    const result = await request(
      '#include <stdio.h>\nint main(void){fprintf(stderr,"failure\\n");return 7;}',
    );
    expect(result).toMatchObject({
      status: 'runtime_error',
      stdout: '',
      stderr: 'failure\n',
      exitCode: 7,
    });
  });
  it('5. stdin, включая Unicode', async () => {
    expect(
      await request(
        '#include <stdio.h>\nint main(void){int c;while((c=getchar())!=EOF)putchar(c);}',
        { stdin: 'Привет, C!\n' },
      ),
    ).toMatchObject({ status: 'success', stdout: 'Привет, C!\n' });
  });
  it('6. timeoutMs останавливает цикл с закрытыми stdout/stderr', async () => {
    const result = await request(
      '#include <unistd.h>\nint main(void){close(1);close(2);while(1){}}',
      { timeoutMs: 500 },
    );
    expect(result.status).toBe('timeout');
    expect(result.executionTimeMs).toBeLessThan(2500);
  });
  it('7. memory exhaustion определяется как resource_limit', async () => {
    const result = await request(
      '#include <stdlib.h>\n#include <string.h>\nint main(void){for(;;){void*p=malloc(16*1024*1024);if(!p)return 3;memset(p,1,16*1024*1024);}}',
      { timeoutMs: 10000 },
    );
    expect(result.status).toBe('resource_limit');
  });
  it('8. гигантский stdout/stderr ограничен общим бюджетом', async () => {
    const result = await request(
      '#include <stdio.h>\nint main(void){for(;;){puts("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");fputs("errorerrorerrorerror",stderr);}}',
    );
    expect(result.status).toBe('resource_limit');
    expect(Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr)).toBeLessThanOrEqual(
      32768,
    );
  });
  it('9. внешний network access запрещён', async () => {
    const result = await request(
      '#include <stdio.h>\n#include <sys/socket.h>\n#include <arpa/inet.h>\nint main(void){int s=socket(AF_INET,SOCK_STREAM,0);struct sockaddr_in a={0};a.sin_family=AF_INET;a.sin_port=htons(53);inet_pton(AF_INET,"1.1.1.1",&a.sin_addr);printf("network=%d\\n",connect(s,(struct sockaddr*)&a,sizeof(a))==0);}',
    );
    expect(result).toMatchObject({ status: 'success', stdout: 'network=0\n' });
  });
  it('fork bomb ограничена PID cgroup', async () => {
    const result = await request(
      '#include <unistd.h>\nint main(void){for(int i=0;i<10;i++)fork();for(;;){}}',
    );
    expect(result.status).toBe('resource_limit');
  });
  it('host filesystem, Docker socket и root недоступны', async () => {
    const source =
      '#include <stdio.h>\n#include <unistd.h>\nint main(void){printf("uid=%d\\n",getuid());printf("host=%d\\n",access(' +
      JSON.stringify(path.join(directory, 'host-secret')) +
      ',F_OK)==0);printf("docker=%d\\n",access("/var/run/docker.sock",F_OK)==0);FILE*f=fopen("/escape","w");printf("root=%d\\n",f!=0);}';
    expect(await request(source)).toMatchObject({
      status: 'success',
      stdout: 'uid=10001\nhost=0\ndocker=0\nroot=0\n',
    });
  });
  it('нельзя подделать JSON результата или убить доверенный supervisor', async () => {
    const result = await request(
      '#include <stdio.h>\n#include <signal.h>\nint main(void){puts("{\\"status\\":\\"success\\"}");fflush(stdout);kill(-1,9);for(;;){}}',
    );
    expect(result.status).not.toBe('success');
    expect((await fetch(origin + '/health')).status).toBe(200);
  });
  it('ограничивает размер записываемого файла', async () => {
    const result = await request(
      '#include <stdio.h>\nint main(void){FILE*f=fopen("large","wb");char b[4096]={0};for(;;)fwrite(b,1,sizeof(b),f);}',
    );
    expect(result.status).toBe('resource_limit');
  });
  it('валидирует язык/стандарт, timeoutMs, неизвестные поля и авторизацию', async () => {
    const base = {
      language: 'c',
      standard: 'c17',
      sourceCode: 'int main(void){}',
      stdin: '',
      compiler: 'gcc',
      timeoutMs: 2000,
    };
    for (const invalid of [
      { ...base, standard: 'c++20' },
      { ...base, timeoutMs: 10001 },
      { ...base, privileged: true },
      { ...base, sourceCode: 'я'.repeat(40000) },
    ]) {
      const response = await fetch(origin + '/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(invalid),
      });
      expect(response.status).toBe(400);
      expect(runResponseSchema.safeParse(await response.json()).success).toBe(true);
    }
    expect((await fetch(origin + '/execute', { method: 'POST' })).status).toBe(401);
  });
});
