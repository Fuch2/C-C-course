import { describe, expect, it } from 'vitest';
import { parseLessonBody, learningComponentNames } from '@course/course-engine';
import type { Root, RootContent } from 'hast';
function elements(root: Root | RootContent, tag: string): import('hast').Element[] {
  return [
    ...(root.type === 'element' && root.tagName === tag ? [root] : []),
    ...('children' in root ? root.children.flatMap((child) => elements(child, tag)) : []),
  ];
}
describe('Парсер Markdown/MDX', () => {
  it('поддерживает headings, абзацы, таблицы, списки, inline code, code blocks, ссылки и изображения', () => {
    const result = parseLessonBody(
      '# Заголовок\n\nАбзац с **жирным** и `int`.\n\n| Тип | Размер |\n| --- | --- |\n| char | 1 |\n\n- Один\n- Два\n\n1. Первый\n2. Второй\n\n```c\nint main(void) { return 0; }\n```\n\n[Документация](https://example.org)\n\n![Схема](./scheme.png)\n',
    );
    for (const tag of ['h1', 'p', 'table', 'ul', 'ol', 'code', 'pre', 'a', 'img'])
      expect(elements(result.document, tag).length, tag).toBeGreaterThan(0);
    expect(elements(result.document, 'a')[0]?.properties.href).toBe('https://example.org');
    expect(elements(result.document, 'img')[0]?.properties.alt).toBe('Схема');
  });
  it('строит стабильные уникальные якоря для всех уровней, учитывая inline форматирование', () => {
    const result = parseLessonBody(
      '# О `main`\n\n## О main\n\n## О main-2\n\n### **Память**\n\n```md\n## Не заголовок\n```',
    );
    expect(result.sections.map((s) => s.id)).toEqual([
      'о-main',
      'о-main-2',
      'о-main-2-2',
      'память',
    ]);
    expect(result.sections.map((s) => s.depth)).toEqual([1, 2, 2, 3]);
    expect(elements(result.document, 'h2')[0]?.properties.id).toBe(result.sections[1]?.id);
    expect(result.sections[0]?.title).toBe('О main');
  });
  it.each(learningComponentNames)('разбирает учебный компонент <%s>', (name) => {
    const result = parseLessonBody(
      `<${name} title="Подпись">\n\nТекст с **выделением**.\n\n</${name}>`,
      'mdx',
    );
    expect(result.components).toEqual([name]);
    expect(elements(result.document, 'aside')[0]?.properties).toMatchObject({
      dataComponent: name,
      title: 'Подпись',
    });
    expect(elements(result.document, 'strong')).toHaveLength(1);
  });
  it('разбирает вложенные и самозакрывающиеся компоненты', () => {
    const result = parseLessonBody(
      '<Concept>\n\n<Tip>\n\nСовет\n\n</Tip>\n\n</Concept>\n\n<Quiz />',
      'mdx',
    );
    expect(result.components).toEqual(['Concept', 'Tip', 'Quiz']);
  });
  it.each([
    '<Unknown />',
    '<Tip wrong="x" />',
    '<Tip title="" />',
    '<Tip title={process.env.SECRET} />',
    '<Tip {...props} />',
    'export const x = 1',
    '{process.exit()}',
    '<script>alert(1)</script>',
  ])('отклоняет неизвестный или исполняемый MDX: %s', (body) => {
    expect(() => parseLessonBody(body, 'mdx', 'example/lesson.mdx')).toThrow(
      /example\/lesson.mdx:/,
    );
  });
  it('показывает синтаксическую ошибку с именем файла и не интерпретирует код как MDX', () => {
    expect(() => parseLessonBody('<Tip>\n', 'mdx', 'broken.mdx')).toThrow(
      /broken.mdx: не удалось разобрать/,
    );
    const result = parseLessonBody('```cpp\n#include <vector>\nint x{1};\n```', 'mdx');
    expect(elements(result.document, 'pre')).toHaveLength(1);
    expect(result.components).toEqual([]);
  });
  it('передаёт имя файла блока кода и ввод примера', () => {
    const result = parseLessonBody(
      '```c src/geometry.h\nint area(int w, int h);\n```\n\n```c\nint main(void) { return 0; }\n```\n\nВвод:\n\n```text\n3 4\n```\n\n<Tip>\n\n```c main.c\nint main(void) { return 0; }\n```\n\n</Tip>',
      'mdx',
    );
    const codes = elements(result.document, 'code');
    expect(codes[0]?.properties).toMatchObject({ dataFile: 'src/geometry.h' });
    expect(codes[1]?.properties).toMatchObject({ dataStdin: '3 4' });
    expect(codes[1]?.properties).not.toHaveProperty('dataFile');
    expect(codes[3]?.properties).toMatchObject({ dataFile: 'main.c' });
    expect(() => parseLessonBody('```c {1,3} title\nint x;\n```', 'md', 'meta.md')).toThrow(
      /meta.md: строка 1: после языка блока кода допускается только имя файла/,
    );
  });
  it('отклоняет пустой документ, сырой HTML и опасные URL', () => {
    expect(() => parseLessonBody('  ')).toThrow(/пустой/);
    expect(() => parseLessonBody('##', 'md', 'empty.md')).toThrow(/empty.md: строка 1: заголовок/);
    expect(() => parseLessonBody('<script>alert(1)</script>')).toThrow(/HTML/);
    expect(() => parseLessonBody('[ссылка](javascript:alert%281%29)')).toThrow(
      /недопустимая ссылка/,
    );
    expect(() => parseLessonBody('![схема](data:text/html,hello)')).toThrow(/недопустимая ссылка/);
  });
});
