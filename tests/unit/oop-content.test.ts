import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';
const course = loadCourse();
const lessons = course.lessons.filter((l) => l.moduleId === 'cpp-oop');
describe('Практический модуль ООП C++20', () => {
  it('публикует 24 последовательных урока после основ C++', () => {
    expect(lessons).toHaveLength(24);
    expect(course.course.modules.find((m) => m.id === 'cpp-oop')?.prerequisites).toEqual([
      'cpp-fundamentals',
    ]);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.effectivePrerequisites).toContain(i ? lessons[i - 1]!.id : 'cpp20-exceptions');
      expect(lesson.standard).toBe('c++20');
      expect(lesson.completion).toBe('practice');
      expect(lesson.quiz.questions).toHaveLength(3);
      expect(lesson.body).toContain('Разбор и эксперимент');
    }
  });
  it('проверяет ровно те примеры, которые опубликованы в MDX', () => {
    const examples = JSON.parse(
      readFileSync('content/cpp-systems/cpp-oop/examples.json', 'utf8'),
    ) as { lessonId: string; source: string }[];
    expect(examples).toHaveLength(24);
    for (const lesson of lessons) {
      const source = [...lesson.body.matchAll(/```cpp\n([\s\S]*?)```/g)][0]?.[1]?.trim();
      expect(source).toBeTruthy();
      expect(examples.find((e) => e.lessonId === lesson.id)?.source.trim()).toBe(source);
    }
  });
  it('связывает проект с тремя выполнимыми этапами', () => {
    const projects = course.projects.filter((p) => p.moduleId === 'cpp-oop');
    expect(projects).toHaveLength(1);
    expect(projects[0]?.lessonIds).toEqual([
      'oop-pure-virtual',
      'oop-interfaces',
      'oop-composition-vs-inheritance',
    ]);
    const stages = lessons.flatMap((l) => l.additionalExercises);
    expect(stages.map((s) => s.id)).toEqual([
      'oop-project-sensors',
      'oop-project-filter',
      'oop-project-telemetry',
    ]);
    expect(searchCourseItems('Система обработки датчиков', course)).toContainEqual(
      expect.objectContaining({ kind: 'exercise', id: 'oop-project-telemetry' }),
    );
    expect(stages[2]?.starterCode).toContain('int main()');
    expect(stages[2]?.hiddenTests).toHaveLength(7);
  });
  it('не раскрывает скрытые тесты, ответы и решения 27 упражнений', () => {
    expect(lessons.flatMap((l) => [l.exercise, ...l.additionalExercises])).toHaveLength(27);
    for (const lesson of lessons) {
      const publicLesson = toPublicLesson(lesson);
      const publicExercises = [publicLesson.exercise, ...(publicLesson.additionalExercises ?? [])];
      for (const exercise of [lesson.exercise, ...lesson.additionalExercises]) {
        expect(exercise.diagnostics).toBe('sanitizers');
        expect(exercise.hiddenTests.length).toBeGreaterThan(0);
        const published = publicExercises.find((e) => e.id === exercise.id)!;
        expect(published).toBeDefined();
        for (const key of ['hiddenTests', 'referenceSolution', 'solutionExplanation'])
          expect(published).not.toHaveProperty(key);
        expect(publicLesson.body).not.toContain(exercise.referenceSolution);
      }
      for (const question of publicLesson.quiz.questions) {
        expect(question).not.toHaveProperty('correct');
        expect(question).not.toHaveProperty('explanation');
      }
    }
  });
});
