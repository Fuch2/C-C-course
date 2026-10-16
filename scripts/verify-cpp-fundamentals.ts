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
const lessons = loadCourse().lessons.filter((l) => l.moduleId === 'cpp-fundamentals');
const examples = JSON.parse(
  readFileSync('content/cpp-systems/cpp-fundamentals/examples.json', 'utf8'),
) as { id: string; source: string; stdout: string; standard: 'c++20' }[];
if (lessons.length !== 21 || examples.length !== 21)
  throw new Error('Ожидаются 21 урок и 21 пример.');
const tasks: {
  id: string;
  source: string;
  compiler: Compiler;
  exercise?: CodingExercise;
  cases: { stdin: string }[];
}[] = [];
for (const lesson of lessons)
  for (const exercise of [lesson.exercise, ...lesson.additionalExercises])
    for (const compiler of ['gcc', 'clang'] as const)
      tasks.push({
        id: exercise.id,
        source: buildSubmissionSource(exercise, exercise.referenceSolution),
        compiler,
        exercise,
        cases: allExerciseTests(exercise).map((t) => ({ stdin: testInput(t) })),
      });
for (const example of examples)
  tasks.push({ id: example.id, source: example.source, compiler: 'clang', cases: [{ stdin: '' }] });
const checks = [];
for (const task of tasks) {
  let ok = false;
  try {
    const result = await executeSandbox(
      {
        source: task.source,
        standard: 'c++20',
        compiler: task.compiler,
        stdin: '',
        cases: task.cases,
        timeoutMs: 10000,
      },
      'sanitizers',
    );
    ok =
      result.compilation.status === 'ok' &&
      (task.exercise
        ? gradeResults(task.exercise, result).every((t) => t.passed)
        : result.runs[0]?.status === 'ok' &&
          result.runs[0]?.stdout === examples.find((e) => e.id === task.id)?.stdout);
  } catch (error) {
    console.error(String(error));
  }
  console.log(`${ok ? 'OK' : 'FAIL'} ${task.compiler} ${task.id}`);
  checks.push({
    id: task.id,
    compiler: task.compiler,
    fingerprint: createHash('sha256').update(JSON.stringify(task)).digest('hex'),
    ok,
    tests: task.cases.length,
  });
  mkdirSync('docs/verification', { recursive: true });
  writeFileSync(
    'docs/verification/cpp-fundamentals.json',
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
if (checks.some((c) => !c.ok)) process.exitCode = 1;
