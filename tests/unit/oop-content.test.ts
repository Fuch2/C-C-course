import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';

const moduleDir = 'content/cpp-systems/cpp-oop';
const course = loadCourse();
const lessons = course.lessons.filter((lesson) => lesson.moduleId === 'cpp-oop');
const report = JSON.parse(readFileSync('docs/verification/lessons.json', 'utf8')) as {
  exercises: Record<string, { gcc: boolean; clang: boolean; bugDetected?: boolean }>;
};
const sourceDirs = readdirSync(moduleDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${moduleDir}/${entry.name}`);

describe('Модуль «ООП в C++»', () => {
  it('содержит 28 последовательных уроков C++23 после основ C++', () => {
    expect(lessons).toHaveLength(28);
    expect(sourceDirs).toHaveLength(28);
    expect(existsSync(`${moduleDir}/examples.json`)).toBe(false);
    for (const dir of sourceDirs) expect(existsSync(`${dir}/lesson.src.mjs`), dir).toBe(true);
    expect(course.course.modules.find((m) => m.id === 'cpp-oop')?.prerequisites).toEqual([
      'cpp-fundamentals',
    ]);
    expect(lessons.map((lesson) => lesson.id.replace(/^oop-/, ''))).toEqual([
      'struct',
      'class',
      'constructors',
      'public',
      'private',
      'destructor',
      'this',
      'encapsulation',
      'operators',
      'printing',
      'composition',
      'aggregation',
      'inheritance',
      'public-inheritance',
      'protected',
      'virtual',
      'override',
      'final',
      'pure-virtual',
      'abstract-classes',
      'virtual-destructor',
      'runtime-polymorphism',
      'slicing',
      'interfaces',
      'variant',
      'concepts',
      'solid',
      'composition-vs-inheritance',
    ]);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.standard).toBe('c++23');
      expect(lesson.completion).toBe('practice');
      expect(lesson.prerequisites).toEqual([i ? lessons[i - 1]!.id : 'cpp23-expected']);
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
      expect(lesson.body, lesson.id).toMatch(/^## Частые ошибки/m);
      expect(lesson.body, lesson.id).toMatch(/^## Итоги/m);
      expect(lesson.body, lesson.id).toMatch(/```cpp\n/);
      expect(lesson.body, lesson.id).not.toMatch(/Цели обучения|Разбор и эксперимент|C\+\+20 коде/);
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
    expect(bugs).toHaveLength(28);
    for (const exercise of bugs) {
      expect(exercise.starterCode, exercise.id).not.toBe(exercise.referenceSolution);
      expect(report.exercises[exercise.id]?.bugDetected, exercise.id).toBe(true);
    }
  });

  it('связывает проект с тремя этапами в уроках', () => {
    const projects = course.projects.filter((p) => p.moduleId === 'cpp-oop');
    expect(projects).toHaveLength(1);
    expect(projects[0]?.lessonIds).toEqual([
      'oop-pure-virtual',
      'oop-interfaces',
      'oop-composition-vs-inheritance',
    ]);
    const stages = projects[0]!.lessonIds.map((id) =>
      course.byId.get(id)!.additionalExercises.find((e) => e.id.startsWith('oop-project-')),
    );
    expect(stages.map((s) => s?.id)).toEqual([
      'oop-project-sensors',
      'oop-project-filter',
      'oop-project-telemetry',
    ]);
    expect(searchCourseItems('Система обработки датчиков', course)).toContainEqual(
      expect.objectContaining({ kind: 'exercise', id: 'oop-project-sensors' }),
    );
    expect(stages[2]?.starterCode).toContain('int main()');
    expect(stages[2]?.hiddenTests).toHaveLength(7);
  });

  it('индексирует задачи и не публикует скрытые тесты, ответы и решения', () => {
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
