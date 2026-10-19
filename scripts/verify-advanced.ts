/**
 * Полная проверка модуля «Углублённый C» в Docker sandbox.
 *
 * 1. Каждое эталонное решение проходит все тесты на GCC и Clang с ASan/UBSan.
 * 2. Отрицательный контроль: дефектная заготовка каждого задания «Найди ошибку» отклоняется
 *    проверкой в доверенном режиме ASan/UBSan.
 * 3. Примеры из текста уроков: обычные выполняются на Clang с ASan/UBSan и печатают записанный
 *    вывод; «// Ошибка компиляции» не собирается GCC; «// Ошибка выполнения» завершается ошибкой
 *    под санитайзерами; «// Ошибка памяти» обязан дать отчёт ASan/UBSan. Блоки с именем файла — части многофайловых программ, они не запускаются.
 *
 * Режим диагностики задаёт этот доверенный скрипт, а не публичный запрос. Отчёт:
 * docs/verification/advanced.json (только при полном прогоне; аргументы — подстроки ID уроков
 * для частичной проверки). Параллелизм — ADVANCED_JOBS (по умолчанию 2).
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
  type Compiler,
  type SandboxResult,
} from '@course/shared';
import { executeSandbox, JobQueue, type DiagnosticMode } from '../apps/runner/src/sandbox';
import { displayed, extractExamples, isSanitizerReport } from './lessons/examples';

const moduleDir = 'content/cpp-systems/advanced-c';
const allLessons = loadCourse().lessons.filter((lesson) => lesson.moduleId === 'advanced-c');
if (allLessons.length !== 28) throw new Error('Модуль «Углублённый C» должен содержать 28 уроков.');
// Необязательные аргументы — подстроки ID уроков: проверяется только часть модуля, отчёт не пишется.
const filters = process.argv.slice(2);
const lessons = filters.length
  ? allLessons.filter((lesson) => filters.some((filter) => lesson.id.includes(filter)))
  : allLessons;
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
  kind:
    | 'solution'
    | 'negative-control'
    | 'example'
    | 'memory-example'
    | 'compile-error'
    | 'runtime-error';
  compiler: Compiler;
  mode: DiagnosticMode;
  source: string;
  cases: { stdin: string }[];
  check: (result: SandboxResult) => boolean;
};
const tasks: Task[] = [];
const graded = (exercise: CodingExercise) => (result: SandboxResult) =>
  result.compilation.status === 'ok' && gradeResults(exercise, result).every((test) => test.passed);

for (const lesson of lessons) {
  for (const exercise of [lesson.exercise, ...lesson.additionalExercises]) {
    const cases = allExerciseTests(exercise).map((test) => ({ stdin: testInput(test) }));
    for (const compiler of ['gcc', 'clang'] as const)
      tasks.push({
        id: exercise.id,
        kind: 'solution',
        compiler,
        mode: 'sanitizers',
        source: buildSubmissionSource(exercise, exercise.referenceSolution),
        cases,
        check: graded(exercise),
      });
    if (exercise.title.startsWith('Найди ошибку'))
      tasks.push({
        id: exercise.id,
        kind: 'negative-control',
        compiler: 'clang',
        mode: exercise.diagnostics ?? 'sanitizers',
        source: buildSubmissionSource(exercise, exercise.starterCode),
        cases,
        check: (result) => !graded(exercise)(result),
      });
  }
  const mdx = mdxById.get(lesson.id);
  if (!mdx) throw new Error(`Нет lesson.mdx для ${lesson.id}`);
  extractExamples(readFileSync(mdx, 'utf8')).forEach((example, index) => {
    const id = `${lesson.id}#${index + 1}`;
    const cases = [{ stdin: example.stdin }];
    if (example.marker === 'compile')
      tasks.push({
        id,
        kind: 'compile-error',
        compiler: 'gcc',
        mode: 'none',
        source: example.source,
        cases,
        check: (result) => result.compilation.status !== 'ok',
      });
    else if (example.marker === 'memory')
      tasks.push({
        id,
        kind: 'memory-example',
        compiler: 'clang',
        mode: 'sanitizers',
        source: example.source,
        cases,
        check: (result) => isSanitizerReport(result.runs[0]?.stderr ?? ''),
      });
    else if (example.marker === 'runtime')
      tasks.push({
        id,
        kind: 'runtime-error',
        compiler: 'clang',
        mode: 'sanitizers',
        source: example.source,
        cases,
        check: (result) =>
          result.compilation.status === 'ok' &&
          (result.runs[0]?.status !== 'ok' || result.runs[0]?.exitCode !== 0),
      });
    else
      tasks.push({
        id,
        kind: 'example',
        compiler: 'clang',
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

// Каждый тест — новый контейнер; умеренный параллелизм оставляет cleanup предсказуемым.
const queue = new JobQueue(Number(process.env.ADVANCED_JOBS ?? 2), 4000, 86_400_000);
const checks = await Promise.all(
  tasks.map((task) =>
    queue.run(async () => {
      const fingerprint = createHash('sha256')
        .update(
          JSON.stringify({
            source: task.source,
            cases: task.cases,
            mode: task.mode,
            compiler: task.compiler,
          }),
        )
        .digest('hex');
      let ok = false;
      try {
        const result = await executeSandbox(
          {
            source: task.source,
            compiler: task.compiler,
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
      console.log(`${ok ? 'OK' : 'FAIL'} ${task.kind} ${task.compiler} ${task.id}`);
      return {
        id: task.id,
        kind: task.kind,
        compiler: task.compiler,
        mode: task.mode,
        fingerprint,
        ok,
        tests: task.cases.length,
      };
    }),
  ),
);
const count = (kind: Task['kind']) => checks.filter((check) => check.kind === kind).length;
const summary = {
  solutions: count('solution'),
  negativeControls: count('negative-control'),
  examples: count('example'),
  memoryExamples: count('memory-example'),
  compileErrors: count('compile-error'),
  runtimeErrors: count('runtime-error'),
  runs: checks.reduce((sum, check) => sum + check.tests, 0),
  failed: checks.filter((check) => !check.ok).length,
};
if (!filters.length) {
  mkdirSync('docs/verification', { recursive: true });
  writeFileSync(
    'docs/verification/advanced.json',
    JSON.stringify(
      { verifiedAt: new Date().toISOString(), diagnostics: 'ASan/UBSan', summary, checks },
      null,
      2,
    ) + '\n',
  );
}
console.log(JSON.stringify(summary));
if (summary.failed) process.exitCode = 1;
