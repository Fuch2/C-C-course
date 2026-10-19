/**
 * Сборка уроков из авторских исходников `lesson.src.mjs`.
 *
 * Исходник содержит metadata, вопросы и задачи с кодом в обычных шаблонных строках;
 * текст урока остаётся в `lesson.mdx`. Скрипт:
 *  1. компилирует эталон каждой задачи в Docker sandbox (GCC; Clang с ASan/UBSan),
 *     сверяет вручную записанные выводы примеров и вычисляет выводы скрытых тестов;
 *  2. запускает каждый пример `lesson.mdx` с `main` и сверяет его с блоком «Вывод:»;
 *  3. проверяет вопросы «что выведет программа» реальным запуском;
 *  4. записывает `lesson.json` и отчёт `docs/verification/lessons.json`.
 *
 * Код выполняется только через доверенный runner в ограниченном контейнере.
 *
 *   node --import tsx scripts/lessons/build.ts [фильтр…] [--force] [--no-run]
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  buildSubmissionSource,
  codingExerciseSchema,
  gradeResults,
  lessonSchema,
  normalizeTextAnswer,
  testInput,
  type CodingExercise,
  type Compiler,
  type SandboxResult,
  type Standard,
} from '@course/shared';
import { executeSandbox, JobQueue, type DiagnosticMode } from '../../apps/runner/src/sandbox';
import { displayed, extractExamples, isSanitizerReport } from './examples';

type SourceTest = {
  in?: string;
  args?: (string | number | boolean)[];
  out?: string;
  name?: string;
  why?: string;
};
type SourceExercise = {
  id?: string;
  title: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  constraints: string[];
  hints: string[];
  starter?: string;
  solution: string;
  explanation: string;
  examples: SourceTest[];
  hidden: (string | SourceTest)[];
  /** Заготовка содержит дефект («Найди ошибку»): проверка обязана её отклонить. */
  bug?: boolean;
  checking?: CodingExercise['checking'];
  diagnostics?: CodingExercise['diagnostics'];
  compiler?: Compiler;
};
type SourceQuestion = {
  q: string;
  code?: string;
  lang?: 'c' | 'cpp' | 'text';
  options?: string[];
  correct?: number | number[];
  answers?: string[];
  placeholder?: string;
  stdin?: string;
  noRun?: boolean;
  explain: string;
};
type LessonSource = {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  order: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  prerequisites: string[];
  objectives: string[];
  tags: string[];
  standard: Standard;
  completion?: 'reading' | 'practice';
  /** Доверенный режим проверки всех задач урока и примеров в тексте. */
  diagnostics?: CodingExercise['diagnostics'];
  quizTitle?: string;
  quiz: SourceQuestion[];
  exercises: SourceExercise[];
};

const root = path.resolve('content/cpp-systems');
const reportPath = path.resolve('docs/verification/lessons.json');
const args = process.argv.slice(2);
const force = args.includes('--force');
const noRun = args.includes('--no-run');
const filters = args.filter((value) => !value.startsWith('--'));

type Report = {
  updatedAt: string;
  exercises: Record<
    string,
    { fingerprint: string; expected: string[]; gcc: boolean; clang: boolean; bugDetected?: boolean }
  >;
  examples: Record<string, { lessonId: string; ok: boolean; stdout: string }>;
};
const report: Report = existsSync(reportPath)
  ? (JSON.parse(readFileSync(reportPath, 'utf8')) as Report)
  : { updatedAt: '', exercises: {}, examples: {} };

/** Слияние с файлом на диске: параллельные запуски скрипта не теряют записи друг друга. */
function saveReport() {
  if (existsSync(reportPath)) {
    const disk = JSON.parse(readFileSync(reportPath, 'utf8')) as Report;
    report.exercises = { ...disk.exercises, ...report.exercises };
    report.examples = { ...disk.examples, ...report.examples };
  }
  report.updatedAt = new Date().toISOString();
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
function findSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return findSources(file);
    return entry.name === 'lesson.src.mjs' ? [file] : [];
  });
}
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const language = (standard: Standard) => (standard.startsWith('c++') ? 'cpp' : 'c');
const defaultStarter = (standard: Standard) =>
  language(standard) === 'cpp'
    ? '#include <iostream>\n\nint main() {\n    // Напишите решение здесь.\n    return 0;\n}\n'
    : '#include <stdio.h>\n\nint main(void) {\n    // Напишите решение здесь.\n    return 0;\n}\n';
const trimCode = (code: string) => code.replace(/^\n+/, '').replace(/\s+$/, '') + '\n';

// LESSON_JOBS уменьшает число одновременных запусков на медленном Docker: лимиты sandbox не меняются.
const jobs = Math.max(1, Number(process.env.LESSON_JOBS) || 4);
// Весь модуль ставится в очередь сразу: на медленном Docker задания ждут часами.
const queue = new JobQueue(jobs, 100_000, 86_400_000);
const flaky = (result: SandboxResult) =>
  result.compilation.status === 'timeout' || result.runs.some((run) => run.status === 'timeout');
// Перегруженный Docker изредка не укладывается в лимит или не отвечает. Одна повторная попытка
// отличает такой сбой от медленного решения: настоящее превышение лимита повторится. Лимиты не меняются.
async function sandbox(
  source: string,
  standard: Standard,
  compiler: Compiler,
  stdins: string[],
  sanitizers: boolean | DiagnosticMode = false,
): Promise<SandboxResult> {
  const mode = sanitizers === true ? 'sanitizers' : sanitizers || 'none';
  const attempt = () =>
    queue.run(() =>
      executeSandbox(
        {
          source,
          standard,
          compiler,
          stdin: '',
          cases: stdins.map((stdin) => ({ stdin })),
          ...(mode === 'none' ? {} : { timeoutMs: 10_000 }),
        },
        mode,
      ),
    );
  try {
    const result = await attempt();
    return flaky(result) ? await attempt() : result;
  } catch (error) {
    if (/лимит проверки|передать исходник/.test(String(error))) return attempt();
    throw error;
  }
}
const problems: string[] = [];
function fail(where: string, message: string) {
  problems.push(`${where}: ${message}`);
  process.stderr.write(`ОШИБКА ${where}: ${message}\n`);
}
const warningsOf = (result: SandboxResult) =>
  (result.compilation.stdout + result.compilation.stderr).trim();

function toExercise(lesson: LessonSource, source: SourceExercise, index: number): CodingExercise {
  const name = (test: SourceTest, i: number, hidden: boolean) =>
    test.name ?? (hidden ? `Скрытый тест ${i + 1}` : `Пример ${i + 1}`);
  const toTest = (test: SourceTest, i: number, hidden: boolean) => ({
    id: `${hidden ? 'hidden' : 'case'}-${i + 1}`,
    name: name(test, i, hidden),
    ...(test.args ? { arguments: test.args } : { stdin: test.in ?? '' }),
    expected: test.out ?? '',
  });
  const hidden = source.hidden.map((test) => (typeof test === 'string' ? { in: test } : test));
  return {
    id: source.id ?? `${lesson.id}-task-${index + 1}`,
    title: source.title,
    description: source.description.trim(),
    difficulty: source.difficulty ?? lesson.difficulty,
    starterCode: source.starter ? trimCode(source.starter) : defaultStarter(lesson.standard),
    language: language(lesson.standard),
    standard: lesson.standard,
    compiler: source.compiler ?? 'gcc',
    ...((source.diagnostics ?? lesson.diagnostics)
      ? { diagnostics: source.diagnostics ?? lesson.diagnostics }
      : {}),
    examples: source.examples.map((test) => ({
      input: test.in ?? (test.args ?? []).join(' '),
      output: test.out ?? '',
      ...(test.why ? { explanation: test.why } : {}),
    })),
    constraints: source.constraints,
    hints: source.hints.map((text, i) => ({ id: `hint-${i + 1}`, text, order: i + 1 })),
    publicTests: source.examples.map((test, i) => toTest(test, i, false)),
    hiddenTests: hidden.map((test, i) => toTest(test, i, true)),
    referenceSolution: trimCode(source.solution),
    solutionExplanation: source.explanation.trim(),
    checking: source.checking ?? { type: 'stdout', comparison: 'exact' },
  };
}

async function verifyExercise(
  lesson: LessonSource,
  exercise: CodingExercise,
  where: string,
  bug: boolean,
) {
  const tests = [...exercise.publicTests, ...exercise.hiddenTests];
  const fingerprint = sha({
    source: exercise.referenceSolution,
    standard: exercise.standard,
    checking: exercise.checking,
    inputs: tests.map(testInput),
    publicExpected: exercise.publicTests.map((test) => test.expected),
    ...(bug ? { starter: exercise.starterCode, diagnostics: exercise.diagnostics } : {}),
  });
  const cached = report.exercises[exercise.id];
  if (
    !force &&
    cached?.fingerprint === fingerprint &&
    cached.gcc &&
    cached.clang &&
    (!bug || cached.bugDetected)
  ) {
    exercise.hiddenTests.forEach((test, i) => {
      test.expected = cached.expected[exercise.publicTests.length + i] ?? '';
    });
    return;
  }
  if (noRun) {
    fail(where, 'задача изменилась, а запуск отключён (--no-run)');
    return;
  }
  const source = buildSubmissionSource(exercise, exercise.referenceSolution);
  const stdins = tests.map(testInput);
  const [gcc, clang] = await Promise.all([
    sandbox(source, lesson.standard, 'gcc', stdins),
    sandbox(source, lesson.standard, 'clang', stdins, true),
  ]);
  let ok = true;
  for (const [compiler, result] of [
    ['gcc', gcc],
    ['clang', clang],
  ] as const) {
    if (result.compilation.status !== 'ok') {
      fail(
        where,
        `${compiler}: эталон не компилируется (${result.compilation.status})\n${warningsOf(result)}`,
      );
      ok = false;
      continue;
    }
    if (warningsOf(result)) {
      fail(where, `${compiler}: предупреждения компилятора в эталоне\n${warningsOf(result)}`);
      ok = false;
    }
    result.runs.forEach((run, i) => {
      if (run.status !== 'ok' || run.exitCode !== 0) {
        fail(
          where,
          `${compiler}: тест ${i + 1} завершился с ${run.status}/${run.exitCode}\n${run.stderr}`,
        );
        ok = false;
      }
    });
  }
  if (!ok) return;
  const expected = gcc.runs.map((run) => run.stdout);
  clang.runs.forEach((run, i) => {
    if (run.stdout !== expected[i]) {
      fail(where, `GCC и Clang дали разный вывод в тесте ${i + 1}`);
      ok = false;
    }
  });
  exercise.publicTests.forEach((test, i) => {
    if (test.expected !== expected[i]) {
      fail(
        where,
        `пример ${i + 1}: записано ${JSON.stringify(test.expected)}, эталон выводит ${JSON.stringify(expected[i])}`,
      );
      ok = false;
    }
  });
  const seen = new Map<string, number>();
  stdins.forEach((stdin, i) => {
    if (seen.has(stdin)) fail(where, `тесты ${seen.get(stdin)! + 1} и ${i + 1} совпадают`);
    seen.set(stdin, i);
  });
  if (!ok) return;
  exercise.hiddenTests.forEach((test, i) => {
    test.expected = expected[exercise.publicTests.length + i]!;
  });
  let bugDetected: boolean | undefined;
  if (bug) {
    // Отрицательный контроль: дефектная заготовка должна провалить проверку с диагностикой.
    const starter = await sandbox(
      buildSubmissionSource(exercise, exercise.starterCode),
      lesson.standard,
      exercise.diagnostics === 'valgrind' ? 'gcc' : 'clang',
      stdins,
      exercise.diagnostics ?? 'sanitizers',
    );
    bugDetected =
      starter.compilation.status !== 'ok' ||
      !gradeResults(exercise, starter).every((test) => test.passed);
    if (!bugDetected) return fail(where, 'дефектная заготовка проходит все тесты');
  }
  report.exercises[exercise.id] = {
    fingerprint,
    expected,
    gcc: true,
    clang: true,
    ...(bug ? { bugDetected } : {}),
  };
}

async function verifyExamples(lesson: LessonSource, mdxPath: string) {
  const examples = extractExamples(readFileSync(mdxPath, 'utf8'));
  await Promise.all(
    examples.map(async (example, index) => {
      const where = `${lesson.id} пример ${index + 1}`;
      const standard: Standard = example.lang === 'cpp' ? 'c++23' : 'c23';
      // В уроках с диагностикой памяти пример дополнительно собирается Clang с ASan/UBSan.
      const diagnose = Boolean(lesson.diagnostics) && example.marker !== 'compile';
      const key = sha({
        source: example.source,
        stdin: example.stdin,
        standard,
        stdout: example.stdout,
        marker: example.marker,
        ...(diagnose ? { diagnose } : {}),
      });
      if (!force && report.examples[key]?.ok) return;
      if (noRun) return fail(where, 'пример изменился, а запуск отключён (--no-run)');
      const [result, checked] = await Promise.all([
        sandbox(example.source, standard, 'gcc', [example.stdin]),
        diagnose
          ? sandbox(example.source, standard, 'clang', [example.stdin], true)
          : Promise.resolve(undefined),
      ]);
      const run = result.runs[0];
      let ok = true;
      if (example.marker === 'compile') {
        ok = result.compilation.status !== 'ok';
        if (!ok) fail(where, 'ожидалась ошибка компиляции, но код собрался');
      } else if (result.compilation.status !== 'ok') {
        ok = false;
        fail(where, `не компилируется\n${warningsOf(result)}`);
      } else if (example.marker === 'memory') {
        // Поведение дефектной программы без санитайзеров не определено: проверяется только отчёт.
        const report = checked?.runs[0];
        if (!report || !isSanitizerReport(report.stderr)) {
          ok = false;
          fail(where, `ASan/UBSan не нашли ожидаемую ошибку памяти\n${report?.stderr ?? ''}`);
        }
      } else {
        if (warningsOf(result) && !/\/\/ Предупреждение/.test(example.source)) {
          ok = false;
          fail(where, `предупреждения компилятора\n${warningsOf(result)}`);
        }
        if (example.marker === 'none' && (run?.status !== 'ok' || run.exitCode !== 0)) {
          ok = false;
          fail(where, `завершился с ${run?.status}/${run?.exitCode}\n${run?.stderr ?? ''}`);
        }
        if (
          example.stdout !== undefined &&
          displayed(run?.stdout ?? '') !== displayed(example.stdout)
        ) {
          ok = false;
          fail(
            where,
            `в тексте ${JSON.stringify(example.stdout)}, программа выводит ${JSON.stringify(run?.stdout)}`,
          );
        }
        const diagnosed = checked?.runs[0];
        if (
          checked &&
          example.marker === 'none' &&
          (checked.compilation.status !== 'ok' ||
            diagnosed?.status !== 'ok' ||
            diagnosed.exitCode !== 0 ||
            // Без блока «Вывод:» stdout может законно меняться (например, адреса).
            (example.stdout !== undefined && diagnosed.stdout !== run?.stdout))
        ) {
          ok = false;
          fail(where, `ошибка под ASan/UBSan\n${warningsOf(checked)}${diagnosed?.stderr ?? ''}`);
        }
      }
      report.examples[key] = { lessonId: lesson.id, ok, stdout: run?.stdout ?? '' };
    }),
  );
}

async function buildQuiz(lesson: LessonSource) {
  return Promise.all(
    lesson.quiz.map(async (item, index) => {
      const where = `${lesson.id} вопрос ${index + 1}`;
      const base = {
        id: `q${index + 1}`,
        question: item.q.trim(),
        ...(item.code ? { code: trimCode(item.code).replace(/\n$/, '') } : {}),
        ...(item.lang ? { codeLanguage: item.lang } : {}),
        explanation: item.explain.trim(),
      };
      if (item.answers) {
        const runnable = item.code && /\bmain\s*\(/.test(item.code) && !item.noRun;
        if (runnable) {
          const standard: Standard = item.lang === 'cpp' ? 'c++23' : 'c23';
          const key = sha({
            quiz: item.code,
            stdin: item.stdin ?? '',
            standard,
            answer: item.answers[0],
          });
          if (force || !report.examples[key]?.ok) {
            if (noRun) fail(where, 'вопрос изменился, а запуск отключён');
            else {
              const result = await sandbox(trimCode(item.code!), standard, 'gcc', [
                item.stdin ?? '',
              ]);
              const stdout = result.runs[0]?.stdout ?? '';
              const ok =
                result.compilation.status === 'ok' &&
                normalizeTextAnswer(stdout) === normalizeTextAnswer(item.answers[0]!);
              if (!ok)
                fail(
                  where,
                  `ответ ${JSON.stringify(item.answers[0])}, программа выводит ${JSON.stringify(stdout)}\n${warningsOf(result)}`,
                );
              report.examples[key] = { lessonId: lesson.id, ok, stdout };
            }
          }
        }
        return {
          ...base,
          type: 'text' as const,
          answers: item.answers,
          ...(item.placeholder ? { placeholder: item.placeholder } : {}),
        };
      }
      if (Array.isArray(item.correct))
        return {
          ...base,
          type: 'multiple' as const,
          options: item.options!,
          correct: item.correct,
        };
      return { ...base, options: item.options!, correct: item.correct! };
    }),
  );
}

async function buildLesson(sourcePath: string) {
  const directory = path.dirname(sourcePath);
  const lesson = (await import(pathToFileURL(sourcePath).href)).default as LessonSource;
  const mdxPath = path.join(directory, 'lesson.mdx');
  if (!existsSync(mdxPath)) return fail(lesson.id, 'нет lesson.mdx');
  const exercises = lesson.exercises.map((exercise, index) => toExercise(lesson, exercise, index));
  exercises.forEach((exercise) => {
    const parsed = codingExerciseSchema.safeParse(exercise);
    if (!parsed.success) fail(`${lesson.id}/${exercise.id}`, parsed.error.message);
  });
  const [quiz] = await Promise.all([
    buildQuiz(lesson),
    verifyExamples(lesson, mdxPath),
    ...exercises.map((exercise, index) =>
      verifyExercise(
        lesson,
        exercise,
        `${lesson.id}/${exercise.id}`,
        Boolean(lesson.exercises[index]!.bug),
      ),
    ),
  ]);
  const metadata = {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    moduleId: lesson.moduleId,
    order: lesson.order,
    difficulty: lesson.difficulty,
    estimatedMinutes: lesson.estimatedMinutes,
    prerequisites: lesson.prerequisites,
    objectives: lesson.objectives,
    tags: lesson.tags,
    published: true,
    standard: lesson.standard,
    completion: lesson.completion ?? 'practice',
    exercise: exercises[0],
    additionalExercises: exercises.slice(1),
    quiz: {
      id: `${lesson.id}-quiz`,
      title: lesson.quizTitle ?? 'Проверка понимания',
      questions: quiz,
    },
  };
  const parsed = lessonSchema.safeParse(metadata);
  if (!parsed.success) return fail(lesson.id, parsed.error.message);
  if (problems.some((problem) => problem.startsWith(lesson.id)))
    return fail(lesson.id, 'lesson.json не записан из-за ошибок выше');
  const target = path.join(directory, 'lesson.json');
  writeFileSync(target, JSON.stringify(metadata, null, 2) + '\n');
  written.push(target);
  process.stdout.write(`OK ${lesson.id}: ${quiz.length} вопросов, ${exercises.length} задач\n`);
}

const written: string[] = [];
const sources = findSources(root)
  .filter((file) => !filters.length || filters.some((filter) => file.includes(filter)))
  .sort();
if (!sources.length) throw new Error('Не найдено исходников lesson.src.mjs по фильтру.');
await Promise.all(
  sources.map(async (file) => {
    try {
      await buildLesson(file);
    } catch (error) {
      fail(
        path.relative(root, file),
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      );
    }
    // Отчёт сохраняется после каждого урока, чтобы прерванный прогон не терял проверенное.
    saveReport();
  }),
);
spawnSync(
  process.execPath,
  ['scripts/tool.mjs', 'prettier', '--log-level', 'warn', '--write', reportPath, ...written],
  {
    stdio: 'inherit',
  },
);
if (problems.length) {
  process.stderr.write(`\nНайдено проблем: ${problems.length}\n`);
  process.exitCode = 1;
} else process.stdout.write(`\nСобрано уроков: ${written.length}\n`);
