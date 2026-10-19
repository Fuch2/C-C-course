import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, toPublicLesson, searchCourseItems } from '@course/course-engine';
import { sandboxRequestSchema, submissionSchema } from '@course/shared';

const moduleDir = 'content/cpp-systems/memory-pointers';
const loaded = loadCourse();
const lessons = loaded.lessons.filter((l) => l.moduleId === 'memory-pointers');
const report = JSON.parse(readFileSync('docs/verification/lessons.json', 'utf8')) as {
  exercises: Record<string, { gcc: boolean; clang: boolean; bugDetected?: boolean }>;
};
const sourceDirs = readdirSync(moduleDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${moduleDir}/${entry.name}`);

describe('Модуль «Память и указатели в C»', () => {
  it('содержит 28 последовательных уроков, собранных из авторских исходников', () => {
    expect(lessons).toHaveLength(28);
    expect(sourceDirs).toHaveLength(28);
    expect(existsSync(`${moduleDir}/examples.json`)).toBe(false);
    for (const dir of sourceDirs) expect(existsSync(`${dir}/lesson.src.mjs`), dir).toBe(true);
    for (const [i, l] of lessons.entries()) {
      expect(l.order).toBe(i + 1);
      expect(l.standard).toBe('c23');
      if (i) {
        expect(l.previousLessonId).toBe(lessons[i - 1]!.id);
        expect(l.prerequisites).toEqual([lessons[i - 1]!.id]);
      }
      expect(l.effectivePrerequisites).toContain('c17-practice-final');
    }
    expect(lessons.at(-1)!.id).toBe('memory-debugging-memory');
  });

  it('соответствует стандарту урока и проверен в sandbox на GCC и Clang с ASan/UBSan', () => {
    for (const l of lessons) {
      const questions = l.quiz.questions;
      expect(questions.length, l.id).toBeGreaterThanOrEqual(6);
      expect(questions.some((q) => q.type === 'text')).toBe(true);
      expect(l.body, l.id).toMatch(/^## Итоги/m);
      expect(l.body, l.id).not.toMatch(/Краткое резюме|условные метки объектов/);
      const exercises = [l.exercise, ...l.additionalExercises];
      expect(exercises.length, l.id).toBeGreaterThanOrEqual(3);
      for (const e of exercises) {
        const tests = [...e.publicTests, ...e.hiddenTests];
        expect(tests.length, e.id).toBeGreaterThanOrEqual(8);
        expect(tests.length, e.id).toBeLessThanOrEqual(12);
        expect(e.hints.length, e.id).toBeGreaterThanOrEqual(2);
        expect(e.diagnostics, e.id).toMatch(/^(sanitizers|valgrind)$/);
        expect(report.exercises[e.id], e.id).toMatchObject({ gcc: true, clang: true });
      }
    }
  });

  it('проверяет задания «Найди ошибку» отрицательными контролями', () => {
    const bugs = lessons.flatMap((l) =>
      [l.exercise, ...l.additionalExercises].filter((e) => e.title.startsWith('Найди ошибку')),
    );
    expect(bugs.length).toBeGreaterThanOrEqual(30);
    for (const e of bugs) {
      expect(e.starterCode, e.id).not.toBe(e.referenceSolution);
      expect(report.exercises[e.id]?.bugDetected, e.id).toBe(true);
    }
    const valgrind = lessons.find((l) => l.id === 'memory-valgrind')!;
    for (const e of [valgrind.exercise, ...valgrind.additionalExercises])
      expect(e.diagnostics).toBe('valgrind');
  });

  it('сохраняет секреты упражнений и находит задания на поиск ошибок', () => {
    for (const lesson of lessons) {
      const exercise = toPublicLesson(lesson).exercise;
      expect(exercise).not.toHaveProperty('referenceSolution');
      expect(exercise).not.toHaveProperty('hiddenTests');
      expect(exercise.hints[0]).not.toHaveProperty('text');
    }
    expect(searchCourseItems('утечка в обработчике', loaded)).toContainEqual(
      expect.objectContaining({ kind: 'exercise', id: 'memory-memory-leak-task-1' }),
    );
  });

  it('разрешает только фиксированный режим внутреннего запроса и запрещает его ученику', () => {
    const base = {
      source: 'int main(void){return 0;}',
      standard: 'c23',
      compiler: 'clang',
      stdin: '',
    };
    expect(
      sandboxRequestSchema.safeParse({ ...base, cases: [{ stdin: '' }], diagnostics: 'sanitizers' })
        .success,
    ).toBe(true);
    expect(
      sandboxRequestSchema.safeParse({
        ...base,
        cases: [{ stdin: '' }],
        diagnostics: '-fplugin=evil',
      }).success,
    ).toBe(false);
    expect(
      submissionSchema.safeParse({ ...base, mode: 'check', diagnostics: 'none' }).success,
    ).toBe(false);
  });
});
