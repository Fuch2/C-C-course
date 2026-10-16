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
import { executeSandbox, runnerReady, recoverSandboxes } from '../apps/runner/src/sandbox';
const lessons = loadCourse().lessons.filter((l) => l.moduleId === 'cpp-lifetime');
const examples = JSON.parse(
  readFileSync('content/cpp-systems/cpp-lifetime/examples.json', 'utf8'),
) as {
  id: string;
  source: string;
  stdout: string;
  standard: 'c++20';
}[];
if (lessons.length !== 24 || examples.length !== 24)
  throw new Error('Ожидаются 24 урока и 24 примера.');
const tasks: {
  id: string;
  source: string;
  compiler: Compiler;
  exercise?: CodingExercise;
  diagnosticPattern?: string;
  expectedStdout?: string;
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
  tasks.push({
    id: example.id,
    source: example.source,
    compiler: 'clang',
    expectedStdout: example.stdout,
    cases: [{ stdin: '' }],
  });
const defects: Record<string, string> = {
  'scope-lifetime': 'stack-use-after-return|stack-use-after-scope',
  ownership: 'double-free',
  'shallow-copy': 'double-free',
  'move-constructor': 'double-free',
  'unique-ptr': 'heap-use-after-free',
  'cyclic-references': 'LeakSanitizer|detected memory leaks',
};
for (const [slug, diagnosticPattern] of Object.entries(defects)) {
  const lesson = lessons.find((l) => l.id === `lifetime-${slug}`)!;
  const repair = lesson.additionalExercises[0]!;
  tasks.push({
    id: `${lesson.id}-negative`,
    source: buildSubmissionSource(repair, repair.starterCode),
    compiler: 'clang',
    diagnosticPattern,
    cases: [{ stdin: testInput(repair.publicTests[0]!) }],
  });
}
type Check = {
  id: string;
  compiler: Compiler;
  fingerprint: string;
  ok: boolean;
  tests: number;
  failure?: unknown;
  previousAttempts?: unknown[];
};
const reportPath = 'docs/verification/lifetime.json';
const previous = process.argv.includes('--retry-failed')
  ? (JSON.parse(readFileSync(reportPath, 'utf8')) as { checks: Check[] }).checks
  : [];
const checks: Check[] = [];
await recoverSandboxes();
async function verify(task: (typeof tasks)[number]) {
  const fingerprint = createHash('sha256').update(JSON.stringify(task)).digest('hex');
  const prior = previous.find(
    (c) => c.id === task.id && c.compiler === task.compiler && c.fingerprint === fingerprint,
  );
  if (prior?.ok) {
    checks.push(prior);
    return;
  }
  let ok = false;
  let failure: unknown;
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
      (task.diagnosticPattern
        ? result.runs.some(
            (run) => run.status !== 'ok' && new RegExp(task.diagnosticPattern!).test(run.stderr),
          )
        : task.exercise
          ? gradeResults(task.exercise, result).every((t) => t.passed)
          : result.runs[0]?.status === 'ok' && result.runs[0]?.stdout === task.expectedStdout);
    if (!ok) {
      failure = result;
      console.error(JSON.stringify(result));
    }
  } catch (error) {
    failure = String(error);
    console.error(String(error));
  }
  if (!runnerReady()) throw new Error('Runner сообщает об ошибке cleanup');
  console.log(`${ok ? 'OK' : 'FAIL'} ${task.compiler} ${task.id}`);
  checks.push({
    id: task.id,
    compiler: task.compiler,
    fingerprint,
    ...(prior
      ? {
          previousAttempts: [
            ...(prior.previousAttempts ?? []),
            { ok: prior.ok, failure: prior.failure },
          ],
        }
      : {}),
    ok,
    ...(failure ? { failure } : {}),
    tests: task.cases.length,
  });
  mkdirSync('docs/verification', { recursive: true });
  writeFileSync(
    'docs/verification/lifetime.json',
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
for (let offset = 0; offset < tasks.length; offset += 2) {
  const results = await Promise.allSettled(tasks.slice(offset, offset + 2).map(verify));
  const rejected = results.find((result) => result.status === 'rejected');
  if (rejected?.status === 'rejected') throw rejected.reason;
}
if (checks.some((c) => !c.ok)) process.exitCode = 1;

writeFileSync(
  reportPath,
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
