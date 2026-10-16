import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from './http';

const pageSize = 20;
const retentionLimit = 100;
const cursorSchema = z.strictObject({
  createdAt: z.string().datetime({ offset: true }),
  id: z.string().min(1).max(128),
});

type AttemptDatabase = Pick<Prisma.TransactionClient, 'exerciseAttempt'>;
type AttemptKey = { userId: string; lessonId: string };
type AttemptCursor = { createdAt: Date; id: string };

function cursorWhere(cursor: AttemptCursor): Prisma.ExerciseAttemptWhereInput {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
}

function decodeCursor(value: string | null): AttemptCursor | null {
  if (!value) return null;
  try {
    const parsed = cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) throw new Error('invalid date');
    return { createdAt, id: parsed.id };
  } catch {
    throw new ApiError(400, 'Неверный курсор истории.');
  }
}

function encodeCursor(cursor: AttemptCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }),
  ).toString('base64url');
}

export async function listAttemptHistory(
  database: AttemptDatabase,
  key: AttemptKey,
  cursorValue: string | null,
) {
  const cursor = decodeCursor(cursorValue);
  const attempts = await database.exerciseAttempt.findMany({
    where: { ...key, ...(cursor ? cursorWhere(cursor) : {}) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: pageSize + 1,
    select: {
      id: true,
      mode: true,
      source: true,
      compiler: true,
      standard: true,
      stdin: true,
      status: true,
      result: true,
      createdAt: true,
    },
  });
  const page = attempts.slice(0, pageSize);
  const last = page.at(-1);
  return {
    attempts: page.map(({ result, ...attempt }) => ({
      ...attempt,
      result: { ...JSON.parse(result), id: attempt.id },
    })),
    nextCursor:
      attempts.length > pageSize && last
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  };
}

export async function pruneAttemptHistory(
  transaction: Prisma.TransactionClient,
  key: AttemptKey,
): Promise<void> {
  const boundary = await transaction.exerciseAttempt.findFirst({
    where: key,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: retentionLimit - 1,
    select: { createdAt: true, id: true },
  });
  if (!boundary) return;
  await transaction.exerciseAttempt.deleteMany({
    where: { ...key, ...cursorWhere(boundary) },
  });
}
