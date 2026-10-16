import { describe, expect, it } from 'vitest';
import { JobQueue, sandboxArguments } from '../../apps/runner/src/sandbox';
describe('Ограничения Docker', () => {
  it('изолирует сеть, память, процессор, PID, пользователя и файловую систему', () => {
    const args = sandboxArguments('test-name', 'test-image');
    for (const flag of [
      '--read-only',
      '--init',
      '--rm',
      '--cap-drop',
      '--security-opt',
      '--pids-limit',
      '--memory',
      '--memory-swap',
      '--cpus',
    ])
      expect(args).toContain(flag);
    expect(args[args.indexOf('--network') + 1]).toBe('none');
    expect(args[args.indexOf('--user') + 1]).toBe('10001:10001');
    expect(args).not.toContain('--privileged');
    expect(args).not.toContain('--volume');
    expect(args).not.toContain('/var/run/docker.sock');
  });
  it('при остановке отклоняет ожидающие и новые работы, сохраняя активную', async () => {
    const queue = new JobQueue(1, 2);
    let finish!: () => void;
    const active = queue.run(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = queue.run(async () => 'не должна запускаться');
    const rejected = expect(pending).rejects.toThrow('перезапускается');
    queue.close();
    await rejected;
    await expect(queue.run(async () => 1)).rejects.toThrow('останавливается');
    expect(queue.size).toEqual({ running: 1, waiting: 0 });
    finish();
    await active;
    expect(queue.size).toEqual({ running: 0, waiting: 0 });
  });
  it('ограничивает очередь и освобождает слот после исключения', async () => {
    const queue = new JobQueue(1, 1);
    let finish!: () => void;
    const first = queue.run(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const second = queue.run(async () => 'second');
    await expect(queue.run(async () => 'third')).rejects.toThrow('Очередь заполнена');
    finish();
    await first;
    expect(await second).toBe('second');
    await expect(
      queue.run(async () => {
        throw new Error('expected');
      }),
    ).rejects.toThrow('expected');
    expect(queue.size).toEqual({ running: 0, waiting: 0 });
  });
});
