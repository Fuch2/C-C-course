import { expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

async function applyMigration(client: PrismaClient, migration: string) {
  for (const sql of readFileSync(`prisma/migrations/${migration}/migration.sql`, 'utf8')
    .split(';')
    .filter((statement) => statement.trim()))
    await client.$executeRawUnsafe(sql);
}

it('миграция локального пользователя сохраняет прежний прогресс и настройки', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'course-migration-'));
  const file = path.join(directory, 'legacy.db');
  closeSync(openSync(file, 'a'));
  const client = new PrismaClient({ datasourceUrl: `file:${file}` });
  try {
    await applyMigration(client, '202609080001_initial');
    await applyMigration(client, '202609080002_study_days');
    await client.$executeRaw`INSERT INTO Profile (id, sessionHash, name, dailyGoal, compiler, fontSize) VALUES ('legacy-user', 'legacy-session', 'Ученик', 45, 'clang', 18)`;
    await client.$executeRaw`INSERT INTO Progress (id, profileId, lessonId, read, updatedAt) VALUES ('legacy-progress', 'legacy-user', 'first-program', 1, CURRENT_TIMESTAMP)`;
    await client.$executeRaw`INSERT INTO Bookmark (id, profileId, lessonId) VALUES ('legacy-bookmark', 'legacy-user', 'first-program')`;
    await applyMigration(client, '202609080003_local_user');
    const user = await client.user.findUniqueOrThrow({
      where: { localKey: 'local' },
      include: { settings: true, progress: true, bookmarks: true },
    });
    expect(user.id).toBe('legacy-user');
    expect(user.settings).toMatchObject({ dailyGoal: 45, compiler: 'clang', fontSize: 18 });
    expect(user.progress[0]).toMatchObject({ read: true, lessonId: 'first-program' });
    expect(user.bookmarks[0]?.lessonId).toBe('first-program');
  } finally {
    await client.$disconnect();
    rmSync(directory, { recursive: true, force: true });
  }
});

it('миграция истории оставляет 100 последних попыток каждого задания', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'course-attempt-migration-'));
  const file = path.join(directory, 'attempts.db');
  closeSync(openSync(file, 'a'));
  const client = new PrismaClient({ datasourceUrl: `file:${file}` });
  try {
    for (const migration of [
      '202609080001_initial',
      '202609080002_study_days',
      '202609080003_local_user',
      '202609090001_exercise_stats',
    ])
      await applyMigration(client, migration);
    await client.user.create({ data: { id: 'migration-user', localKey: 'migration-user' } });
    const createdAt = new Date('2026-09-15T00:00:00.000Z');
    await client.exerciseAttempt.createMany({
      data: Array.from({ length: 105 }, (_, index) => ({
        id: `migration-attempt-${String(index).padStart(3, '0')}`,
        userId: 'migration-user',
        lessonId: 'migration-exercise',
        source: '',
        stdin: '',
        compiler: 'gcc',
        standard: 'c17',
        mode: 'run',
        status: 'executed',
        result: '{}',
        createdAt,
      })),
    });
    await applyMigration(client, '202609150001_attempt_history_retention');
    const remaining = await client.exerciseAttempt.findMany({
      where: { userId: 'migration-user', lessonId: 'migration-exercise' },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    expect(remaining).toHaveLength(100);
    expect(remaining[0]?.id).toBe('migration-attempt-005');
    expect(remaining.at(-1)?.id).toBe('migration-attempt-104');
  } finally {
    await client.$disconnect();
    rmSync(directory, { recursive: true, force: true });
  }
});
