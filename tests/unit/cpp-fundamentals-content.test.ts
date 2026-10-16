import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';
const loaded = loadCourse();
const lessons = loaded.lessons.filter((lesson) => lesson.moduleId === 'cpp-fundamentals');
describe('Основы C++', () => {
  it('содержит 21 последовательный урок C++20 после алгоритмов', () => {
    expect(lessons).toHaveLength(21);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.standard).toBe('c++20');
      expect(lesson.effectivePrerequisites).toContain(
        i ? lessons[i - 1]!.id : 'advanced-sanitizers',
      );
      expect(lesson.body).toContain('Сравнение с C');
      expect(lesson.body).toContain('Стоимость и ограничения');
      expect(lesson.quiz.questions.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('проверяет задачи и не раскрывает решения клиенту', () => {
    const examples = JSON.parse(
      readFileSync('content/cpp-systems/cpp-fundamentals/examples.json', 'utf8'),
    ) as { lessonId: string; standard: string }[];
    expect(examples).toHaveLength(21);
    for (const lesson of lessons) {
      const ex = lesson.exercise;
      expect(ex.language).toBe('cpp');
      expect(ex.standard).toBe('c++20');
      expect(ex.hiddenTests.length).toBeGreaterThan(0);
      expect(searchCourseItems(ex.title, loaded)).toContainEqual(
        expect.objectContaining({ kind: 'exercise', id: ex.id }),
      );
      const pub = toPublicLesson(lesson);
      expect(pub.exercise).not.toHaveProperty('referenceSolution');
      expect(pub.exercise).not.toHaveProperty('hiddenTests');
      expect(pub.body).not.toContain(ex.referenceSolution);
    }
  });
});
