/**
 * Сохраняет примеры с меткой «// Ошибка памяти» из lesson.mdx в отдельные файлы —
 * для получения настоящих отчётов санитайзеров через diagnose.ts.
 *
 *   node --import tsx scripts/lessons/memory-examples.ts lesson.mdx каталог
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { extractExamples } from './examples';

const [mdx, out] = process.argv.slice(2);
if (!mdx || !out) throw new Error('Укажите lesson.mdx и каталог.');
extractExamples(readFileSync(mdx, 'utf8'))
  .filter((example) => example.marker === 'memory')
  .forEach((example, i) => writeFileSync(`${out}/${i}.c`, `${example.source}\n`));
