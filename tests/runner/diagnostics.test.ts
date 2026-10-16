import { describe, expect, it } from 'vitest';
import { executeSandbox, type DiagnosticMode } from '../../apps/runner/src/sandbox';
const suite = process.env.RUN_DOCKER_TESTS === '1' ? describe : describe.skip;
const run = (source: string, diagnostic: DiagnosticMode, compiler: 'gcc' | 'clang' = 'clang') =>
  executeSandbox(
    {
      source: '#include <stdlib.h>\n#include <limits.h>\n' + source,
      compiler,
      standard: 'c17',
      stdin: '',
      cases: [{ stdin: '' }],
      timeoutMs: 10000,
    },
    diagnostic,
  );
it('принимает корректный жизненный цикл с GCC ASan/UBSan', async () => {
  const result = await run(
    'int main(void){int *p=malloc(sizeof *p);if(!p)return 1;*p=7;int x=*p;free(p);return x==7?0:1;}',
    'sanitizers',
    'gcc',
  );
  expect(result.compilation.status, result.compilation.stderr).toBe('ok');
  expect(result.runs[0]?.status, result.runs[0]?.stderr).toBe('ok');
}, 60000);
suite('Диагностика памяти в неизменном Docker sandbox', () => {
  it.each(['sanitizers', 'valgrind'] as const)(
    'принимает корректный жизненный цикл: %s',
    async (mode) => {
      const result = await run(
        'int main(void){int *p=malloc(sizeof *p);if(!p)return 1;*p=7;int x=*p;free(p);return x==7?0:1;}',
        mode,
      );
      expect(result.compilation.status, result.compilation.stderr).toBe('ok');
      expect(result.runs[0]?.status, result.runs[0]?.stderr).toBe('ok');
    },
    60000,
  );
  it.each([
    [
      'выход за границу',
      'int main(void){int *p=malloc(sizeof *p);if(!p)return 1;p[1]=3;free(p);return 0;}',
      /AddressSanitizer/,
    ],
    [
      'использование после free',
      'int main(void){int *p=malloc(sizeof *p);if(!p)return 1;*p=3;free(p);return *p;}',
      /AddressSanitizer/,
    ],
    [
      'повторный free',
      'int main(void){int *p=malloc(sizeof *p);if(!p)return 1;free(p);free(p);return 0;}',
      /AddressSanitizer/,
    ],
    [
      'signed overflow',
      'int main(void){volatile int x=INT_MAX;return x+1;}',
      /runtime error: signed integer overflow/,
    ],
  ])(
    'обнаруживает %s',
    async (_name, source, message) => {
      const result = await run(source as string, 'sanitizers');
      expect(result.compilation.status, result.compilation.stderr).toBe('ok');
      expect(result.runs[0]?.status).toBe('runtime_error');
      expect(result.runs[0]?.stderr).toMatch(message as RegExp);
    },
    60000,
  );
  it('Valgrind обнаруживает потерянное выделение', async () => {
    const result = await run(
      'static void leak(void){int *p=malloc(16);if(p)*p=7;}int main(void){leak();return 0;}',
      'valgrind',
    );
    expect(result.compilation.status, result.compilation.stderr).toBe('ok');
    expect(result.runs[0]?.exitCode).toBe(99);
    expect(result.runs[0]?.stderr).toMatch(/definitely lost/);
  }, 60000);
  it('LeakSanitizer обнаруживает потерянное выделение', async () => {
    const result = await run(
      'static void leak(void){int *p=malloc(16);if(p)*p=7;}int main(void){leak();return 0;}',
      'sanitizers',
    );
    expect(result.compilation.status, result.compilation.stderr).toBe('ok');
    expect(result.runs[0]?.status).toBe('runtime_error');
    expect(result.runs[0]?.stderr).toMatch(/LeakSanitizer/);
  }, 60000);
});
