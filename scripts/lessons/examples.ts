/**
 * Разбор запускаемых примеров в тексте урока (`lesson.mdx`).
 *
 * Пример — блок ```c или ```cpp с функцией `main`. За ним могут идти абзац «Ввод:» с блоком
 * text (stdin) и абзац «Вывод:» с блоком text (ожидаемый stdout). Комментарий в коде задаёт
 * ожидаемый исход: «// Ошибка компиляции», «// Ошибка выполнения» / «// Код завершения» или
 * «// Ошибка памяти» — дефект, который обязан найти AddressSanitizer/UBSan.
 */
export type Example = {
  source: string;
  lang: string;
  stdin: string;
  stdout?: string;
  marker: 'none' | 'compile' | 'runtime' | 'memory';
};

/** Как вывод выглядит в тексте урока: пробелы в конце строк и финальный перевод строки не видны. */
export const displayed = (text: string) => text.replace(/[ \t]+$/gm, '').replace(/\n$/, '');

/** Отчёт ASan, LSan или UBSan в stderr программы. */
export const isSanitizerReport = (stderr: string) =>
  /ERROR: (AddressSanitizer|LeakSanitizer)|runtime error:/.test(stderr);

/** Находит запускаемые примеры и сопровождающие их блоки «Ввод:» и «Вывод:». */
export function extractExamples(mdx: string): Example[] {
  const fence = /^```([^\n`]*)\n([\s\S]*?)^```[ \t]*$/gm;
  const blocks: { lang: string; code: string; before: string }[] = [];
  let last = 0;
  for (const match of mdx.matchAll(fence)) {
    blocks.push({ lang: match[1]!.trim(), code: match[2]!, before: mdx.slice(last, match.index) });
    last = match.index! + match[0].length;
  }
  const examples: Example[] = [];
  blocks.forEach((block, index) => {
    if (!['c', 'cpp'].includes(block.lang) || !/\bmain\s*\(/.test(block.code)) return;
    const example: Example = {
      source: block.code.replace(/\n$/, ''),
      lang: block.lang,
      stdin: '',
      marker: /\/\/ Ошибка компиляции/.test(block.code)
        ? 'compile'
        : /\/\/ Ошибка памяти/.test(block.code)
          ? 'memory'
          : /\/\/ (Ошибка выполнения|Код завершения)/.test(block.code)
            ? 'runtime'
            : 'none',
    };
    let next = index + 1;
    const label = (i: number, pattern: RegExp) => {
      const candidate = blocks[i];
      if (!candidate || candidate.lang !== 'text') return false;
      // Метка — последняя непустая строка перед блоком, например «Вывод:».
      const line = candidate.before.trim().split('\n').at(-1)?.trim() ?? '';
      return line.length < 40 && pattern.test(line);
    };
    if (label(next, /Ввод/)) {
      example.stdin = blocks[next]!.code;
      next += 1;
    }
    if (label(next, /Вывод/)) example.stdout = blocks[next]!.code;
    examples.push(example);
  });
  return examples;
}
