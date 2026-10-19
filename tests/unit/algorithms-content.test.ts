import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';

const moduleDir = 'content/cpp-systems/algorithms-structures';
const loaded = loadCourse();
const lessons = loaded.lessons.filter((lesson) => lesson.moduleId === 'algorithms-structures');
const report = JSON.parse(readFileSync('docs/verification/lessons.json', 'utf8')) as {
  exercises: Record<string, { gcc: boolean; clang: boolean; bugDetected?: boolean }>;
};
const sourceDirs = readdirSync(moduleDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${moduleDir}/${entry.name}`);

describe('Модуль «Алгоритмы и структуры данных»', () => {
  it('содержит 28 последовательных уроков по разделам, собранных из авторских исходников', () => {
    expect(lessons).toHaveLength(28);
    expect(sourceDirs).toHaveLength(28);
    expect(existsSync(`${moduleDir}/examples.json`)).toBe(false);
    for (const dir of sourceDirs) expect(existsSync(`${dir}/lesson.src.mjs`), dir).toBe(true);
    expect(lessons.map((lesson) => lesson.id.replace('algo-', ''))).toEqual([
      'algorithm',
      'time-complexity',
      'big-o',
      'constant',
      'linear-time',
      'logarithmic',
      'quadratic',
      'linear-search',
      'binary-search',
      'bubble',
      'selection',
      'insertion',
      'recursion',
      'merge',
      'quick',
      'vector',
      'list',
      'doubly',
      'stack',
      'queue',
      'ring',
      'hash',
      'tree',
      'bst',
      'heap',
      'graph',
      'bfs',
      'dfs',
    ]);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.standard).toBe('c23');
      expect(lesson.completion).toBe('practice');
      expect(lesson.effectivePrerequisites).toContain('git-basic-workflow');
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
      expect(lesson.body, lesson.id).toMatch(/```c\n/);
      expect(lesson.body, lesson.id).not.toMatch(
        /Цели обучения|Ментальная модель|Теория и инвариант|Краткое резюме/,
      );
      const exercises = [lesson.exercise, ...lesson.additionalExercises];
      expect(exercises.length, lesson.id).toBeGreaterThanOrEqual(4);
      for (const exercise of exercises) {
        const tests = [...exercise.publicTests, ...exercise.hiddenTests];
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

  it('benchmark-задачи считают операции, а не измеряют время', () => {
    const tasks = lessons.flatMap((lesson) =>
      [lesson.exercise, ...lesson.additionalExercises].filter((e) => e.id.includes('benchmark')),
    );
    expect(tasks.map((task) => task.id).sort()).toEqual([
      'algo-binary-search-benchmark',
      'algo-insertion-benchmark',
      'algo-vector-benchmark',
    ]);
    for (const exercise of tasks) {
      expect(exercise.referenceSolution).not.toMatch(/clock\(|time\(/);
      expect(
        [...exercise.publicTests, ...exercise.hiddenTests].some((test) =>
          /^(?:\w+ )?0(?:\s|$)/m.test(test.stdin ?? ''),
        ),
        exercise.id,
      ).toBe(true);
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
