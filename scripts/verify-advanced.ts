import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { loadCourse } from '@course/course-engine';
import {
  allExerciseTests,
  buildSubmissionSource,
  gradeResults,
  testInput,
  type CodingExercise,
  type Compiler,
} from '@course/shared';
import { executeSandbox } from '../apps/runner/src/sandbox';

const lessons = loadCourse().lessons.filter((lesson) => lesson.moduleId === 'advanced-c');
const examples = JSON.parse(
  readFileSync('content/cpp-systems/advanced-c/examples.json', 'utf8'),
) as { id: string; source: string; stdout: string }[];
if (lessons.length !== 28 || examples.length !== 28)
  throw new Error('Ожидаются 28 уроков и 28 примеров.');
const tasks: {
  id: string;
  source: string;
  compiler: Compiler;
  exercise?: CodingExercise;
  cases: { stdin: string }[];
  expected?: string;
}[] = [];
for (const lesson of lessons)
  for (const exercise of [lesson.exercise, ...lesson.additionalExercises]) {
    for (const compiler of ['gcc', 'clang'] as const)
      tasks.push({
        id: exercise.id,
        source: buildSubmissionSource(exercise, exercise.referenceSolution),
        compiler,
        exercise,
        cases: allExerciseTests(exercise).map((test) => ({ stdin: testInput(test) })),
      });
  }
for (const example of examples)
  tasks.push({
    id: example.id,
    source: example.source,
    compiler: 'clang',
    cases: [{ stdin: '' }],
    expected: example.stdout,
  });
const checks = [];
// Последовательно: каждый тест получает отдельный ограниченный контейнер.
for (const task of tasks) {
  const fingerprint = createHash('sha256').update(JSON.stringify(task)).digest('hex');
  try {
    const result = await executeSandbox(
      {
        source: task.source,
        standard: 'c17',
        compiler: task.compiler,
        stdin: '',
        cases: task.cases,
        timeoutMs: 10000,
      },
      'sanitizers',
    );
    const ok =
      result.compilation.status === 'ok' &&
      (task.exercise
        ? gradeResults(task.exercise, result).every((test) => test.passed)
        : result.runs.length === 1 &&
          result.runs[0]?.status === 'ok' &&
          result.runs[0]?.stdout === task.expected);
    console.log(`${ok ? 'OK' : 'FAIL'} ${task.compiler} ${task.id}`);
    if (!ok) console.error(JSON.stringify(result));
    checks.push({
      id: task.id,
      compiler: task.compiler,
      fingerprint,
      ok,
      tests: task.cases.length,
    });
  } catch (error) {
    console.error(`${task.id}: ${String(error)}`);
    checks.push({
      id: task.id,
      compiler: task.compiler,
      fingerprint,
      ok: false,
      tests: task.cases.length,
    });
  }
  mkdirSync('docs/verification', { recursive: true });
  writeFileSync(
    'docs/verification/advanced.json',
    JSON.stringify(
      {
        verifiedAt: new Date().toISOString(),
        complete: checks.length === tasks.length,
        diagnostics: 'ASan/UBSan',
        checks,
      },
      null,
      2,
    ) + '\n',
  );
}
if (checks.some((check) => !check.ok)) process.exitCode = 1;
