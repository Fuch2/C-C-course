import { z } from 'zod';
import { loadCourse, toPublicLesson } from '@course/course-engine';
import {
  allExerciseTests,
  exerciseStorageKey,
  buildSubmissionSource,
  gradeResults,
  isQuizAnswerCorrect,
  isQuizAnswerShapeValid,
  quizAnswerSchema,
  submissionSchema,
  testInput,
  type SubmissionResult,
} from '@course/shared';
import { apiError, ApiError, json, readJson } from '@/lib/http';
import { getProfile } from '@/lib/session';
import { db } from '@/lib/db';
import { recordProgress, recordStudy } from '@/lib/progress';
import { limitSubmission, runCode } from '@/lib/runner';
import { listAttemptHistory, pruneAttemptHistory } from '@/lib/attempt-history';

type Context = { params: Promise<{ lessonId: string; action: string }> };
async function resolveLesson(context: Context, request: Request) {
  const { lessonId, action } = await context.params;
  const loaded = loadCourse();
  const lesson = loaded.byId.get(lessonId);
  if (!lesson) throw new ApiError(404, 'Урок не найден.');
  const requested = new URL(request.url).searchParams.get('exercise');
  const exercise = requested
    ? [lesson.exercise, ...lesson.additionalExercises].find((e) => e.id === requested)
    : lesson.exercise;
  if (!exercise) throw new ApiError(404, 'Задание не найдено в этом уроке.');
  const storageId = exerciseStorageKey(lessonId, lesson.exercise.id, exercise.id);
  return { loaded, lesson, lessonId, action, exercise, storageId };
}
export async function GET(request: Request, context: Context) {
  try {
    const { lesson, action, exercise, storageId } = await resolveLesson(context, request);
    if (action === 'content') return json(toPublicLesson(lesson));
    const profile = await getProfile();
    if (action === 'draft') {
      const draft = await db.draft.findUnique({
        where: { userId_lessonId: { userId: profile.id, lessonId: storageId } },
      });
      return json({
        source: draft?.source ?? exercise.starterCode,
        stdin: draft?.stdin ?? testInput(exercise.publicTests[0]!),
      });
    }
    if (action === 'attempts') {
      const cursor = new URL(request.url).searchParams.get('before');
      return json(
        await listAttemptHistory(db, { userId: profile.id, lessonId: storageId }, cursor),
      );
    }
    if (action === 'stats') {
      const stats = await db.exerciseStats.findUnique({
        where: { userId_lessonId: { userId: profile.id, lessonId: storageId } },
      });
      return json(
        stats
          ? {
              attempts: stats.attempts,
              firstAttemptAt: stats.firstAttemptAt,
              lastAttemptAt: stats.lastAttemptAt,
              successful: stats.successful,
              hintViewed: stats.hintViewed,
              solutionViewed: stats.solutionViewed,
            }
          : {
              attempts: 0,
              firstAttemptAt: null,
              lastAttemptAt: null,
              successful: false,
              hintViewed: false,
              solutionViewed: false,
            },
      );
    }
    throw new ApiError(404, 'Действие не найдено.');
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const { loaded, lesson, lessonId, action, exercise, storageId } = await resolveLesson(
      context,
      request,
    );
    const profile = await getProfile();
    const key = { userId: profile.id, lessonId: storageId };
    if (action === 'read' || action === 'visit') {
      await readJson(request, z.object({}).strict(), 100);
      if (action === 'read')
        await db.$transaction((tx) =>
          recordProgress(tx, profile.id, lessonId, { read: true }, loaded),
        );
      else await db.user.update({ where: { id: profile.id }, data: { lastLessonId: lessonId } });
      return json({ ok: true });
    }
    if (action === 'bookmark') {
      const { saved } = await readJson(request, z.object({ saved: z.boolean() }).strict(), 100);
      const key = { userId: profile.id, lessonId };
      if (saved)
        await db.bookmark.upsert({ where: { userId_lessonId: key }, create: key, update: {} });
      else await db.bookmark.deleteMany({ where: key });
      return json({ saved });
    }
    if (action === 'draft') {
      const data = await readJson(
        request,
        z.object({ source: z.string().max(65_536), stdin: z.string().max(16_384) }).strict(),
      );
      await db.draft.upsert({
        where: { userId_lessonId: key },
        create: { ...key, ...data },
        update: data,
      });
      return json({ saved: true });
    }
    if (action === 'hint') {
      const { hintId } = await readJson(request, z.object({ hintId: z.string() }).strict(), 500);
      const hint = exercise.hints.find((item) => item.id === hintId);
      if (!hint) throw new ApiError(404, 'Подсказка не найдена.');
      await db.exerciseStats.upsert({
        where: { userId_lessonId: key },
        create: { ...key, hintViewed: true },
        update: { hintViewed: true },
      });
      return json({ id: hint.id, text: hint.text, order: hint.order });
    }
    if (action === 'solution') {
      const { confirmed } = await readJson(
        request,
        z.object({ confirmed: z.literal(true) }).strict(),
        100,
      );
      const count = await db.exerciseAttempt.count({
        where: { userId: profile.id, lessonId: storageId, mode: 'check' },
      });
      if (!count)
        throw new ApiError(
          403,
          'Сначала отправьте своё решение на проверку. После этого можно открыть разбор.',
        );
      await db.exerciseStats.upsert({
        where: { userId_lessonId: key },
        create: { ...key, solutionViewed: confirmed },
        update: { solutionViewed: confirmed },
      });
      return json({
        source: exercise.referenceSolution,
        explanation: exercise.solutionExplanation,
      });
    }
    if (action === 'quiz') {
      const { answers } = await readJson(
        request,
        z
          .object({
            answers: z.array(quizAnswerSchema).length(lesson.quiz.questions.length),
          })
          .strict(),
        16_000,
      );
      const questions = lesson.quiz.questions.map((question, index) => {
        const answer = answers[index]!;
        if (!isQuizAnswerShapeValid(question, answer))
          throw new ApiError(400, 'Ответ не подходит к типу вопроса.');
        return {
          id: question.id,
          correct: isQuizAnswerCorrect(question, answer),
          explanation: question.explanation,
        };
      });
      const passed = questions.every((question) => question.correct);
      await db.$transaction(async (tx) => {
        await tx.quizAttempt.create({
          data: {
            userId: profile.id,
            lessonId,
            answers: JSON.stringify(answers),
            score: questions.filter((q) => q.correct).length,
            total: questions.length,
            passed,
          },
        });
        if (passed) await recordProgress(tx, profile.id, lessonId, { quizPassed: true }, loaded);
        else await recordStudy(tx, profile.id);
      });
      return json({
        passed,
        score: questions.filter((q) => q.correct).length,
        total: questions.length,
        questions,
      });
    }
    if (action === 'submit') {
      const input = await readJson(request, submissionSchema);
      if (input.mode === 'check' && input.standard !== lesson.standard)
        throw new ApiError(
          400,
          `Для проверки этого урока выберите ${lesson.standard.toUpperCase()}.`,
        );
      return await limitSubmission(profile.id, async () => {
        const tests = allExerciseTests(exercise);
        const submittedSource = buildSubmissionSource(exercise, input.source);
        const sandbox = await runCode({
          source: submittedSource,
          compiler: input.compiler,
          standard: input.standard,
          stdin: input.stdin,
          ...(input.mode === 'check' && exercise.diagnostics
            ? { diagnostics: exercise.diagnostics, timeoutMs: 10000 }
            : {}),
          cases:
            input.mode === 'check'
              ? tests.map((test) => ({ stdin: testInput(test) }))
              : [{ stdin: input.stdin }],
        });
        let result: SubmissionResult;
        if (sandbox.compilation.status !== 'ok') {
          result = {
            id: '',
            status:
              sandbox.compilation.status === 'runtime_error'
                ? 'compile_error'
                : sandbox.compilation.status,
            compilation: sandbox.compilation,
          };
        } else if (input.mode === 'run') {
          const run = sandbox.runs[0];
          if (!run) throw new ApiError(502, 'Среда не вернула результат программы.');
          result = {
            id: '',
            status: run.status === 'ok' ? 'executed' : run.status,
            compilation: sandbox.compilation,
            run,
          };
        } else {
          const tests = gradeResults(exercise, sandbox);
          result = {
            id: '',
            status: tests.every((test) => test.passed) ? 'accepted' : 'wrong_answer',
            compilation: sandbox.compilation,
            tests,
            passed: tests.filter((test) => test.passed).length,
            total: tests.length,
          };
        }
        const stored = await db.$transaction(async (tx) => {
          await recordStudy(tx, profile.id);
          const attempt = await tx.exerciseAttempt.create({
            data: {
              ...key,
              mode: input.mode,
              source: input.source,
              compiler: input.compiler,
              standard: input.standard,
              stdin: input.stdin,
              status: result.status,
              result: JSON.stringify(result),
            },
          });
          const now = new Date();
          await tx.exerciseStats.upsert({
            where: { userId_lessonId: key },
            create: {
              ...key,
              attempts: 1,
              firstAttemptAt: now,
              lastAttemptAt: now,
              successful: result.status === 'accepted',
            },
            update: {
              attempts: { increment: 1 },
              lastAttemptAt: now,
              ...(result.status === 'accepted' ? { successful: true } : {}),
            },
          });
          await tx.draft.upsert({
            where: { userId_lessonId: key },
            create: { ...key, source: input.source, stdin: input.stdin },
            update: { source: input.source, stdin: input.stdin },
          });
          if (result.status === 'accepted') {
            const keys = [lesson.exercise, ...lesson.additionalExercises].map((e) =>
              exerciseStorageKey(lessonId, lesson.exercise.id, e.id),
            );
            const passed = await tx.exerciseStats.count({
              where: { userId: profile.id, lessonId: { in: keys }, successful: true },
            });
            if (passed === keys.length)
              await recordProgress(tx, profile.id, lessonId, { practicePassed: true }, loaded);
          }
          await pruneAttemptHistory(tx, key);
          return attempt;
        });
        return json({ ...result, id: stored.id });
      });
    }
    throw new ApiError(404, 'Действие не найдено.');
  } catch (error) {
    return apiError(error);
  }
}
