import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { loadCourse } from '@course/course-engine';
import { mkdtempSync, readFileSync, readdirSync, rmSync, closeSync, openSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { listAttemptHistory, pruneAttemptHistory } from '../../apps/web/lib/attempt-history';
import { recordProgress } from '../../apps/web/lib/progress';

const directory = mkdtempSync(path.join(tmpdir(), 'course-db-test-'));
const database = path.join(directory, 'test.db');
closeSync(openSync(database, 'a'));
const client = new PrismaClient({ datasourceUrl: `file:${database}` });
beforeAll(async () => {
  for (const entry of readdirSync('prisma/migrations')
    .filter((name) => /^\d/.test(name))
    .sort()) {
    const sql = readFileSync(`prisma/migrations/${entry}/migration.sql`, 'utf8');
    for (const statement of sql.split(';').filter((s) => s.trim()))
      await client.$executeRawUnsafe(statement);
  }
});
afterAll(async () => {
  await client.$disconnect();
  rmSync(directory, { recursive: true, force: true });
});

describe('Настоящая SQLite через Prisma', () => {
  it('хранит профиль, черновик, закладку и историю после переподключения', async () => {
    const profile = await client.user.create({ data: { localKey: 'test-session-hash' } });
    const key = { userId: profile.id, lessonId: 'first-program' };
    await client.draft.create({ data: { ...key, source: 'my original code', stdin: 'input' } });
    await client.bookmark.create({ data: key });
    await client.exerciseAttempt.create({
      data: {
        ...key,
        source: 'code',
        stdin: '',
        compiler: 'gcc',
        standard: 'c17',
        mode: 'check',
        status: 'wrong_answer',
        result: '{}',
      },
    });
    await client.$disconnect();
    const loaded = await client.user.findUniqueOrThrow({
      where: { id: profile.id },
      include: { drafts: true, bookmarks: true, attempts: true },
    });
    expect(loaded.drafts[0]?.source).toBe('my original code');
    expect(loaded.bookmarks[0]?.lessonId).toBe('first-program');
    expect(loaded.attempts).toHaveLength(1);
  });
  it('завершает урок только после трёх частей и сохраняет уже полученный результат', async () => {
    const loaded = loadCourse();
    const profile = await client.user.create({ data: { localKey: 'progress-session' } });
    const where = { userId_lessonId: { userId: profile.id, lessonId: 'practice-example' } };
    await client.$transaction((tx) =>
      recordProgress(tx, profile.id, 'practice-example', { practicePassed: true }, loaded),
    );
    expect((await client.lessonProgress.findUniqueOrThrow({ where })).completedAt).toBeNull();
    await client.$transaction((tx) =>
      recordProgress(tx, profile.id, 'practice-example', { quizPassed: true }, loaded),
    );
    await client.$transaction((tx) =>
      recordProgress(tx, profile.id, 'practice-example', { read: true }, loaded),
    );
    const final = await client.lessonProgress.findUniqueOrThrow({ where });
    expect(final.completedAt).not.toBeNull();
    await client.$transaction((tx) =>
      recordProgress(tx, profile.id, 'practice-example', { read: true }, loaded),
    );
    expect((await client.lessonProgress.findUniqueOrThrow({ where })).completedAt).toEqual(
      final.completedAt,
    );
    const other = await client.user.create({ data: { localKey: 'other-profile' } });
    expect(await client.lessonProgress.count({ where: { userId: other.id } })).toBe(0);
  });
  it('листает одинаковые timestamp без пропусков и хранит последние 100 попыток', async () => {
    const profile = await client.user.create({ data: { localKey: 'attempt-history' } });
    const key = { userId: profile.id, lessonId: 'history-exercise' };
    const createdAt = new Date('2026-09-15T00:00:00.000Z');
    await client.exerciseAttempt.createMany({
      data: Array.from({ length: 105 }, (_, index) => ({
        id: `attempt-${String(index).padStart(3, '0')}`,
        ...key,
        source: `source-${index}`,
        stdin: '',
        compiler: 'gcc',
        standard: 'c17',
        mode: 'run',
        status: 'executed',
        result: '{}',
        createdAt,
      })),
    });
    await client.exerciseAttempt.create({
      data: {
        ...key,
        lessonId: 'other-exercise',
        source: 'other',
        stdin: '',
        compiler: 'gcc',
        standard: 'c17',
        mode: 'run',
        status: 'executed',
        result: '{}',
        createdAt,
      },
    });
    await client.$transaction((tx) => pruneAttemptHistory(tx, key));
    expect(await client.exerciseAttempt.count({ where: key })).toBe(100);
    expect(
      await client.exerciseAttempt.count({
        where: { userId: profile.id, lessonId: 'other-exercise' },
      }),
    ).toBe(1);

    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await listAttemptHistory(client, key, cursor);
      ids.push(...page.attempts.map((attempt) => attempt.id));
      cursor = page.nextCursor;
    } while (cursor);
    expect(ids).toHaveLength(100);
    expect(new Set(ids).size).toBe(100);
    expect(ids[0]).toBe('attempt-104');
    expect(ids.at(-1)).toBe('attempt-005');
  });
});
