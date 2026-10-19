/**
 * Полная проверка модуля «Память и указатели в C» в Docker sandbox.
 *
 * 1. Каждое эталонное решение проходит все тесты под ASan/UBSan (Clang) и под Valgrind (GCC).
 * 2. Отрицательный контроль: дефектная заготовка каждого задания «Найди ошибку» отклоняется
 *    в доверенном режиме диагностики этого задания.
 * 3. Примеры из текста уроков: обычные выполняются без отчётов санитайзеров и печатают
 *    записанный вывод, примеры с меткой «// Ошибка памяти» обязаны дать отчёт ASan/UBSan.
 *
 * Режим диагностики задаёт этот доверенный скрипт, а не публичный запрос. Отчёт:
 * docs/verification/memory.json. Параллелизм — MEMORY_JOBS (по умолчанию 2).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadCourse } from '@course/course-engine';
import {
  allExerciseTests,
  buildSubmissionSource,
  gradeResults,
  testInput,
  type CodingExercise,
} from '@course/shared';
import { executeSandbox, JobQueue, type DiagnosticMode } from '../apps/runner/src/sandbox';
import { displayed, extractExamples, isSanitizerReport } from './lessons/examples';

const moduleDir = 'content/cpp-systems/memory-pointers';
const lessons = loadCourse().lessons.filter((lesson) => lesson.moduleId === 'memory-pointers');
if (lessons.length !== 28) throw new Error('Модуль памяти должен содержать 28 уроков.');
const mdxById = new Map(
  readdirSync(moduleDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(moduleDir, entry.name);
      const { id } = JSON.parse(readFileSync(path.join(dir, 'lesson.json'), 'utf8')) as {
        id: string;
      };
      return [id, path.join(dir, 'lesson.mdx')] as const;
    }),
);

type Task = {
  id: string;
  kind: 'solution' | 'negative-control' | 'example' | 'memory-example';
  mode: DiagnosticMode;
  source: string;
  cases: { stdin: string }[];
  check: (result: Awaited<ReturnType<typeof executeSandbox>>) => boolean;
};
const tasks: Task[] = [];
const graded = (exercise: CodingExercise) => (result: Awaited<ReturnType<typeof executeSandbox>>) =>
  result.compilation.status === 'ok' && gradeResults(exercise, result).every((test) => test.passed);

for (const lesson of lessons) {
  for (const exercise of [lesson.exercise, ...lesson.additionalExercises]) {
    const cases = allExerciseTests(exercise).map((test) => ({ stdin: testInput(test) }));
    for (const mode of ['sanitizers', 'valgrind'] as const)
      tasks.push({
        id: exercise.id,
        kind: 'solution',
        mode,
        source: buildSubmissionSource(exercise, exercise.referenceSolution),
        cases,
        check: graded(exercise),
      });
    if (exercise.title.startsWith('Найди ошибку'))
      tasks.push({
        id: exercise.id,
        kind: 'negative-control',
        mode: exercise.diagnostics ?? 'sanitizers',
        source: buildSubmissionSource(exercise, exercise.starterCode),
        cases,
        check: (result) => !graded(exercise)(result),
      });
  }
  const mdx = mdxById.get(lesson.id);
  if (!mdx) throw new Error(`Нет lesson.mdx для ${lesson.id}`);
  extractExamples(readFileSync(mdx, 'utf8')).forEach((example, index) => {
    if (example.marker === 'compile' || example.marker === 'runtime') return;
    const id = `${lesson.id}#${index + 1}`;
    const cases = [{ stdin: example.stdin }];
    if (example.marker === 'memory')
      tasks.push({
        id,
        kind: 'memory-example',
        mode: 'sanitizers',
        source: example.source,
        cases,
        check: (result) => isSanitizerReport(result.runs[0]?.stderr ?? ''),
      });
    else
      tasks.push({
        id,
        kind: 'example',
        mode: 'sanitizers',
        source: example.source,
        cases,
        check: (result) => {
          const run = result.runs[0];
          return (
            result.compilation.status === 'ok' &&
            run?.status === 'ok' &&
            run.exitCode === 0 &&
            (example.stdout === undefined || displayed(run.stdout) === displayed(example.stdout))
          );
        },
      });
  });
}

// Диагностика тяжёлая: каждый тест — новый контейнер; умеренный параллелизм оставляет cleanup предсказуемым.
const queue = new JobQueue(Number(process.env.MEMORY_JOBS ?? 2), 2000, 7_200_000);
const checks = await Promise.all(
  tasks.map((task) =>
    queue.run(async () => {
      const fingerprint = createHash('sha256')
        .update(JSON.stringify({ source: task.source, cases: task.cases, mode: task.mode }))
        .digest('hex');
      let ok = false;
      try {
        const result = await executeSandbox(
          {
            source: task.source,
            compiler: task.mode === 'valgrind' ? 'gcc' : 'clang',
            standard: 'c23',
            stdin: '',
            cases: task.cases,
            timeoutMs: 10_000,
          },
          task.mode,
        );
        ok = task.check(result);
        if (!ok) console.error(JSON.stringify({ id: task.id, kind: task.kind, result }));
      } catch (error) {
        console.error(`${task.id}: ${String(error)}`);
      }
      console.log(`${ok ? 'OK' : 'FAIL'} ${task.kind} ${task.mode} ${task.id}`);
      return {
        id: task.id,
        kind: task.kind,
        mode: task.mode,
        fingerprint,
        ok,
        tests: task.cases.length,
      };
    }),
  ),
);
mkdirSync('docs/verification', { recursive: true });
const summary = {
  solutions: checks.filter((check) => check.kind === 'solution').length,
  negativeControls: checks.filter((check) => check.kind === 'negative-control').length,
  examples: checks.filter((check) => check.kind === 'example').length,
  memoryExamples: checks.filter((check) => check.kind === 'memory-example').length,
  runs: checks.reduce((sum, check) => sum + check.tests, 0),
  failed: checks.filter((check) => !check.ok).length,
};
writeFileSync(
  'docs/verification/memory.json',
  JSON.stringify({ verifiedAt: new Date().toISOString(), summary, checks }, null, 2) + '\n',
);
console.log(JSON.stringify(summary));
if (summary.failed) process.exitCode = 1;
