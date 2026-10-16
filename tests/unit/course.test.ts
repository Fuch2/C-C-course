import { describe, expect, it } from 'vitest';
import { loadCourse, searchCourse, searchCourseItems, toPublicLesson } from '@course/course-engine';
import {
  gradeResults,
  lessonPercent,
  normalizeOutput,
  executionRequestSchema,
} from '@course/shared';

describe('Движок курса', () => {
  const loaded = loadCourse();
  it('загружает оригинальные уроки и разрешает prerequisites', () => {
    expect(loaded.lessons.length).toBe(215);
    expect(loaded.lessons[0]?.prerequisites).toEqual([]);
    expect(loaded.course.modules).toHaveLength(9);
    expect(loaded.course.modules[0]).toMatchObject({
      id: 'start',
      title: 'Старт: первая программа',
    });
    expect(loaded.byId.get('first-program')?.effectivePrerequisites).toContain('how-program-works');
  });
  it('не передаёт скрытые тесты, решения и ключ quiz клиенту', () => {
    const lesson = loaded.lessons[0]!;
    const publicLesson = toPublicLesson(lesson);
    expect(publicLesson.exercise).not.toHaveProperty('referenceSolution');
    expect(publicLesson.exercise).not.toHaveProperty('hiddenTests');
    expect(publicLesson.exercise.publicTests.length).toBeGreaterThan(0);
    expect(publicLesson.exercise.hiddenTestCount).toBeGreaterThan(0);
    expect(publicLesson.quiz.questions[0]).not.toHaveProperty('correct');
    expect(publicLesson.quiz.questions[0]).not.toHaveProperty('explanation');
  });
  it('ищет по теории, не раскрывая эталонный исходник', () => {
    const result = searchCourse('компилятор', loaded);
    expect(result.some((lesson) => lesson.id === 'first-program')).toBe(true);
    expect(result[0]).not.toHaveProperty('exercise');
    expect(searchCourse('   ', loaded)).toEqual([]);
    expect(searchCourse('несуществующий-термин-987', loaded)).toEqual([]);
  });
  it('строит поиск по модулям, разделам и практическим заданиям', () => {
    expect(searchCourseItems('Основы языка C', loaded)[0]).toMatchObject({
      kind: 'module',
      title: 'Основы языка C',
    });
    expect(searchCourseItems('Регистр букв имеет значение', loaded)).toContainEqual(
      expect.objectContaining({
        kind: 'section',
        lessonTitle: 'Первая программа: Hello, world!',
      }),
    );
    expect(searchCourseItems(loaded.lessons[0]!.exercise.title, loaded)).toContainEqual(
      expect.objectContaining({ kind: 'exercise', lessonTitle: loaded.lessons[0]?.title }),
    );
  });
});

describe('Оценивание и контракты', () => {
  it('рассчитывает прогресс по реально выполненным частям', () => {
    expect(lessonPercent()).toBe(0);
    expect(lessonPercent({ read: true, quizPassed: false, practicePassed: false })).toBe(20);
    expect(lessonPercent({ read: true, quizPassed: true, practicePassed: true })).toBe(100);
  });
  it('нормализует конец строк, сохраняя значимые пробелы и порядок', () => {
    expect(normalizeOutput('a  \r\nb\n\n')).toBe('a\nb');
    expect(normalizeOutput(' a')).not.toBe('a');
  });
  it('отклоняет неожиданные поля и стандарты', () => {
    expect(
      executionRequestSchema.safeParse({
        source: 'x',
        compiler: 'gcc',
        standard: 'c17',
        command: 'sh',
      }).success,
    ).toBe(false);
    expect(
      executionRequestSchema.safeParse({ source: 'x', compiler: 'gcc', standard: 'c99' }).success,
    ).toBe(false);
  });
  it('не раскрывает ввод, вывод и диагностику скрытой проверки', () => {
    const run = {
      stdout: 'secret',
      stderr: 'secret',
      status: 'ok' as const,
      exitCode: 0,
      durationMs: 5,
    };
    const exercise = structuredClone(loadCourse().lessons[0]!.exercise);
    exercise.publicTests = [];
    exercise.hiddenTests = [
      { id: 'private-test', name: 'secret name', stdin: 'secret input', expected: 'secret' },
    ];
    const result = gradeResults(exercise, { compilation: run, runs: [run] });
    expect(result[0]?.passed).toBe(true);
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result[0]).not.toHaveProperty('actual');
  });
});
