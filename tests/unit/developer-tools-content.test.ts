import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';

const moduleDir = 'content/cpp-systems/developer-tools';
const loaded = loadCourse();
const lessons = loaded.lessons.filter((l) => l.moduleId === 'developer-tools');
const report = JSON.parse(readFileSync('docs/verification/lessons.json', 'utf8')) as {
  exercises: Record<string, { gcc: boolean; clang: boolean; bugDetected?: boolean }>;
};
const sourceDirs = readdirSync(moduleDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${moduleDir}/${entry.name}`);

describe('Модуль «Инструменты разработчика»', () => {
  it('содержит 13 последовательных уроков от терминала до экосистемы инструментов', () => {
    expect(lessons).toHaveLength(13);
    expect(sourceDirs).toHaveLength(13);
    for (const dir of sourceDirs) expect(existsSync(`${dir}/lesson.src.mjs`), dir).toBe(true);
    expect(lessons.map((l) => l.id)).toEqual([
      'terminal-basics',
      'compilation-stages',
      'toolchain-pipeline',
      'gcc-and-clang',
      'link-errors',
      'project-structure',
      'advanced-makefile',
      'advanced-cmake',
      'advanced-gdb',
      'advanced-lldb',
      'advanced-sanitizers',
      'git-basic-workflow',
      'tooling-ecosystem',
    ]);
    for (const [i, l] of lessons.entries()) {
      expect(l.order).toBe(i + 1);
      expect(l.standard).toBe('c23');
      if (i) {
        expect(l.previousLessonId).toBe(lessons[i - 1]!.id);
        expect(l.prerequisites).toEqual([lessons[i - 1]!.id]);
      } else expect(l.prerequisites).toEqual([]);
      expect(l.effectivePrerequisites).toContain('advanced-assertions');
    }
  });

  it('соответствует стандарту урока и проверен в sandbox на GCC и Clang', () => {
    for (const l of lessons) {
      const questions = l.quiz.questions;
      expect(questions.length, l.id).toBeGreaterThanOrEqual(6);
      expect(questions.some((q) => q.type === 'text')).toBe(true);
      expect(l.body, l.id).toMatch(/^## Частые ошибки/m);
      expect(l.body, l.id).toMatch(/^## Итоги/m);
      expect(l.body, l.id).not.toMatch(/Краткое резюме|Ментальная модель|Цели обучения/);
      const exercises = [l.exercise, ...l.additionalExercises];
      expect(exercises.length, l.id).toBeGreaterThanOrEqual(3);
      for (const e of exercises) {
        const tests = [...e.publicTests, ...e.hiddenTests];
        expect(tests.length, e.id).toBeGreaterThanOrEqual(8);
        expect(tests.length, e.id).toBeLessThanOrEqual(12);
        expect(e.hints.length, e.id).toBeGreaterThanOrEqual(2);
        expect(e.solutionExplanation.length, e.id).toBeGreaterThan(100);
        expect(report.exercises[e.id], e.id).toMatchObject({ gcc: true, clang: true });
      }
    }
  });

  it('проверяет отладку и санитайзеры с диагностикой и отрицательными контролями', () => {
    for (const id of ['advanced-gdb', 'advanced-lldb', 'advanced-sanitizers']) {
      const lesson = lessons.find((l) => l.id === id)!;
      for (const e of [lesson.exercise, ...lesson.additionalExercises])
        expect(e.diagnostics, e.id).toBe('sanitizers');
    }
    const bugs = lessons.flatMap((l) =>
      [l.exercise, ...l.additionalExercises].filter((e) => e.title.startsWith('Найди ошибку')),
    );
    expect(bugs.length).toBeGreaterThanOrEqual(6);
    for (const e of bugs) {
      expect(e.starterCode, e.id).not.toBe(e.referenceSolution);
      expect(report.exercises[e.id]?.bugDetected, e.id).toBe(true);
    }
  });

  it('не раскрывает решения и находит задачи поиском', () => {
    for (const lesson of lessons) {
      const exercise = toPublicLesson(lesson).exercise;
      expect(exercise).not.toHaveProperty('referenceSolution');
      expect(exercise).not.toHaveProperty('hiddenTests');
      expect(exercise.hints[0]).not.toHaveProperty('text');
    }
    expect(searchCourseItems('Что пересоберёт make', loaded)).toContainEqual(
      expect.objectContaining({ kind: 'exercise', id: 'advanced-makefile-task-1' }),
    );
  });
});
