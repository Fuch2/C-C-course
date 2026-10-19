import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import { toString } from 'mdast-util-to-string';
import type { Root as MarkdownRoot, RootContent } from 'mdast';
import type { Root, Element } from 'hast';
import type { Node } from 'unist';
import { z } from 'zod';
import { lessonSectionSchema, type LessonSection } from '@course/shared';

export const learningComponentNames = [
  'Concept',
  'Important',
  'Warning',
  'Tip',
  'MemoryDiagram',
  'TryIt',
  'Quiz',
  'CodingExercise',
  'Checkpoint',
  'CommonMistake',
  'UnderTheHood',
] as const;
const names = new Set<string>(learningComponentNames);
const propsSchema = z.strictObject({ title: z.string().trim().min(1).optional() });
export class ContentError extends Error {
  constructor(
    public file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
    this.name = 'ContentError';
  }
}
export function headingId(text: string) {
  return (
    text
      .toLocaleLowerCase('ru')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '') || 'раздел'
  );
}
function walk(node: Node, visit: (node: Node) => void) {
  visit(node);
  if ('children' in node) for (const child of node.children as Node[]) walk(child, visit);
}
export function safeContentUrl(url: string): boolean {
  return (
    !/[\u0000-\u0020\\]/u.test(url) &&
    !url.startsWith('//') &&
    (!/^[a-z][a-z0-9+.-]*:/i.test(url) || /^(https?:|mailto:)/i.test(url))
  );
}
/**
 * Пример кода, за которым следуют абзац «Ввод:» и блок text, получает этот ввод
 * как начальное значение поля stdin кнопки «Запустить».
 */
function attachExampleInput(tree: MarkdownRoot) {
  const children = tree.children;
  children.forEach((node, index) => {
    if (node.type !== 'code' || !['c', 'cpp'].includes(node.lang ?? '')) return;
    const label = children[index + 1];
    const input = children[index + 2];
    if (
      label?.type === 'paragraph' &&
      /^Ввод/u.test(toString(label).trim()) &&
      input?.type === 'code' &&
      input.lang === 'text'
    )
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, dataStdin: input.value },
      };
  });
}
/**
 * Имя файла после языка блока (```c geometry.h) показывается в подписи вместо main.c.
 * Такой блок — часть многофайловой программы, поэтому кнопки «Запустить» у него нет.
 */
const fileNamePattern = /^[\p{L}\p{N}_.+-]+(\/[\p{L}\p{N}_.+-]+)*$/u;
function attachFileName(node: Extract<RootContent, { type: 'code' }>, file: string) {
  const name = node.meta?.trim();
  if (!name) return;
  if (!fileNamePattern.test(name))
    throw new ContentError(
      file,
      `строка ${node.position?.start.line ?? 1}: после языка блока кода допускается только имя файла, получено «${name}»`,
    );
  node.data = { ...node.data, hProperties: { ...node.data?.hProperties, dataFile: name } };
}
/** Декларативный MDX: компоненты и строковые props, без выполнения JavaScript. */
export function parseLessonBody(body: string, format: 'md' | 'mdx' = 'md', file = 'lesson.md') {
  const processor = unified().use(remarkParse).use(remarkGfm);
  if (format === 'mdx') processor.use(remarkMdx);
  let tree: MarkdownRoot;
  try {
    tree = processor.parse(body);
  } catch (error) {
    throw new ContentError(
      file,
      `не удалось разобрать ${format.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!body.trim()) throw new ContentError(file, 'пустой документ урока');
  const sections: LessonSection[] = [];
  const used = new Set<string>();
  const components: string[] = [];
  const labels: string[] = [];
  const references: { url: string; image: boolean }[] = [];
  const fail = (node: Node, message: string): never => {
    throw new ContentError(file, `строка ${node.position?.start.line ?? 1}: ${message}`);
  };
  walk(tree, (node) => {
    if (node.type === 'heading') {
      const heading = node as Extract<RootContent, { type: 'heading' }>;
      const title = toString(heading).trim();
      if (!title) fail(node, 'заголовок не должен быть пустым');
      const base = headingId(title);
      let id = base,
        suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      heading.data = { ...heading.data, hProperties: { id } };
      sections.push(
        lessonSectionSchema.parse({
          id,
          title,
          depth: heading.depth,
          line: heading.position?.start.line ?? 1,
        }),
      );
    }
    if (node.type === 'code') attachFileName(node as Extract<RootContent, { type: 'code' }>, file);
    if (node.type === 'html')
      fail(node, 'HTML не поддерживается. Используйте Markdown или учебный компонент в .mdx.');
    if (['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'].includes(node.type))
      fail(
        node,
        'JavaScript, import/export и выражения запрещены в учебном MDX; используйте текст и компоненты.',
      );
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (node.type !== 'mdxJsxFlowElement')
        fail(node, 'учебный компонент должен быть отдельным блоком');
      const element = node as Extract<RootContent, { type: 'mdxJsxFlowElement' }>;
      if (!element.name || !names.has(element.name))
        fail(node, `неизвестный компонент <${element.name ?? ''}>`);
      const props: Record<string, string> = Object.create(null);
      for (const attribute of element.attributes) {
        if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.value !== 'string')
          fail(node, 'параметры компонентов должны быть строками в кавычках');
        if (attribute.type === 'mdxJsxAttribute' && typeof attribute.value === 'string') {
          if (Object.hasOwn(props, attribute.name))
            fail(node, `повтор параметра ${attribute.name}`);
          props[attribute.name] = attribute.value;
        }
      }
      const parsed = propsSchema.safeParse(props);
      if (!parsed.success)
        fail(
          node,
          `неверные параметры <${element.name}>: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
        );
      element.data = { hName: 'aside', hProperties: { dataComponent: element.name!, ...props } };
      if (['Quiz', 'CodingExercise'].includes(element.name!) && components.includes(element.name!))
        fail(node, `повтор <${element.name}>: в уроке предусмотрен один такой блок`);
      components.push(element.name!);
      if (props.title) labels.push(props.title);
    }
    if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
      const link = node as Extract<RootContent, { type: 'link' | 'image' | 'definition' }>;
      if (!safeContentUrl(link.url)) fail(node, `недопустимая ссылка: ${link.url}`);
      references.push({ url: link.url, image: node.type === 'image' });
    }
  });
  attachExampleInput(tree);
  const document = unified()
    .use(remarkRehype, {
      footnoteLabel: 'Примечания',
      footnoteBackLabel: 'Вернуться к тексту',
      handlers: {
        mdxJsxFlowElement(state, node) {
          const element: Element = {
            type: 'element',
            tagName: 'aside',
            properties: node.data?.hProperties ?? {},
            children: state.all(node),
          };
          return element;
        },
      },
    })
    .use(rehypeHighlight)
    .runSync(tree) as Root;
  // Синтаксические деревья не содержат исполняемый MDX или ответы из metadata.
  return {
    document,
    sections,
    text: [
      ...tree.children.map((child) => toString(child, { includeImageAlt: true })),
      ...labels,
    ].join(' '),
    components,
    references,
  };
}
