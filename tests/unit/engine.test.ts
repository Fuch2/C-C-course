import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  loadCourse,
  searchCourse,
  lessonNavigation,
  validateGraph,
  clearCourseCache,
  readContentAsset,
  toPublicLesson,
} from '@course/course-engine';
import {
  courseSchema,
  lessonSchema,
  hintSchema,
  projectSchema,
  quizSchema,
  testCaseSchema,
  calculateProgress,
  lessonPercent,
  isLessonComplete,
  missingPrerequisites,
  type LessonMetadata,
  type LessonProgress,
} from '@course/shared';

const baseline = lessonSchema.parse(
  JSON.parse(readFileSync('content/cpp-systems/start/first-program/lesson.json', 'utf8')),
);
const directories: string[] = [];
function metadata(id: string, overrides: Partial<LessonMetadata> = {}): LessonMetadata {
  return {
    ...structuredClone(baseline),
    id,
    moduleId: 'module-a',
    order: 1,
    prerequisites: [],
    published: true,
    quiz: { ...structuredClone(baseline.quiz), id: `${id}-quiz` },
    exercise: { ...structuredClone(baseline.exercise), id: `${id}-exercise` },
    additionalExercises: [],
    ...overrides,
  };
}
const moduleData = (id = 'module-a', order = 1, prerequisites: string[] = []) => ({
  id,
  order,
  title: 'Модуль',
  description: 'Описание модуля',
  prerequisites,
  level: 'Начальный' as const,
  icon: 'code',
});
function json(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data));
}
function fixture(lessons = [metadata('lesson-a')], modules = [moduleData()]) {
  const root = mkdtempSync(path.join(tmpdir(), 'course-engine-'));
  directories.push(root);
  json(path.join(root, 'course.json'), {
    id: 'test-course',
    title: 'Тестовый курс',
    description: 'Описание',
    subtitle: 'Подзаголовок',
    modules,
  });
  for (const lesson of lessons) {
    const folder = path.join(root, 'nested', lesson.id);
    json(path.join(folder, 'lesson.json'), lesson);
    writeFileSync(path.join(folder, 'lesson.md'), '## Раздел\n\nУчебная теория про память.\n');
  }
  return root;
}
afterEach(() => {
  vi.unstubAllEnvs();
  clearCourseCache();
  directories.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

describe('Строгие схемы и диагностика файлов', () => {
  it('требует новые metadata и отклоняет неизвестные поля', () => {
    const missing: Partial<LessonMetadata> = { ...baseline };
    delete missing.difficulty;
    expect(lessonSchema.safeParse(missing).success).toBe(false);
    expect(lessonSchema.safeParse({ ...baseline, typo: true }).success).toBe(false);
    expect(lessonSchema.safeParse({ ...baseline, order: -1 }).success).toBe(false);
    expect(lessonSchema.safeParse({ ...baseline, estimatedMinutes: 0 }).success).toBe(false);
    expect(lessonSchema.safeParse({ ...baseline, prerequisites: ['a', 'a'] }).success).toBe(false);
  });
  it('валидирует вложенные Quiz, Hint, TestCase и Project', () => {
    expect(
      quizSchema.safeParse({
        ...baseline.quiz,
        questions: [{ ...baseline.quiz.questions[0], correct: 99 }],
      }).success,
    ).toBe(false);
    expect(hintSchema.safeParse({ id: 'hint', text: ' ', order: 1 }).success).toBe(false);
    expect(
      testCaseSchema.safeParse({ ...baseline.exercise.publicTests[0], hidden: 'yes' }).success,
    ).toBe(false);
    expect(projectSchema.safeParse({ id: 'project' }).success).toBe(false);
    expect(courseSchema.safeParse({ id: '../escape' }).success).toBe(false);
    expect(
      lessonSchema.safeParse({ ...baseline, exercise: { ...baseline.exercise, standard: 'c++20' } })
        .success,
    ).toBe(false);
  });
  it('проверяет глобальные ID и вложенные тесты дополнительных задач', () => {
    const lesson = metadata('lesson-a');
    lesson.additionalExercises = [structuredClone(lesson.exercise)];
    expect(() => loadCourse(fixture([lesson]))).toThrow();
    lesson.additionalExercises[0]!.id = 'extra-exercise';
    lesson.additionalExercises[0]!.publicTests.push(
      structuredClone(lesson.additionalExercises[0]!.publicTests[0]!),
    );
    expect(() => loadCourse(fixture([lesson]))).toThrow();
  });
  it('сообщает файл и поле при ошибке Zod, ошибке JSON и отсутствующем теле', () => {
    const root = fixture();
    const file = path.join(root, 'nested/lesson-a/lesson.json');
    json(file, { ...metadata('lesson-a'), estimatedMinutes: -2 });
    expect(() => loadCourse(root)).toThrow(/lesson.json.*estimatedMinutes/s);
    writeFileSync(file, '{oops');
    expect(() => loadCourse(root)).toThrow(/lesson.json: неверный JSON/);
    json(file, metadata('lesson-a'));
    rmSync(path.join(root, 'nested/lesson-a/lesson.md'));
    expect(() => loadCourse(root)).toThrow(/ровно один файл/);
  });
  it('обнаруживает повтор ID в разных каталогах и внутри задания', () => {
    const root = fixture();
    const duplicate = path.join(root, 'other/lesson.json');
    json(duplicate, metadata('lesson-a'));
    expect(() => loadCourse(root)).toThrow(/повтор ID урока/);
    rmSync(duplicate);
    const lesson = metadata('lesson-a');
    lesson.exercise.hiddenTests.push(lesson.exercise.publicTests[0]!);
    json(path.join(root, 'nested/lesson-a/lesson.json'), lesson);
    expect(() => loadCourse(root)).toThrow(/повтор ID теста/);
  });
  it('отклоняет неизвестный модуль, пустой курс и символические ссылки', () => {
    expect(() => loadCourse(fixture([metadata('lesson-a', { moduleId: 'missing' })]))).toThrow(
      /moduleId/,
    );
    expect(() => loadCourse(fixture([]))).toThrow(/не содержит опубликованных/);
    const root = fixture();
    symlinkSync('/tmp', path.join(root, 'outside'));
    expect(() => loadCourse(root)).toThrow(/символические ссылки/);
  });
  it('проверяет даже неопубликованные metadata и исключает черновики из каталога и поиска', () => {
    const root = fixture([
      metadata('lesson-a'),
      metadata('draft', { published: false, title: 'Секретный черновик' }),
    ]);
    expect(loadCourse(root).lessons.map((l) => l.id)).toEqual(['lesson-a']);
    expect(searchCourse('Секретный', loadCourse(root))).toEqual([]);
    json(path.join(root, 'nested/draft/lesson.json'), { ...metadata('draft'), typo: 1 });
    expect(() => loadCourse(root)).toThrow(/draft\/lesson.json/);
  });
});

describe('Сканирование, сортировка, навигация и граф prerequisites', () => {
  it('сортирует по module.order, lesson.order, затем ID, независимо от имён каталогов', () => {
    const loaded = loadCourse(
      fixture(
        [
          metadata('z', { order: 1 }),
          metadata('b', { moduleId: 'module-b', order: 1 }),
          metadata('a', { order: 1 }),
        ],
        [moduleData('module-a', 20), moduleData('module-b', 10)],
      ),
    );
    expect(loaded.lessons.map((l) => l.id)).toEqual(['b', 'a', 'z']);
    expect(loaded.course.modules[1]?.lessons).toEqual(['a', 'z']);
    expect(lessonNavigation('b', loaded).previous).toBeNull();
    expect(lessonNavigation('a', loaded).previous?.id).toBe('b');
    expect(lessonNavigation('a', loaded).next?.id).toBe('z');
    expect(lessonNavigation('z', loaded).next).toBeNull();
    expect(() => lessonNavigation('missing', loaded)).toThrow(/не найден/);
  });
  it('разрешает ссылку вперёд и вычисляет транзитивные зависимости', () => {
    const loaded = loadCourse(
      fixture([
        metadata('a', { prerequisites: ['b'] }),
        metadata('b', { prerequisites: ['c'] }),
        metadata('c'),
      ]),
    );
    expect(loaded.byId.get('a')?.effectivePrerequisites).toEqual(['b', 'c']);
  });
  it('различает отсутствующую зависимость, самоссылку и цикл', () => {
    expect(() => validateGraph(new Map([['a', ['missing']]]), 'test')).toThrow(
      /неизвестный prerequisite «missing»/,
    );
    expect(() => validateGraph(new Map([['a', ['a']]]), 'test')).toThrow(/a → a/);
    expect(() =>
      validateGraph(
        new Map([
          ['ok', []],
          ['a', ['b']],
          ['b', ['c']],
          ['c', ['a']],
        ]),
        'test',
      ),
    ).toThrow(/a → b → c → a/);
    expect(() =>
      loadCourse(
        fixture([metadata('a', { prerequisites: ['b'] }), metadata('b', { prerequisites: ['a'] })]),
      ),
    ).toThrow(/цикл prerequisites/);
  });
  it('проверяет граф модулей и совместный цикл модулей с уроками', () => {
    expect(() =>
      loadCourse(
        fixture(
          [metadata('a')],
          [moduleData('module-a', 1, ['module-b']), moduleData('module-b', 2, ['module-a'])],
        ),
      ),
    ).toThrow(/module-a → module-b → module-a/);
    const lessons = [
      metadata('a', { prerequisites: ['b'] }),
      metadata('b', { moduleId: 'module-b' }),
    ];
    expect(() =>
      loadCourse(fixture(lessons, [moduleData(), moduleData('module-b', 2, ['module-a'])])),
    ).toThrow(/цикл prerequisites/);
  });
  it('наследует зависимости модулей и запрещает зависеть от черновика', () => {
    const loaded = loadCourse(
      fixture(
        [metadata('a'), metadata('b', { moduleId: 'module-b' })],
        [moduleData(), moduleData('module-b', 2, ['module-a'])],
      ),
    );
    expect(loaded.byId.get('b')?.effectivePrerequisites).toEqual(['a']);
    expect(() =>
      loadCourse(
        fixture([
          metadata('a', { prerequisites: ['draft'] }),
          metadata('draft', { published: false }),
        ]),
      ),
    ).toThrow(/зависит от черновика/);
  });
  it('кеширует по каталогу только в production и поддерживает сброс', () => {
    const one = fixture([metadata('one')]),
      two = fixture([metadata('two')]);
    vi.stubEnv('NODE_ENV', 'production');
    const loaded = loadCourse(one);
    expect(loadCourse(one)).toBe(loaded);
    expect(loadCourse(two).lessons[0]?.id).toBe('two');
    clearCourseCache();
    expect(loadCourse(one)).not.toBe(loaded);
  });
});

describe('Поисковый индекс и проекты', () => {
  it('ищет по всем словам, нормализует ё/е и комбинирует теги через И', () => {
    const loaded = loadCourse(
      fixture([
        metadata('a', { title: 'Учёт памяти', tags: ['C', 'Память'] }),
        metadata('b', { tags: ['C'] }),
      ]),
    );
    expect(searchCourse('УЧЕТ память', loaded).map((l) => l.id)).toEqual(['a']);
    expect(searchCourse('', loaded, ['c', 'память']).map((l) => l.id)).toEqual(['a']);
    expect(searchCourse('память', loaded, ['нет'])).toEqual([]);
    expect(searchCourse('', loaded)).toEqual([]);
    expect(searchCourse('память', loaded)[0]).not.toHaveProperty('document');
    expect(searchCourse('секретныйответ', loaded)).toEqual([]);
  });
  it('не индексирует и не публикует решения и закрытые ответы', () => {
    const lesson = metadata('a');
    lesson.exercise.referenceSolution = 'секретныйответ';
    lesson.quiz.questions[0]!.explanation = 'секретныйответ';
    const loaded = loadCourse(fixture([lesson]));
    expect(JSON.stringify(toPublicLesson(loaded.lessons[0]!))).not.toContain('секретныйответ');
    expect(searchCourse('секретныйответ', loaded)).toEqual([]);
  });
  it('сканирует проекты и проверяет ссылки на уроки', () => {
    const root = fixture();
    const file = path.join(root, 'projects/demo/project.json');
    const project = {
      id: 'project-a',
      title: 'Проект',
      description: 'Описание',
      moduleId: 'module-a',
      order: 1,
      difficulty: 'beginner',
      estimatedMinutes: 20,
      prerequisites: [],
      objectives: ['Цель'],
      tags: ['C'],
      lessonIds: ['lesson-a'],
      deliverables: ['Исходник'],
    };
    json(file, project);
    expect(loadCourse(root).projects[0]?.id).toBe('project-a');
    json(file, { ...project, lessonIds: ['missing'] });
    expect(() => loadCourse(root)).toThrow(/неизвестный урок проекта/);
  });
  it('раздаёт только изображения внутри content, закрывает traversal и metadata', () => {
    const root = fixture();
    writeFileSync(path.join(root, 'image.png'), Buffer.from([137, 80, 78, 71]));
    expect(readContentAsset(['image.png'], root).mime).toBe('image/png');
    expect(() => readContentAsset(['..', 'image.png'], root)).toThrow(/путь/);
    expect(() => readContentAsset(['course.json'], root)).toThrow(/разрешены изображения/);
    expect(() => readContentAsset(['missing.png'], root)).toThrow(/не найдено/);
  });
});

describe('Расчёт завершённости и процентов', () => {
  const p = (lessonId: string, flags: Partial<LessonProgress> = {}): LessonProgress => ({
    lessonId,
    read: false,
    quizPassed: false,
    practicePassed: false,
    completedAt: null,
    ...flags,
  });
  const lessons = [
    { id: 'reading', completion: 'reading' as const },
    { id: 'practice', completion: 'practice' as const },
  ];
  it('учитывает режим чтения и самостоятельные результаты практики', () => {
    expect(lessonPercent(p('reading', { quizPassed: true }), 'reading')).toBe(0);
    expect(lessonPercent(p('reading', { read: true }), 'reading')).toBe(100);
    expect(lessonPercent(p('practice', { read: true, quizPassed: true }))).toBe(50);
    expect(isLessonComplete(p('practice', { read: true, quizPassed: true }))).toBe(false);
    expect(
      isLessonComplete(p('practice', { read: true, quizPassed: true, practicePassed: true })),
    ).toBe(true);
    expect(lessonPercent(p('practice', { completedAt: '2026-09-09' }))).toBe(100);
  });
  it('вычисляет взвешивание по урокам, игнорирует посторонние ID и пустые модули', () => {
    expect(calculateProgress([], [])).toEqual({
      total: 0,
      completed: 0,
      percent: 0,
      complete: false,
    });
    expect(
      calculateProgress(lessons, [
        p('reading', { read: true }),
        p('practice', { read: true }),
        p('other', { read: true }),
      ]),
    ).toEqual({ total: 2, completed: 1, percent: 60, complete: false });
    expect(
      calculateProgress([lessons[0]!, lessons[0]!], [p('reading', { read: true })]).percent,
    ).toBe(100);
    expect(
      missingPrerequisites(['reading', 'practice'], lessons, [p('reading', { read: true })]),
    ).toEqual(['practice']);
  });
});
