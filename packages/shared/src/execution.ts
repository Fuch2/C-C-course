import { z } from 'zod';
import { compilerSchema, standardSchema } from './content.js';
import type { SubmissionResult } from './index.js';
export const executionLimits = {
  sourceBytes: 65_536,
  stdinBytes: 16_384,
  outputBytes: 32_768,
  minTimeoutMs: 100,
  maxTimeoutMs: 10_000,
  defaultTimeoutMs: 2000,
  compileTimeoutMs: 15_000,
} as const;
const byteString = (maximum: number) =>
  z
    .string()
    .max(maximum)
    .refine((s) => new TextEncoder().encode(s).length <= maximum, `Максимум ${maximum} байт UTF-8`);
export const runRequestSchema = z
  .strictObject({
    language: z.enum(['c', 'cpp']),
    standard: standardSchema,
    sourceCode: byteString(executionLimits.sourceBytes).refine(
      (s) => !!s.trim(),
      'Введите код программы',
    ),
    stdin: byteString(executionLimits.stdinBytes),
    compiler: compilerSchema,
    timeoutMs: z.number().int().min(executionLimits.minTimeoutMs).max(executionLimits.maxTimeoutMs),
  })
  .refine(
    (r) => (r.language === 'cpp') === r.standard.startsWith('c++'),
    'Стандарт не соответствует выбранному языку',
  );
export const runResponseSchema = z.strictObject({
  status: z.enum([
    'success',
    'compile_error',
    'runtime_error',
    'timeout',
    'resource_limit',
    'internal_error',
  ]),
  compilerOutput: z.string().max(65_536),
  stdout: z.string().max(65_536),
  stderr: z.string().max(65_536),
  exitCode: z.number().int().nullable(),
  executionTimeMs: z.number().nonnegative(),
});
export type RunRequest = z.infer<typeof runRequestSchema>;
export type RunResponse = z.infer<typeof runResponseSchema>;
export function executionFailure(
  message: string,
  status: RunResponse['status'] = 'internal_error',
): RunResponse {
  return {
    status,
    compilerOutput: '',
    stdout: '',
    stderr: message,
    exitCode: null,
    executionTimeMs: 0,
  };
}
/** Adapter for the existing lesson history/UI; the public execution API keeps its exact contract. */
export function executionToSubmission(value: RunResponse, id = ''): SubmissionResult {
  const failedCompilation = value.status === 'compile_error';
  return {
    id,
    status: value.status === 'success' ? 'executed' : value.status,
    compilation: {
      stdout: '',
      stderr: value.compilerOutput,
      exitCode: failedCompilation ? 1 : 0,
      durationMs: 0,
      status: failedCompilation ? 'runtime_error' : 'ok',
    },
    ...(failedCompilation
      ? {}
      : {
          run: {
            stdout: value.stdout,
            stderr: value.stderr,
            exitCode: value.exitCode,
            durationMs: value.executionTimeMs,
            status:
              value.status === 'success'
                ? ('ok' as const)
                : value.status === 'internal_error' || value.status === 'compile_error'
                  ? ('runtime_error' as const)
                  : value.status,
          },
        }),
  };
}
