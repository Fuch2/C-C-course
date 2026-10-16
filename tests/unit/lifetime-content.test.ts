import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, toPublicLesson, searchCourseItems } from '@course/course-engine';
const course = loadCourse();
const lessons = course.lessons.filter((l) => l.moduleId === 'cpp-lifetime');
describe('Время жизни и управление ресурсами C++20', () => {
  it('публикует 24 темы с последовательными prerequisites, схемами и примерами', () => {
    expect(lessons).toHaveLength(24);
    expect(course.course.modules.find((m) => m.id === 'cpp-lifetime')?.prerequisites).toEqual([
      'cpp-oop',
    ]);
    const examples = JSON.parse(
      readFileSync('content/cpp-systems/cpp-lifetime/examples.json', 'utf8'),
    ) as { lessonId: string; source: string }[];
    expect(examples).toHaveLength(24);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.effectivePrerequisites).toContain(
        i ? lessons[i - 1]!.id : 'oop-composition-vs-inheritance',
      );
      expect(lesson.body).toContain('<MemoryDiagram');
      expect(lesson.body).toContain('Механика и гарантии');
      expect(lesson.quiz.questions).toHaveLength(3);
      const source = [...lesson.body.matchAll(/```cpp\n([\s\S]*?)```/g)][0]?.[1]?.trim();
      expect(examples.find((e) => e.lessonId === lesson.id)?.source.trim()).toBe(source);
    }
  });
  it('проверяет диагноз и исправление для всех шести категорий', () => {
    const paired = lessons.filter((l) => l.additionalExercises.length);
    expect(paired.map((l) => l.id)).toEqual(
      [
        'scope-lifetime',
        'ownership',
        'shallow-copy',
        'move-constructor',
        'unique-ptr',
        'cyclic-references',
      ].map((s) => `lifetime-${s}`),
    );
    expect(lessons.flatMap((l) => [l.exercise, ...l.additionalExercises])).toHaveLength(30);
    for (const lesson of paired) {
      expect(lesson.exercise.id).toMatch(/-diagnose$/);
      expect(lesson.additionalExercises).toHaveLength(1);
      expect(lesson.additionalExercises[0]!.starterCode).not.toBe(
        lesson.additionalExercises[0]!.referenceSolution,
      );
      expect(lesson.completion).toBe('practice');
      expect(lesson.exercise.description).toContain('Сначала диагностируйте');
      expect(lesson.exercise.hiddenTests).toHaveLength(2);
    }
    expect(
      searchCourseItems('double delete', course).some((e) => e.id.startsWith('lifetime-')),
    ).toBe(true);
  });
  it('сохраняет диагностику доверенной и не публикует решения или ответы', () => {
    for (const lesson of lessons) {
      const published = toPublicLesson(lesson);
      const exercises = [lesson.exercise, ...lesson.additionalExercises];
      for (const exercise of exercises) {
        expect(exercise.diagnostics).toBe('sanitizers');
        expect(exercise.hiddenTests.length).toBeGreaterThan(0);
        expect(published.body).not.toContain(exercise.referenceSolution);
      }
      for (const exercise of [published.exercise, ...(published.additionalExercises ?? [])]) {
        for (const key of ['referenceSolution', 'hiddenTests', 'solutionExplanation'])
          expect(exercise).not.toHaveProperty(key);
      }
      for (const q of published.quiz.questions) {
        expect(q).not.toHaveProperty('correct');
        expect(q).not.toHaveProperty('explanation');
      }
    }
  });
});
