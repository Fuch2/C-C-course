import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';
const loaded = loadCourse();
const lessons = loaded.lessons.filter((lesson) => lesson.moduleId === 'advanced-c');
describe('Углублённый C', () => {
  it('публикует 28 последовательных уроков C17 с практикой и проверенными примерами', () => {
    expect(lessons).toHaveLength(28);
    const examples = JSON.parse(
      readFileSync('content/cpp-systems/advanced-c/examples.json', 'utf8'),
    ) as { lessonId: string; source: string }[];
    expect(examples).toHaveLength(28);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.standard).toBe('c17');
      expect(lesson.quiz.questions.length).toBeGreaterThanOrEqual(3);
      expect(lesson.effectivePrerequisites).toContain('memory-debugging-memory');
      if (i) expect(lesson.previousLessonId).toBe(lessons[i - 1]!.id);
      const source = [...lesson.body.matchAll(/```c\n([\s\S]*?)```/g)][0]?.[1]?.trim();
      expect(examples.find((example) => example.lessonId === lesson.id)?.source.trim()).toBe(
        source,
      );
      for (const exercise of [lesson.exercise, ...lesson.additionalExercises]) {
        expect(exercise.diagnostics).toBe('sanitizers');
        expect(exercise.hiddenTests.length).toBeGreaterThan(0);
        expect(exercise.hints.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
  it('связывает три проекта с отдельной практикой и не раскрывает решения', () => {
    const projects = loaded.projects.filter((project) => project.moduleId === 'advanced-c');
    expect(projects).toHaveLength(3);
    for (const project of projects) {
      const lesson = loaded.byId.get(project.lessonIds[0]!)!;
      const exercise = lesson.additionalExercises.find((item) => item.title === project.title)!;
      expect(exercise).toBeDefined();
      expect(exercise.publicTests).toHaveLength(2);
      expect(exercise.hiddenTests.length).toBeGreaterThanOrEqual(4);
      expect(searchCourseItems(project.title, loaded)).toContainEqual(
        expect.objectContaining({ kind: 'exercise', id: exercise.id }),
      );
      const published = toPublicLesson(lesson);
      const publicExercise = published.additionalExercises!.find(
        (item) => item.id === exercise.id,
      )!;
      expect(publicExercise).not.toHaveProperty('hiddenTests');
      expect(publicExercise).not.toHaveProperty('referenceSolution');
      expect(publicExercise).not.toHaveProperty('solutionExplanation');
      expect(published.body).not.toContain(exercise.referenceSolution);
    }
  });
  it('включает сложные регрессии файлового ввода и роста массива', () => {
    const tasks = lessons.flatMap((lesson) => lesson.additionalExercises);
    const vector = tasks.find((task) => task.id === 'advanced-project-vector')!;
    expect(vector.hiddenTests.some((test) => test.stdin?.includes('c\n'))).toBe(true);
    const binary = tasks.find((task) => task.id === 'advanced-project-binary-parser')!;
    expect(binary.hiddenTests.some((test) => test.stdin === '5 83 78 1 1 0')).toBe(true);
    const log = tasks.find((task) => task.id === 'advanced-project-measurement-log')!;
    expect(log.hiddenTests.some((test) => test.stdin === '')).toBe(true);
    expect(log.hiddenTests.some((test) => (test.stdin?.length ?? 0) > 127)).toBe(true);
    expect(log.hiddenTests.some((test) => test.stdin?.includes('1e999'))).toBe(true);
  });
});
