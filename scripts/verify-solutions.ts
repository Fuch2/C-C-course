import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadCourse } from '@course/course-engine';
import {
  allExerciseTests,
  buildSubmissionSource,
  gradeResults,
  testInput,
  type Compiler,
} from '@course/shared';
import { executeSandbox, JobQueue } from '../apps/runner/src/sandbox';

const { lessons } = loadCourse();
const selected = process.argv.slice(2).filter((value) => !value.startsWith('--'));
const compilers: Compiler[] = process.argv.includes('--gcc-only') ? ['gcc'] : ['gcc', 'clang'];
const checks = lessons
  .filter((lesson) => !selected.length || selected.includes(lesson.id))
  .flatMap((lesson) =>
    [lesson.exercise, ...lesson.additionalExercises].flatMap((exercise) =>
      compilers.map((compiler) => ({ lesson, exercise, compiler })),
    ),
  );
if (!checks.length) throw new Error('Не выбраны уроки для проверки.');
// Полный offline-прогон не является HTTP-очередью пользователей: ему нужен запас
// времени на последовательную компиляцию всех задач в Docker и ёмкость, покрывающая
// весь набор проверок, иначе очередь отклонит задачи сверх фиксированного лимита.
const queue = new JobQueue(2, checks.length, 1_800_000);
const report = await Promise.all(
  checks.map(({ lesson, exercise, compiler }) =>
    queue.run(async () => {
      const fingerprint = createHash('sha256')
        .update(
          JSON.stringify({
            source: exercise.referenceSolution,
            tests: allExerciseTests(exercise),
            standard: lesson.standard,
          }),
        )
        .digest('hex');
      try {
        const result = await executeSandbox({
          source: buildSubmissionSource(exercise, exercise.referenceSolution),
          standard: lesson.standard,
          compiler,
          stdin: '',
          cases: allExerciseTests(exercise).map((test) => ({ stdin: testInput(test) })),
        });
        const grades = gradeResults(exercise, result);
        const ok = result.compilation.status === 'ok' && grades.every((test) => test.passed);
        process.stdout.write(
          `${ok ? 'OK' : 'FAIL'} ${compiler} ${lesson.id}/${exercise.id} ${grades.filter((test) => test.passed).length}/${grades.length}\n`,
        );
        if (!ok)
          process.stderr.write(
            JSON.stringify(
              {
                lesson: lesson.id,
                compiler,
                compilation: result.compilation,
                runs: result.runs,
                expected: allExerciseTests(exercise).map((test) => test.expected),
              },
              null,
              2,
            ) + '\n',
          );
        return {
          lessonId: lesson.id,
          exerciseId: exercise.id,
          compiler,
          standard: lesson.standard,
          fingerprint,
          ok,
          tests: grades.length,
        };
      } catch (error) {
        process.stderr.write(`${lesson.id} ${compiler}: ${String(error)}\n`);
        return {
          lessonId: lesson.id,
          exerciseId: exercise.id,
          compiler,
          standard: lesson.standard,
          fingerprint,
          ok: false,
          tests: 0,
        };
      }
    }),
  ),
);
mkdirSync('docs/verification', { recursive: true });
writeFileSync(
  'docs/verification/solutions.json',
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      sandboxImage: process.env.SANDBOX_IMAGE ?? 'code-systems-sandbox:local',
      checks: report,
    },
    null,
    2,
  ) + '\n',
);
if (report.some((check) => !check.ok)) process.exitCode = 1;
