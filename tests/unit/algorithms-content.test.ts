import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';

const loaded = loadCourse();
const lessons = loaded.lessons.filter((lesson) => lesson.moduleId === 'algorithms-structures');
describe('Алгоритмы и структуры данных', () => {
  it('загружает последовательность из 28 уроков и связывает её с углублённым C', () => {
    expect(lessons).toHaveLength(28);
    for (const [index, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(index + 1);
      expect(lesson.standard).toBe('c17');
      expect(lesson.completion).toBe('practice');
      expect(lesson.effectivePrerequisites).toContain('advanced-sanitizers');
      if (index) expect(lesson.previousLessonId).toBe(lessons[index - 1]!.id);
      expect(lesson.quiz.questions.length).toBeGreaterThanOrEqual(3);
      for (const heading of [
        'Теория и инвариант',
        'Пошаговый разбор',
        'Сложность и память',
        'Cache locality и компромиссы',
        'Связь со STL C++',
      ])
        expect(lesson.body).toContain(heading);
    }
  });
  it('проверяет именно опубликованные примеры C17 и C++20', () => {
    const examples = JSON.parse(
      readFileSync('content/cpp-systems/algorithms-structures/examples.json', 'utf8'),
    ) as { lessonId: string; standard: string; source: string }[];
    expect(examples).toHaveLength(40);
    for (const lesson of lessons) {
      const snippets = [...lesson.body.matchAll(/```(c|cpp)\n([\s\S]*?)```/g)];
      const registered = examples.filter((example) => example.lessonId === lesson.id);
      expect(registered).toHaveLength(snippets.length);
      for (const snippet of snippets)
        expect(registered).toContainEqual(
          expect.objectContaining({
            standard: snippet[1] === 'c' ? 'c17' : 'c++20',
            source: snippet[2],
          }),
        );
    }
  });
  it('индексирует 31 задачу и не публикует скрытые тесты и решения', () => {
    expect(
      lessons.flatMap((lesson) => [lesson.exercise, ...lesson.additionalExercises]),
    ).toHaveLength(31);
    for (const lesson of lessons) {
      const published = toPublicLesson(lesson);
      for (const exercise of [lesson.exercise, ...lesson.additionalExercises]) {
        expect(exercise.diagnostics).toBe('sanitizers');
        expect(exercise.hiddenTests.length).toBeGreaterThan(0);
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
  it('benchmark-задачи проверяют операции, а не случайный порог времени', () => {
    const tasks = lessons.flatMap((lesson) => lesson.additionalExercises);
    expect(tasks).toHaveLength(3);
    for (const exercise of tasks) {
      expect(exercise.id).toContain('benchmark');
      expect(exercise.referenceSolution).not.toContain('clock(');
      expect(
        [...exercise.publicTests, ...exercise.hiddenTests].some((test) =>
          /^0(?:\s|$)/.test(test.stdin ?? ''),
        ),
      ).toBe(true);
    }
  });
});
