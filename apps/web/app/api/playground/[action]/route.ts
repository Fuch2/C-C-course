import { z } from 'zod';
import {
  submissionSchema,
  runRequestSchema,
  executionFailure,
  executionToSubmission,
  type SubmissionResult,
} from '@course/shared';
import { apiError, ApiError, json, readJson } from '@/lib/http';
import { getProfile } from '@/lib/session';
import { db } from '@/lib/db';
import { limitSubmission, runCode, runPlayground } from '@/lib/runner';
import { recordStudy } from '@/lib/progress';
import { playgroundLesson } from '@/lib/playground';
import { listAttemptHistory, pruneAttemptHistory } from '@/lib/attempt-history';

type Context = { params: Promise<{ action: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const { action } = await context.params;
    const user = await getProfile();
    const key = { userId: user.id, lessonId: 'playground' };
    if (action === 'draft') {
      const draft = await db.draft.findUnique({ where: { userId_lessonId: key } });
      return json({
        source: draft?.source ?? playgroundLesson.exercise.starterCode,
        stdin: draft?.stdin ?? '',
      });
    }
    if (action === 'attempts') {
      const cursor = new URL(request.url).searchParams.get('before');
      return json(await listAttemptHistory(db, key, cursor));
    }
    throw new ApiError(404, 'Действие не найдено.');
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, context: Context) {
  const { action } = await context.params;
  try {
    const user = await getProfile();
    const key = { userId: user.id, lessonId: 'playground' };
    if (action === 'execute') {
      const input = await readJson(request, runRequestSchema, 300_000);
      return await limitSubmission(user.id, async () => {
        const { result, httpStatus } = await runPlayground(input);
        if (httpStatus === 200) {
          await db.$transaction(async (tx) => {
            await recordStudy(tx, user.id);
            await tx.draft.upsert({
              where: { userId_lessonId: key },
              create: { ...key, source: input.sourceCode, stdin: input.stdin },
              update: { source: input.sourceCode, stdin: input.stdin },
            });
            await tx.exerciseAttempt.create({
              data: {
                ...key,
                source: input.sourceCode,
                stdin: input.stdin,
                compiler: input.compiler,
                standard: input.standard,
                mode: 'run',
                status: executionToSubmission(result).status,
                result: JSON.stringify(executionToSubmission(result)),
              },
            });
            await pruneAttemptHistory(tx, key);
          });
        }
        return json(result, httpStatus);
      });
    }
    if (action === 'draft') {
      const data = await readJson(
        request,
        z.object({ source: z.string().max(65536), stdin: z.string().max(16384) }).strict(),
      );
      await db.draft.upsert({
        where: { userId_lessonId: key },
        create: { ...key, ...data },
        update: data,
      });
      return json({ saved: true });
    }
    if (action !== 'submit') throw new ApiError(404, 'Действие не найдено.');
    const input = await readJson(request, submissionSchema);
    if (input.mode !== 'run')
      throw new ApiError(400, 'В песочнице доступен свободный запуск без проверки задания.');
    return await limitSubmission(user.id, async () => {
      const sandbox = await runCode({
        source: input.source,
        stdin: input.stdin,
        compiler: input.compiler,
        standard: input.standard,
        cases: [{ stdin: input.stdin }],
      });
      const run = sandbox.runs[0];
      const result: SubmissionResult =
        sandbox.compilation.status !== 'ok'
          ? {
              id: '',
              status:
                sandbox.compilation.status === 'runtime_error'
                  ? 'compile_error'
                  : sandbox.compilation.status,
              compilation: sandbox.compilation,
            }
          : {
              id: '',
              status: run?.status === 'ok' ? 'executed' : (run?.status ?? 'runtime_error'),
              compilation: sandbox.compilation,
              run,
            };
      const attempt = await db.$transaction(async (tx) => {
        await recordStudy(tx, user.id);
        await tx.draft.upsert({
          where: { userId_lessonId: key },
          create: { ...key, source: input.source, stdin: input.stdin },
          update: { source: input.source, stdin: input.stdin },
        });
        const attempt = await tx.exerciseAttempt.create({
          data: { ...key, ...input, status: result.status, result: JSON.stringify(result) },
        });
        await pruneAttemptHistory(tx, key);
        return attempt;
      });
      return json({ ...result, id: attempt.id });
    });
  } catch (error) {
    if (action === 'execute')
      return json(
        executionFailure(
          error instanceof ApiError ? error.message : 'Не удалось выполнить запрос.',
          error instanceof ApiError && error.status === 429 ? 'resource_limit' : 'internal_error',
        ),
        error instanceof ApiError ? error.status : 500,
      );
    return apiError(error);
  }
}
