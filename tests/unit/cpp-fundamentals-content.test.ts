import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';

const moduleDir = 'content/cpp-systems/cpp-fundamentals';
const loaded = loadCourse();
const lessons = loaded.lessons.filter((lesson) => lesson.moduleId === 'cpp-fundamentals');
const report = JSON.parse(readFileSync('docs/verification/lessons.json', 'utf8')) as {
  exercises: Record<string, { gcc: boolean; clang: boolean; bugDetected?: boolean }>;
};
const sourceDirs = readdirSync(moduleDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${moduleDir}/${entry.name}`);

describe('Модуль «Основы C++»', () => {
  it('содержит 27 последовательных уроков C++23, собранных из авторских исходников', () => {
    expect(lessons).toHaveLength(27);
    expect(sourceDirs).toHaveLength(27);
    expect(existsSync(`${moduleDir}/examples.json`)).toBe(false);
    for (const dir of sourceDirs) expect(existsSync(`${dir}/lesson.src.mjs`), dir).toBe(true);
    expect(lessons.map((lesson) => lesson.id.replace(/^cpp2[03]-/, ''))).toEqual([
      'difference',
      'namespaces',
      'cout',
      'format',
      'cin',
      'string',
      'references',
      'const-references',
      'string-view',
      'auto',
      'range-for',
      'overload',
      'default-arguments',
      'enum-class',
      'vector',
      'array',
      'span',
      'ranges',
      'deque',
      'pair',
      'tuple',
      'optional',
      'map',
      'unordered-map',
      'set',
      'exceptions',
      'expected',
    ]);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.standard).toBe('c++23');
      expect(lesson.completion).toBe('practice');
      expect(lesson.effectivePrerequisites).toContain('algo-dfs');
      if (i) {
        expect(lesson.previousLessonId).toBe(lessons[i - 1]!.id);
        expect(lesson.prerequisites).toEqual([lessons[i - 1]!.id]);
      } else expect(lesson.prerequisites).toEqual([]);
    }
  });

  it('соответствует стандарту урока и проверен в sandbox на GCC и Clang с ASan/UBSan', () => {
    for (const lesson of lessons) {
      const questions = lesson.quiz.questions;
      expect(questions.length, lesson.id).toBeGreaterThanOrEqual(8);
      expect(questions.some((q) => q.type === 'text')).toBe(true);
      expect(lesson.body, lesson.id).toMatch(/^## Частые ошибки/m);
      expect(lesson.body, lesson.id).toMatch(/^## Итоги/m);
      expect(lesson.body, lesson.id).toMatch(/```cpp\n/);
      expect(lesson.body, lesson.id).not.toMatch(
        /Цели обучения|Ментальная модель|Стоимость и ограничения|Краткое резюме/,
      );
      const exercises = [lesson.exercise, ...lesson.additionalExercises];
      expect(exercises.length, lesson.id).toBeGreaterThanOrEqual(4);
      for (const exercise of exercises) {
        const tests = [...exercise.publicTests, ...exercise.hiddenTests];
        expect(exercise.language, exercise.id).toBe('cpp');
        expect(exercise.standard, exercise.id).toBe('c++23');
        expect(tests.length, exercise.id).toBeGreaterThanOrEqual(8);
        expect(tests.length, exercise.id).toBeLessThanOrEqual(12);
        expect(exercise.hints.length, exercise.id).toBeGreaterThanOrEqual(2);
        expect(exercise.diagnostics, exercise.id).toBe('sanitizers');
        expect(exercise.solutionExplanation.length, exercise.id).toBeGreaterThan(100);
        expect(report.exercises[exercise.id], exercise.id).toMatchObject({
          gcc: true,
          clang: true,
        });
      }
    }
  });

  it('проверяет задания «Найди ошибку» отрицательными контролями', () => {
    const bugs = lessons.flatMap((lesson) =>
      [lesson.exercise, ...lesson.additionalExercises].filter((e) =>
        e.title.startsWith('Найди ошибку'),
      ),
    );
    expect(bugs).toHaveLength(27);
    for (const exercise of bugs) {
      expect(exercise.starterCode, exercise.id).not.toBe(exercise.referenceSolution);
      expect(report.exercises[exercise.id]?.bugDetected, exercise.id).toBe(true);
    }
  });

  it('индексирует задачи и не публикует скрытые тесты и решения', () => {
    for (const lesson of lessons) {
      const published = toPublicLesson(lesson);
      for (const exercise of [lesson.exercise, ...lesson.additionalExercises]) {
        expect(searchCourseItems(exercise.title, loaded)).toContainEqual(
          expect.objectContaining({ kind: 'exercise', id: exercise.id }),
        );
        expect(published.body).not.toContain(exercise.referenceSolution);
      }
      for (const exercise of [published.exercise, ...published.additionalExercises!]) {
        expect(exercise).not.toHaveProperty('hiddenTests');
        expect(exercise).not.toHaveProperty('referenceSolution');
        expect(exercise).not.toHaveProperty('solutionExplanation');
      }
      for (const question of published.quiz.questions)
        expect(question).not.toHaveProperty('correct');
    }
  });
});
