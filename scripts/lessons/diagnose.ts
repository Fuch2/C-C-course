/**
 * Запуск исходника в sandbox с диагностикой памяти — для подготовки текстов уроков.
 *
 *   [CC_NAME=gcc] node --import tsx scripts/lessons/diagnose.ts file.c|file.cpp [sanitizers|valgrind] [stdin]
 */
import { readFileSync } from 'node:fs';
import { executeSandbox, type DiagnosticMode } from '../../apps/runner/src/sandbox';

const [file, mode = 'sanitizers', stdin = ''] = process.argv.slice(2);
if (!file) throw new Error('Укажите файл с исходником.');
const result = await executeSandbox(
  {
    source: readFileSync(file, 'utf8'),
    standard: file.endsWith('.cpp') ? 'c++23' : 'c23',
    compiler: process.env.CC_NAME === 'gcc' || mode === 'valgrind' ? 'gcc' : 'clang',
    stdin: '',
    cases: [{ stdin }],
    timeoutMs: 10_000,
  },
  mode as DiagnosticMode,
);
const run = result.runs[0];
process.stdout.write(
  `${result.compilation.stderr}--- status=${run?.status} exit=${run?.exitCode}\n--- stdout\n${run?.stdout ?? ''}--- stderr\n${run?.stderr ?? ''}`,
);
