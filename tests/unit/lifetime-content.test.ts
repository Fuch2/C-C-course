import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';

const moduleDir = 'content/cpp-systems/cpp-lifetime';
const course = loadCourse();
const lessons = course.lessons.filter((lesson) => lesson.moduleId === 'cpp-lifetime');
const report = JSON.parse(readFileSync('docs/verification/lessons.json', 'utf8')) as {
  exercises: Record<string, { gcc: boolean; clang: boolean; bugDetected?: boolean }>;
};
const sourceDirs = readdirSync(moduleDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${moduleDir}/${entry.name}`);

describe('Модуль «Время жизни объектов»', () => {
  it('содержит 24 последовательных урока C++23 после ООП', () => {
    expect(lessons).toHaveLength(24);
    expect(sourceDirs).toHaveLength(24);
    expect(existsSync(`${moduleDir}/examples.json`)).toBe(false);
    for (const dir of sourceDirs) expect(existsSync(`${dir}/lesson.src.mjs`), dir).toBe(true);
    expect(course.course.modules.find((m) => m.id === 'cpp-lifetime')?.prerequisites).toEqual([
      'cpp-oop',
    ]);
    expect(lessons.map((lesson) => lesson.id.replace(/^lifetime-/, ''))).toEqual([
      'object-lifetime',
      'scope-lifetime',
      'construction-destruction',
      'raii',
      'ownership',
      'copy-constructor',
      'copy-assignment',
      'shallow-copy',
      'deep-copy',
      'rule-of-three',
      'move-semantics',
      'rvalue-references',
      'std-move',
      'move-constructor',
      'move-assignment',
      'rule-of-five',
      'rule-of-zero',
      'unique-ptr',
      'make-unique',
      'shared-ptr',
      'reference-counting',
      'weak-ptr',
      'cyclic-references',
      'custom-deleters',
    ]);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.standard).toBe('c++23');
      expect(lesson.completion).toBe('practice');
      expect(lesson.prerequisites).toEqual([
        i ? lessons[i - 1]!.id : 'oop-composition-vs-inheritance',
      ]);
    }
  });

  it('соответствует стандарту урока и проверен в sandbox на GCC и Clang с ASan/UBSan', () => {
    for (const lesson of lessons) {
      const questions = lesson.quiz.questions;
      expect(questions.length, lesson.id).toBeGreaterThanOrEqual(8);
      expect(
        questions.some((q) => q.type === 'text'),
        lesson.id,
      ).toBe(true);
      expect(lesson.body, lesson.id).toContain('<MemoryDiagram');
      expect(lesson.body, lesson.id).toMatch(/^## Частые ошибки/m);
      expect(lesson.body, lesson.id).toMatch(/^## Итоги/m);
      expect(lesson.body, lesson.id).toMatch(/```cpp\n/);
      expect(lesson.body, lesson.id).not.toMatch(
        /Механика и гарантии|Модель и назначение|C\+\+20 коде/,
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
    expect(bugs).toHaveLength(24);
    for (const exercise of bugs) {
      expect(exercise.starterCode, exercise.id).not.toBe(exercise.referenceSolution);
      expect(report.exercises[exercise.id]?.bugDetected, exercise.id).toBe(true);
    }
  });

  it('индексирует задачи и не публикует скрытые тесты, ответы и решения', () => {
    expect(
      searchCourseItems('двойное освобождение', course).some((item) =>
        item.id.startsWith('lifetime-'),
      ),
    ).toBe(true);
    for (const lesson of lessons) {
      const published = toPublicLesson(lesson);
      for (const exercise of [lesson.exercise, ...lesson.additionalExercises]) {
        expect(searchCourseItems(exercise.title, course)).toContainEqual(
          expect.objectContaining({ kind: 'exercise', id: exercise.id }),
        );
        expect(published.body).not.toContain(exercise.referenceSolution);
      }
      for (const exercise of [published.exercise, ...published.additionalExercises!]) {
        expect(exercise).not.toHaveProperty('hiddenTests');
        expect(exercise).not.toHaveProperty('referenceSolution');
        expect(exercise).not.toHaveProperty('solutionExplanation');
      }
      for (const question of published.quiz.questions) {
        expect(question).not.toHaveProperty('correct');
        expect(question).not.toHaveProperty('explanation');
      }
    }
  });
});
