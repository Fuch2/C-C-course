import { z } from 'zod';
z.config(z.locales.ru());

export * from './content.js';
export * from './execution.js';
import {
  standardSchema,
  compilerSchema,
  type CodingExercise,
  type TestCase,
  type Compiler,
} from './content.js';
export const executionRequestSchema = z
  .object({
    source: z.string().min(1, 'Введите код программы').max(65_536, 'Код превышает 64 КБ'),
    standard: standardSchema,
    compiler: compilerSchema,
    stdin: z.string().max(16_384, 'Ввод превышает 16 КБ').default(''),
  })
  .strict();
export const submissionSchema = executionRequestSchema.extend({ mode: z.enum(['run', 'check']) });
export const sandboxRequestSchema = executionRequestSchema
  .extend({
    timeoutMs: z.number().int().min(100).max(10_000).optional(),
    diagnostics: z.enum(['sanitizers', 'valgrind']).optional(),
    cases: z
      .array(z.object({ stdin: z.string().max(16_384) }).strict())
      .min(1)
      .max(12),
  })
  .strict();
export const processResultSchema = z.object({
  stdout: z.string().max(33_000),
  stderr: z.string().max(33_000),
  exitCode: z.number().int().nullable(),
  durationMs: z.number().nonnegative(),
  status: z.enum(['ok', 'runtime_error', 'timeout', 'output_limit', 'resource_limit']),
});
export const sandboxResultSchema = z.object({
  compilation: processResultSchema,
  runs: z.array(processResultSchema).max(12),
});
export type SandboxRequest = z.infer<typeof sandboxRequestSchema>;
export type SandboxResult = z.infer<typeof sandboxResultSchema>;
export type ProcessResult = z.infer<typeof processResultSchema>;
export type CheckResult = {
  name: string;
  hidden: boolean;
  passed: boolean;
  status: string;
  stdin?: string;
  expected?: string;
  actual?: string;
  stderr?: string;
  durationMs: number;
  hiddenIndex?: number;
};
export type SubmissionResult = {
  id: string;
  status:
    | 'accepted'
    | 'wrong_answer'
    | 'compile_error'
    | 'runtime_error'
    | 'timeout'
    | 'output_limit'
    | 'resource_limit'
    | 'internal_error'
    | 'executed';
  compilation: ProcessResult;
  run?: ProcessResult;
  tests?: CheckResult[];
  passed?: number;
  total?: number;
};
export type LessonProgress = {
  lessonId: string;
  read: boolean;
  quizPassed: boolean;
  practicePassed: boolean;
  completedAt: string | null;
};
export type ProfileState = {
  name: string;
  onboarded: boolean;
  dailyGoal: number;
  compiler: Compiler;
  fontSize: number;
  lastLessonId: string | null;
  progress: LessonProgress[];
  bookmarks: string[];
  attempts: number;
  studyDays: string[];
};
export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'Введите имя').max(40).optional(),
    onboarded: z.boolean().optional(),
    dailyGoal: z.number().int().min(10).max(120).optional(),
    compiler: compilerSchema.optional(),
    fontSize: z.number().int().min(12).max(24).optional(),
  })
  .strict();

export * from './progress.js';
export function normalizeOutput(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd();
}
export function allExerciseTests(exercise: CodingExercise): Array<TestCase & { hidden: boolean }> {
  return [
    ...exercise.publicTests.map((test) => ({ ...test, hidden: false })),
    ...exercise.hiddenTests.map((test) => ({ ...test, hidden: true })),
  ];
}
function compareOutput(actual: string, expected: string, exercise: CodingExercise): boolean {
  if (exercise.checking.type === 'stdout')
    return exercise.checking.comparison === 'exact'
      ? actual === expected
      : normalizeOutput(actual) === normalizeOutput(expected);
  if (exercise.checking.type === 'function')
    return normalizeOutput(actual) === normalizeOutput(expected);
  if (exercise.checking.checker === 'unordered-lines') {
    const lines = (value: string) =>
      normalizeOutput(value)
        .split('\n')
        .sort((a, b) => a.localeCompare(b));
    return JSON.stringify(lines(actual)) === JSON.stringify(lines(expected));
  }
  const actualNumber = Number(actual.trim());
  const expectedNumber = Number(expected.trim());
  return (
    Number.isFinite(actualNumber) &&
    Number.isFinite(expectedNumber) &&
    Math.abs(actualNumber - expectedNumber) <= exercise.checking.tolerance!
  );
}
export function testInput(test: TestCase): string {
  return test.stdin ?? `${test.arguments!.map((value) => String(value)).join(' ')}\n`;
}
const cType = { int: 'int', long_long: 'long long', double: 'double', bool: 'int' } as const;
export function buildSubmissionSource(exercise: CodingExercise, source: string): string {
  if (exercise.checking.type !== 'function') return source;
  const { functionName, returnType, parameters } = exercise.checking;
  const cpp = exercise.language === 'cpp';
  const declarations = parameters
    .map((parameter) => `${cType[parameter.type]} ${parameter.name} = 0;`)
    .join('\n');
  const formats = parameters
    .map((parameter) =>
      parameter.type === 'double' ? '%lf' : parameter.type === 'long_long' ? '%lld' : '%d',
    )
    .join(' ');
  const addresses = parameters.map((parameter) => `&${parameter.name}`).join(', ');
  const call = `${functionName}(${parameters.map((parameter) => parameter.name).join(', ')})`;
  const output =
    returnType === 'double'
      ? `printf("%.17g\\n", (double)result);`
      : returnType === 'long_long'
        ? `printf("%lld\\n", (long long)result);`
        : `printf("%d\\n", (int)result);`;
  const includes = cpp ? '#include <cstdio>' : '#include <stdio.h>';
  const resultType = cpp ? 'auto' : cType[returnType];
  return `${source}\n${includes}\nint main(void) {\n${declarations}\nif (scanf("${formats}", ${addresses}) != ${parameters.length}) return 2;\n${resultType} result = ${call};\n${output}\nreturn 0;\n}\n`;
}
export function gradeResults(exercise: CodingExercise, result: SandboxResult): CheckResult[] {
  const tests = allExerciseTests(exercise);
  let hiddenIndex = 0;
  return tests.map((test, index) => {
    const run = result.runs[index];
    const passed =
      !!run && run.status === 'ok' && compareOutput(run.stdout, test.expected, exercise);
    const base = {
      name: test.hidden ? 'Скрытый тест' : test.name,
      hidden: test.hidden,
      passed,
      status: run?.status ?? 'not_run',
      durationMs: run?.durationMs ?? 0,
      ...(test.hidden ? { hiddenIndex: ++hiddenIndex } : {}),
    };
    return test.hidden
      ? base
      : {
          ...base,
          stdin: test.stdin ?? JSON.stringify(test.arguments),
          expected: test.expected,
          actual: run?.stdout ?? '',
          stderr: run?.stderr ?? '',
        };
  });
}
