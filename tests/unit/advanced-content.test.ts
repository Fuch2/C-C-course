import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';

const moduleDir = 'content/cpp-systems/advanced-c';
const loaded = loadCourse();
const lessons = loaded.lessons.filter((lesson) => lesson.moduleId === 'advanced-c');
const report = JSON.parse(readFileSync('docs/verification/lessons.json', 'utf8')) as {
  exercises: Record<string, { gcc: boolean; clang: boolean; bugDetected?: boolean }>;
};
const sourceDirs = readdirSync(moduleDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${moduleDir}/${entry.name}`);

describe('Модуль «Углублённый C»', () => {
  it('содержит 28 последовательных уроков по разделам, собранных из авторских исходников', () => {
    expect(lessons).toHaveLength(28);
    expect(sourceDirs).toHaveLength(28);
    expect(existsSync(`${moduleDir}/examples.json`)).toBe(false);
    for (const dir of sourceDirs) expect(existsSync(`${dir}/lesson.src.mjs`), dir).toBe(true);
    expect(lessons.map((lesson) => lesson.id.replace('advanced-', ''))).toEqual([
      'translation-units',
      'headers',
      'header-guards',
      'static',
      'extern',
      'linkage',
      'preprocessor',
      'define',
      'function-macros',
      'macro-hazards',
      'conditional-compilation',
      'const',
      'function-pointers',
      'callbacks',
      'void-pointer',
      'bitwise-and',
      'bitwise-or',
      'xor',
      'bit-shifts',
      'bit-masks',
      'volatile',
      'registers',
      'file-stream',
      'fread-fwrite',
      'binary-files',
      'errno',
      'error-handling',
      'assertions',
    ]);
    for (const [i, lesson] of lessons.entries()) {
      expect(lesson.order).toBe(i + 1);
      expect(lesson.standard).toBe('c23');
      expect(lesson.effectivePrerequisites).toContain('memory-debugging-memory');
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
      expect(lesson.body, lesson.id).not.toMatch(
        /Цели обучения|Ментальная модель|Разбор выполнения/,
      );
      const exercises = [lesson.exercise, ...lesson.additionalExercises];
      expect(exercises.length, lesson.id).toBeGreaterThanOrEqual(3);
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
    expect(bugs.length).toBeGreaterThanOrEqual(20);
    for (const exercise of bugs) {
      expect(exercise.starterCode, exercise.id).not.toBe(exercise.referenceSolution);
      expect(report.exercises[exercise.id]?.bugDetected, exercise.id).toBe(true);
    }
  });

  it('показывает многофайловые программы блоками с именами файлов', () => {
    expect(loaded.byId.get('advanced-translation-units')!.body).toMatch(/^```c [\w.-]+\.c$/m);
    for (const id of ['advanced-headers', 'advanced-header-guards', 'advanced-extern']) {
      const body = loaded.byId.get(id)!.body;
      expect(body, id).toMatch(/^```c [\w.-]+\.h$/m);
    }
  });

  it('связывает три проекта с практикой уроков и не раскрывает решения', () => {
    const projects = loaded.projects.filter((project) => project.moduleId === 'advanced-c');
    expect(projects).toHaveLength(3);
    expect(projects.map((project) => project.lessonIds[0])).toEqual([
      'advanced-void-pointer',
      'advanced-binary-files',
      'advanced-error-handling',
    ]);
    for (const project of projects) {
      const lesson = loaded.byId.get(project.lessonIds[0]!)!;
      const exercise = lesson.additionalExercises.find((item) => item.title === project.title)!;
      expect(exercise, project.title).toBeDefined();
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

  it('включает сложные регрессии проектов: два типа элементов, файловый ввод и границы', () => {
    const tasks = lessons.flatMap((lesson) => lesson.additionalExercises);
    const vector = tasks.find((task) => task.id === 'advanced-project-vector')!;
    const vectorInputs = [...vector.publicTests, ...vector.hiddenTests].map((t) => t.stdin ?? '');
    expect(vectorInputs.some((input) => input.includes('p push') && input.includes('i push'))).toBe(
      true,
    );
    expect(vectorInputs.some((input) => input.includes('reserve'))).toBe(true);
    const binary = tasks.find((task) => task.id === 'advanced-project-binary-parser')!;
    expect(binary.hiddenTests.some((test) => test.stdin === '5 83 78 1 1 0')).toBe(true);
    const log = tasks.find((task) => task.id === 'advanced-project-measurement-log')!;
    expect(log.hiddenTests.some((test) => test.stdin === '')).toBe(true);
    expect(log.hiddenTests.some((test) => (test.stdin?.length ?? 0) > 127)).toBe(true);
    expect(log.hiddenTests.some((test) => test.stdin?.includes('1e999'))).toBe(true);
  });
});
