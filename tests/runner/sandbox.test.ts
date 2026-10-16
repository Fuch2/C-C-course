import { describe, expect, it } from 'vitest';
import { executeSandbox } from '../../apps/runner/src/sandbox';
import type { Compiler, Standard } from '@course/shared';

const suite = process.env.RUN_DOCKER_TESTS === '1' ? describe : describe.skip;
suite('Реальные программы в Docker', () => {
  for (const compiler of ['gcc', 'clang'] as Compiler[]) {
    for (const standard of ['c11', 'c17', 'c++17', 'c++20'] as Standard[]) {
      it(`${compiler} ${standard}: компилирует, читает stdin, отделяет stderr`, async () => {
        const result = await executeSandbox({
          source:
            '#include <stdio.h>\nint main(void){int n=0;if(scanf("%d",&n)!=1)return 1;printf("%d\\n",n*2);fprintf(stderr,"diagnostic\\n");return 0;}',
          compiler,
          standard,
          stdin: '',
          cases: [{ stdin: '21\n' }, { stdin: '-3\n' }],
        });
        expect(result.compilation.status).toBe('ok');
        expect(result.runs[0]?.stdout).toBe('42\n');
        expect(result.runs[0]?.stderr).toBe('diagnostic\n');
        expect(result.runs[1]?.stdout).toBe('-6\n');
      }, 60000);
    }
  }
  const run = (source: string) =>
    executeSandbox({ source, compiler: 'gcc', standard: 'c17', stdin: '', cases: [{ stdin: '' }] });
  it('возвращает настоящую ошибку компиляции', async () => {
    const result = await run('int main(void) { broken syntax }');
    expect(result.compilation.status).toBe('runtime_error');
    expect(result.compilation.stderr).toContain('error:');
    expect(result.runs).toEqual([]);
  });
  it('останавливает бесконечный цикл, даже если программа закрывает потоки', async () => {
    const result = await run(
      '#include <unistd.h>\nint main(void){close(1);close(2);for(;;){} return 0;}',
    );
    expect(result.runs[0]?.status).toBe('timeout');
  }, 60000);
  it('ограничивает stdout и stderr общим лимитом', async () => {
    const result = await run(
      '#include <stdio.h>\nint main(void){for(;;){puts("a very long repeated line");fprintf(stderr,"error line\\n");}return 0;}',
    );
    const value = result.runs[0]!;
    expect(value.status).toBe('output_limit');
    expect(Buffer.byteLength(value.stdout) + Buffer.byteLength(value.stderr)).toBeLessThanOrEqual(
      32768,
    );
  });
  it('запрещает root, внешнюю сеть, записи в корень и доступ к socket Docker', async () => {
    const result = await run(
      '#include <stdio.h>\n#include <unistd.h>\n#include <sys/socket.h>\n#include <arpa/inet.h>\nint main(void){printf("uid=%d\\n",(int)getuid());FILE *f=fopen("/escape","w");printf("root=%d\\n",f!=NULL);if(f)fclose(f);printf("docker=%d\\n",access("/var/run/docker.sock",F_OK)==0);int s=socket(AF_INET,SOCK_STREAM,0);struct sockaddr_in a={0};a.sin_family=AF_INET;a.sin_port=htons(53);inet_pton(AF_INET,"1.1.1.1",&a.sin_addr);printf("network=%d\\n",connect(s,(struct sockaddr*)&a,sizeof(a))==0);close(s);return 0;}',
    );
    expect(result.runs[0]?.stdout).toBe('uid=10001\nroot=0\ndocker=0\nnetwork=0\n');
  });
  it('сдерживает fork bomb в PID namespace и завершает контейнер', async () => {
    const result = await run(
      '#include <unistd.h>\nint main(void){for(int i=0;i<10;i++)fork();for(;;){}return 0;}',
    );
    expect(result.runs[0]?.status).toBe('resource_limit');
  }, 60000);
  it('останавливает неограниченное потребление памяти', async () => {
    const result = await executeSandbox({
      source:
        '#include <stdlib.h>\n#include <string.h>\nint main(void){for(;;){void *p=malloc(16*1024*1024);if(!p)return 3;memset(p,1,16*1024*1024);}return 0;}',
      compiler: 'gcc',
      standard: 'c17',
      stdin: '',
      cases: [{ stdin: '' }],
      timeoutMs: 10000,
    });
    expect(result.runs[0]?.status).toBe('resource_limit');
  }, 60000);
  it('не переносит файлы между тестами', async () => {
    const result = await executeSandbox({
      source:
        '#include <stdio.h>\n#include <unistd.h>\nint main(void){printf("%d\\n",access("/work/flag",F_OK)==0);FILE*f=fopen("/work/flag","w");if(f)fclose(f);}',
      compiler: 'gcc',
      standard: 'c17',
      stdin: '',
      cases: [{ stdin: '' }, { stdin: '' }],
    });
    expect(result.runs.map((run) => run.stdout)).toEqual(['0\n', '0\n']);
  });
});
