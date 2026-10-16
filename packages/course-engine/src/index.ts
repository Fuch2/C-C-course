import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  courseSchema,
  lessonSchema,
  projectSchema,
  type CodingExercise,
  type PublicExercise,
  type Course,
  type Lesson,
  type Project,
  type PublicLesson,
  type LessonSummary,
  type CourseSearchItem,
} from '@course/shared';
import { ContentError, parseLessonBody } from './parser.js';
import { validateGraph, prerequisiteClosure } from './graph.js';
export * from './parser.js';
export * from './graph.js';

export function locateContent(): string {
  if (process.env.CONTENT_ROOT) return path.resolve(process.env.CONTENT_ROOT);
  for (const root of [
    process.cwd(),
    path.resolve(process.cwd(), '../..'),
    path.resolve(process.cwd(), '..'),
  ]) {
    const directory = path.join(root, 'content/cpp-systems');
    if (existsSync(path.join(directory, 'course.json'))) return directory;
  }
  throw new ContentError('content/cpp-systems', 'каталог курса не найден. Укажите CONTENT_ROOT.');
}
function readText(file: string) {
  try {
    return readFileSync(file, 'utf8');
  } catch (error) {
    throw new ContentError(file, `не удалось прочитать файл: ${(error as Error).message}`);
  }
}
function readMetadata<T>(file: string, schema: z.ZodType<T>): T {
  let raw: unknown;
  try {
    raw = JSON.parse(readText(file));
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw new ContentError(file, `неверный JSON: ${(error as Error).message}`);
  }
  const value = schema.safeParse(raw);
  if (!value.success)
    throw new ContentError(
      file,
      value.error.issues.map((i) => `${i.path.join('.') || 'документ'}: ${i.message}`).join('\n'),
    );
  return value.data;
}
function scan(directory: string): string[] {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    throw new ContentError(
      directory,
      `не удалось сканировать каталог: ${(error as Error).message}`,
    );
  }
  return entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      if (entry.name.startsWith('.')) return [];
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink())
        throw new ContentError(file, 'символические ссылки в контенте запрещены');
      return entry.isDirectory() ? scan(file) : [file];
    });
}
function unique(ids: string[], file: string, kind: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new ContentError(file, `повтор ID ${kind}: ${id}`);
    seen.add(id);
  }
}
const ordered = <T extends { order: number; id: string }>(a: T, b: T) =>
  a.order - b.order || a.id.localeCompare(b.id, 'en');
export type SearchEntry = CourseSearchItem & {
  lessonId?: string;
  text: string;
  normalizedTitle: string;
  tags: string[];
  order: number;
};
export type LoadedCourse = {
  course: Course;
  lessons: Lesson[];
  byId: Map<string, Lesson>;
  projects: Project[];
  searchIndex: SearchEntry[];
  tags: string[];
};
const cache = new Map<string, LoadedCourse>();
export function clearCourseCache() {
  cache.clear();
}
export function loadCourse(directory = locateContent()): LoadedCourse {
  directory = path.resolve(directory);
  // В production и интеграционных прогонах контент считывается один раз за процесс;
  // в обычной разработке перечитывается, чтобы изменения файлов были видны сразу.
  const shouldCache = process.env.NODE_ENV === 'production' || process.env.COURSE_CACHE === '1';
  if (shouldCache && cache.has(directory)) return cache.get(directory)!;
  const files = scan(directory);
  const courseFile = path.join(directory, 'course.json');
  const metadata = readMetadata(courseFile, courseSchema);
  unique(
    metadata.modules.map((m) => m.id),
    courseFile,
    'модуля',
  );
  const moduleGraph = new Map(metadata.modules.map((m) => [m.id, m.prerequisites]));
  validateGraph(moduleGraph, courseFile);
  const lessonFiles = files.filter((file) => path.basename(file) === 'lesson.json');
  const all: Lesson[] = [];
  const plainText = new Map<string, string>();
  const origins = new Map<string, string>();
  for (const file of lessonFiles) {
    const data = readMetadata(file, lessonSchema);
    if (origins.has(data.id))
      throw new ContentError(file, `повтор ID урока «${data.id}», ранее в ${origins.get(data.id)}`);
    origins.set(data.id, file);
    if (!moduleGraph.has(data.moduleId))
      throw new ContentError(file, `неизвестный moduleId: ${data.moduleId}`);
    unique(
      data.quiz.questions.map((q) => q.id),
      file,
      'вопроса',
    );
    for (const exercise of [data.exercise, ...data.additionalExercises]) {
      unique(
        exercise.hints.map((hint) => hint.id),
        file,
        'подсказки',
      );
      unique(
        [...exercise.publicTests, ...exercise.hiddenTests].map((test) => test.id),
        file,
        'теста',
      );
      exercise.hints.sort(ordered);
    }
    const bodies = ['md', 'mdx']
      .map((ext) => path.join(path.dirname(file), `lesson.${ext}`))
      .filter((p) => files.includes(p));
    if (bodies.length !== 1)
      throw new ContentError(
        file,
        'нужен ровно один файл lesson.md или lesson.mdx рядом с metadata',
      );
    const bodyFile = bodies[0]!;
    const body = readText(bodyFile);
    const format = bodyFile.endsWith('.mdx') ? 'mdx' : 'md';
    const parsed = parseLessonBody(body, format, bodyFile);
    plainText.set(data.id, parsed.text);
    all.push({
      ...data,
      summary: data.description,
      minutes: data.estimatedMinutes,
      body,
      format,
      sections: parsed.sections,
      document: parsed.document,
      previousLessonId: null,
      nextLessonId: null,
      effectivePrerequisites: [],
    });
    // Relative image URLs refer to files within content, never to the web working directory.
    function rewrite(node: import('hast').Root | import('hast').RootContent) {
      if (node.type === 'element') {
        for (const property of ['src', 'href'] as const) {
          const url = node.properties[property];
          if (typeof url !== 'string' || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(url)) continue;
          if (property !== 'src')
            throw new ContentError(
              bodyFile,
              `относительная ссылка «${url}»: используйте /lesson/ID, #якорь или полный URL`,
            );
          let decoded: string;
          try {
            decoded = decodeURIComponent(url);
          } catch {
            throw new ContentError(bodyFile, `неверный URL изображения: ${url}`);
          }
          const asset = path.resolve(path.dirname(file), decoded);
          const relative = path.relative(directory, asset);
          readContentAsset(relative.split(path.sep), directory);
          node.properties[property] =
            `/api/content-assets/${relative.split(path.sep).map(encodeURIComponent).join('/')}`;
        }
      }
      if ('children' in node) node.children.forEach(rewrite);
    }
    rewrite(parsed.document);
  }
  // Reject forgotten bodies: a new file must have its own validated metadata.
  for (const file of files.filter((f) => /\/lesson\.mdx?$/.test(f)))
    if (!files.includes(path.join(path.dirname(file), 'lesson.json')))
      throw new ContentError(file, 'не найдена metadata lesson.json');
  validateGraph(new Map(all.map((l) => [l.id, l.prerequisites])), directory);
  const modules = metadata.modules.sort(ordered).map((m, i) => ({
    ...m,
    number: i + 1,
    lessons: all
      .filter((l) => l.published && l.moduleId === m.id)
      .sort(ordered)
      .map((l) => l.id),
  }));
  const byAll = new Map(all.map((l) => [l.id, l]));
  const lessons = modules.flatMap((m) => m.lessons.map((id) => byAll.get(id)!));
  if (!lessons.length) throw new ContentError(courseFile, 'курс не содержит опубликованных уроков');
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const combinedGraph = new Map(
    lessons.map((l) => {
      const previousModules = prerequisiteClosure(l.moduleId, moduleGraph);
      const dependencies = [
        ...new Set([
          ...l.prerequisites,
          ...lessons
            .filter((other) => previousModules.includes(other.moduleId))
            .map((other) => other.id),
        ]),
      ];
      for (const id of dependencies)
        if (!byId.has(id))
          throw new ContentError(
            origins.get(l.id)!,
            `опубликованный урок зависит от черновика «${id}»`,
          );
      return [l.id, dependencies] as const;
    }),
  );
  validateGraph(combinedGraph, `${directory} (зависимости уроков и модулей)`);
  lessons.forEach((lesson, index) => {
    lesson.previousLessonId = lessons[index - 1]?.id ?? null;
    lesson.nextLessonId = lessons[index + 1]?.id ?? null;
    lesson.effectivePrerequisites = prerequisiteClosure(lesson.id, combinedGraph);
  });
  const projects = files
    .filter((file) => path.basename(file) === 'project.json')
    .map((file) => {
      const project = readMetadata(file, projectSchema);
      if (!moduleGraph.has(project.moduleId))
        throw new ContentError(file, `неизвестный moduleId: ${project.moduleId}`);
      for (const id of [...project.prerequisites, ...project.lessonIds]) {
        if (!byAll.has(id)) throw new ContentError(file, `неизвестный урок проекта: ${id}`);
        if (project.published && !byId.has(id))
          throw new ContentError(file, `проект ссылается на черновик: ${id}`);
      }
      return project;
    });
  unique(
    [
      metadata.id,
      ...modules.map((m) => m.id),
      ...all.flatMap((l) => [
        l.id,
        l.quiz.id,
        l.exercise.id,
        ...l.additionalExercises.map((e) => e.id),
      ]),
      ...projects.map((p) => p.id),
    ],
    directory,
    'сущности курса',
  );
  // Индекс содержит только публичный контент: ответы, решения, подсказки и hidden tests исключены.
  const searchIndex: SearchEntry[] = [
    ...modules.map((courseModule, index) => ({
      id: courseModule.id,
      kind: 'module' as const,
      title: courseModule.title,
      description: courseModule.description,
      href: `/course/${metadata.id}#module-${courseModule.id}`,
      moduleTitle: courseModule.title,
      text: normalizeSearch(`${courseModule.title} ${courseModule.description}`),
      normalizedTitle: normalizeSearch(courseModule.title),
      tags: [],
      order: index,
    })),
    ...lessons.flatMap((lesson, lessonIndex) => {
      const courseModule = modules.find((item) => item.id === lesson.moduleId)!;
      const tags = lesson.tags.map(normalizeSearch);
      const lessonEntry: SearchEntry = {
        id: lesson.id,
        kind: 'lesson',
        lessonId: lesson.id,
        title: lesson.title,
        description: lesson.description,
        href: `/lesson/${lesson.id}`,
        moduleTitle: courseModule.title,
        text: normalizeSearch(
          `${lesson.title} ${lesson.description} ${lesson.objectives.join(' ')} ${lesson.tags.join(' ')} ${courseModule.title} ${plainText.get(lesson.id)} ${lesson.exercise.title} ${lesson.exercise.description} ${lesson.exercise.constraints.join(' ')}`,
        ),
        normalizedTitle: normalizeSearch(lesson.title),
        tags,
        order: lessonIndex,
      };
      const sectionEntries: SearchEntry[] = lesson.sections.map((section, sectionIndex) => ({
        id: `${lesson.id}:${section.id}`,
        kind: 'section',
        lessonId: lesson.id,
        title: section.title,
        description: `Раздел урока «${lesson.title}»`,
        href: `/lesson/${lesson.id}#${section.id}`,
        moduleTitle: courseModule.title,
        lessonTitle: lesson.title,
        text: normalizeSearch(`${section.title} ${lesson.title} ${courseModule.title}`),
        normalizedTitle: normalizeSearch(section.title),
        tags,
        order: lessonIndex * 100 + sectionIndex,
      }));
      const exerciseEntries: SearchEntry[] = [lesson.exercise, ...lesson.additionalExercises].map(
        (exercise) => ({
          id: exercise.id,
          kind: 'exercise',
          lessonId: lesson.id,
          title: exercise.title,
          description: exercise.description,
          href: `/lesson/${lesson.id}?part=practice&exercise=${exercise.id}`,
          moduleTitle: courseModule.title,
          lessonTitle: lesson.title,
          text: normalizeSearch(
            `${exercise.title} ${exercise.description} ${exercise.constraints.join(' ')} ${lesson.title}`,
          ),
          normalizedTitle: normalizeSearch(exercise.title),
          tags,
          order: lessonIndex,
        }),
      );
      return [lessonEntry, ...sectionEntries, ...exerciseEntries];
    }),
  ];
  const tags = [
    ...new Map(lessons.flatMap((l) => l.tags).map((tag) => [normalizeSearch(tag), tag])).values(),
  ].sort((a, b) => a.localeCompare(b, 'ru'));
  const result = {
    course: { ...metadata, modules },
    lessons,
    byId,
    projects: projects.filter((p) => p.published).sort(ordered),
    searchIndex,
    tags,
  };
  if (shouldCache) cache.set(directory, result);
  return result;
}
function publicExercise(exercise: CodingExercise): PublicExercise {
  const {
    referenceSolution: _source,
    solutionExplanation: _explanation,
    hiddenTests,
    hints,
    ...publicFields
  } = exercise;
  void _source;
  void _explanation;
  return {
    ...publicFields,
    hints: hints.map(({ id, order }) => ({ id, order })),
    hiddenTestCount: hiddenTests.length,
  };
}
export function toPublicLesson(lesson: Lesson): PublicLesson {
  const { exercise, additionalExercises, quiz, ...rest } = lesson;
  return {
    ...rest,
    exercise: publicExercise(exercise),
    additionalExercises: additionalExercises.map(publicExercise),
    quiz: {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions.map((item) => ({
        id: item.id,
        type: item.type ?? 'single',
        question: item.question,
        ...(item.code !== undefined ? { code: item.code } : {}),
        ...(item.codeLanguage !== undefined ? { codeLanguage: item.codeLanguage } : {}),
        ...(item.type === 'text'
          ? item.placeholder !== undefined
            ? { placeholder: item.placeholder }
            : {}
          : { options: item.options }),
      })),
    },
  };
}
export function summarize(lesson: Lesson): LessonSummary {
  const {
    id,
    moduleId,
    title,
    description,
    summary,
    minutes,
    estimatedMinutes,
    order,
    difficulty,
    standard,
    tags,
    prerequisites,
    effectivePrerequisites,
    completion,
  } = lesson;
  return {
    id,
    moduleId,
    title,
    description,
    summary,
    minutes,
    estimatedMinutes,
    order,
    difficulty,
    standard,
    tags,
    prerequisites,
    effectivePrerequisites,
    completion,
  };
}
export function normalizeSearch(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
}
export function searchCourse(
  query: string,
  loaded = loadCourse(),
  tags: readonly string[] = [],
): LessonSummary[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const selected = tags.map(normalizeSearch);
  if (!words.length && !selected.length) return [];
  return loaded.searchIndex
    .filter(
      (entry) =>
        entry.kind === 'lesson' &&
        words.every((word) => entry.text.includes(word)) &&
        selected.every((tag) => entry.tags.includes(tag)),
    )
    .map((entry, index) => ({
      entry,
      index,
      score: words.filter((word) => entry.normalizedTitle.includes(word)).length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ entry }) => summarize(loaded.byId.get(entry.lessonId!)!));
}

export function searchCourseItems(
  query: string,
  loaded = loadCourse(),
  tags: readonly string[] = [],
): CourseSearchItem[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const selected = tags.map(normalizeSearch);
  if (!words.length && !selected.length) return [];
  const kindPriority = { module: 0, lesson: 1, exercise: 2, section: 3 } as const;
  return loaded.searchIndex
    .filter(
      (entry) =>
        words.every((word) => entry.text.includes(word)) &&
        selected.every((tag) => entry.tags.includes(tag)),
    )
    .map((entry) => ({
      entry,
      score: words.filter((word) => entry.normalizedTitle.includes(word)).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        kindPriority[a.entry.kind] - kindPriority[b.entry.kind] ||
        a.entry.order - b.entry.order,
    )
    .slice(0, 40)
    .map(({ entry }) => ({
      id: entry.id,
      kind: entry.kind,
      title: entry.title,
      description: entry.description,
      href: entry.href,
      moduleTitle: entry.moduleTitle,
      ...(entry.lessonTitle ? { lessonTitle: entry.lessonTitle } : {}),
    }));
}
export function lessonNavigation(id: string, loaded = loadCourse()) {
  const lesson = loaded.byId.get(id);
  if (!lesson) throw new ContentError('навигация', `урок не найден: ${id}`);
  return {
    previous: lesson.previousLessonId ? loaded.byId.get(lesson.previousLessonId)! : null,
    next: lesson.nextLessonId ? loaded.byId.get(lesson.nextLessonId)! : null,
  };
}
const imageTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};
export function readContentAsset(parts: string[], directory = locateContent()) {
  if (
    !parts.length ||
    parts.some((part) => !part || part === '.' || part === '..' || /[\\/\0]/.test(part))
  )
    throw new ContentError('изображение', 'недопустимый путь');
  const file = path.resolve(directory, ...parts);
  const mime = imageTypes[path.extname(file).toLowerCase()];
  if (!mime) throw new ContentError(file, 'разрешены изображения PNG, JPEG, GIF, WebP и AVIF');
  if (!existsSync(file)) throw new ContentError(file, 'изображение не найдено');
  const relative = path.relative(realpathSync(directory), realpathSync(file));
  if (relative.startsWith('..') || path.isAbsolute(relative) || !statSync(file).isFile())
    throw new ContentError(file, 'изображение выходит за каталог курса');
  return { body: readFileSync(file), mime };
}
