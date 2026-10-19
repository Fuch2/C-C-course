import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';
import { exerciseStorageKey, lessonSchema } from '@course/shared';
const loaded = loadCourse();
const lessons = loaded.lessons.filter((l) => l.moduleId === 'c-fundamentals');
/** Переработанные модули, которые обязаны соответствовать стандарту урока. */
const reworked = loaded.lessons.filter((l) => ['start', 'c-fundamentals'].includes(l.moduleId));
const report = JSON.parse(readFileSync('docs/verification/lessons.json', 'utf8')) as {
  exercises: Record<string, { gcc: boolean; clang: boolean }>;
};
const directory = (id: string) =>
  `content/cpp-systems/c-fundamentals/${id.replace(/^c17-/, '')}/lesson.src.mjs`;
describe('Модуль «Основы языка C»', () => {
  it('содержит 45 последовательных уроков с шестью практикумами', () => {
    expect(lessons).toHaveLength(45);
    for (const [i, l] of lessons.entries()) {
      expect(l.order).toBe(i + 1);
      expect(l.standard).toBe('c23');
      if (i > 0) {
        expect(l.previousLessonId).toBe(lessons[i - 1]!.id);
        expect(l.prerequisites).toEqual([lessons[i - 1]!.id]);
      }
    }
    expect(lessons.filter((l) => l.id.startsWith('c17-practice-')).map((l) => l.order)).toEqual([
      11, 16, 22, 28, 34, 45,
    ]);
    expect(lessons.at(-1)!.id).toBe('c17-practice-final');
  });
  it('собран из авторских исходников и проверен в sandbox на GCC и Clang', () => {
    for (const l of lessons) {
      expect(existsSync(directory(l.id)), l.id).toBe(true);
      for (const e of [l.exercise, ...l.additionalExercises]) {
        expect(report.exercises[e.id], e.id).toMatchObject({ gcc: true, clang: true });
      }
    }
  });
  it('соответствует стандарту урока: 6+ вопросов, 3+ задачи, 8–12 тестов, 2+ подсказки', () => {
    for (const l of reworked) {
      const questions = l.quiz.questions;
      expect(questions.length, l.id).toBeGreaterThanOrEqual(6);
      expect(
        questions.some((q) => q.type === 'text'),
        l.id,
      ).toBe(true);
      const exercises = [l.exercise, ...l.additionalExercises];
      expect(exercises.length, l.id).toBeGreaterThanOrEqual(3);
      for (const e of exercises) {
        const tests = [...e.publicTests, ...e.hiddenTests];
        // Задачи без ввода (фиксированный вывод) проверяются одним-двумя запусками.
        const readsInput = tests.some((t) => t.arguments || (t.stdin ?? '').trim() !== '');
        expect(e.hints.length, e.id).toBeGreaterThanOrEqual(2);
        expect(e.publicTests.length, e.id).toBeGreaterThanOrEqual(1);
        expect(e.hiddenTests.length, e.id).toBeGreaterThanOrEqual(1);
        expect(tests.length, e.id).toBeLessThanOrEqual(12);
        if (readsInput) expect(tests.length, e.id).toBeGreaterThanOrEqual(8);
        expect(e.solutionExplanation.length, e.id).toBeGreaterThan(100);
      }
    }
  });
  it('не содержит шаблонных разделов прежней версии', () => {
    for (const l of lessons) {
      expect(l.body, l.id).toMatch(/^## Итоги/m);
      expect(l.body, l.id).not.toMatch(/Как проверить своё объяснение|Краткое резюме/);
      expect(l.body, l.id).not.toMatch(/#include <stddef\.h>\n#include <limits\.h>/);
    }
  });
  it('не раскрывает секреты дополнительных заданий и индексирует их', () => {
    const l = lessons[0]!;
    const e = l.additionalExercises[0]!;
    const publicExercise = toPublicLesson(l).additionalExercises![0]!;
    for (const key of ['hiddenTests', 'referenceSolution', 'solutionExplanation'])
      expect(publicExercise).not.toHaveProperty(key);
    expect(publicExercise.hints[0]).not.toHaveProperty('text');
    expect(searchCourseItems(e.title, loaded)).toContainEqual(
      expect.objectContaining({
        kind: 'exercise',
        href: `/lesson/${l.id}?part=practice&exercise=${e.id}`,
      }),
    );
  });
  it('разделяет ключи хранения без изменения первичного задания', () => {
    expect(exerciseStorageKey('lesson', 'first', 'first')).toBe('lesson');
    expect(exerciseStorageKey('lesson', 'first', 'second')).toBe('lesson:second');
  });
  it('отклоняет дополнительное задание с несовместимым стандартом', () => {
    const data = JSON.parse(
      readFileSync('content/cpp-systems/c-fundamentals/structure/lesson.json', 'utf8'),
    );
    data.additionalExercises[0].standard = 'c11';
    expect(lessonSchema.safeParse(data).success).toBe(false);
  });
});
