import { describe, expect, it } from 'vitest';
import {
  buildSubmissionSource,
  codingExerciseSchema,
  gradeResults,
  isQuizAnswerCorrect,
  normalizeTextAnswer,
  quizQuestionSchema,
  testInput,
  type CodingExercise,
} from '@course/shared';

const process = (stdout: string, status: 'ok' | 'runtime_error' = 'ok') => ({
  stdout,
  stderr: '',
  status,
  exitCode: status === 'ok' ? 0 : 1,
  durationMs: 3,
});
function exercise(overrides: Partial<CodingExercise>): CodingExercise {
  return codingExerciseSchema.parse({
    id: 'fixture',
    title: 'Задача',
    description: 'Условие',
    difficulty: 'beginner',
    starterCode: 'int main(void) { return 0; }\n',
    language: 'c',
    standard: 'c17',
    compiler: 'gcc',
    examples: [{ input: '1 2', output: '3\n' }],
    constraints: ['Ограничение'],
    hints: [],
    publicTests: [{ id: 'p1', name: 'Пример', stdin: '1 2', expected: '3\n' }],
    hiddenTests: [
      { id: 'h1', name: 'Скрытый 1', stdin: 'секрет-1', expected: '7\n' },
      { id: 'h2', name: 'Скрытый 2', stdin: 'секрет-2', expected: '9\n' },
    ],
    referenceSolution: 'int main(void) { return 0; }\n',
    solutionExplanation: 'Разбор',
    checking: { type: 'stdout', comparison: 'exact' },
    ...overrides,
  });
}
const runsFor = (value: CodingExercise, map: (expected: string) => string) => ({
  compilation: process(''),
  runs: [...value.publicTests, ...value.hiddenTests].map((test) => process(map(test.expected))),
});

describe('Grading практических задач', () => {
  it('различает exact stdout и trimmed stdout', () => {
    const exact = exercise({});
    expect(
      gradeResults(
        exact,
        runsFor(exact, (e) => e.trimEnd()),
      )[0]?.passed,
    ).toBe(false);
    expect(
      gradeResults(
        exact,
        runsFor(exact, (e) => e),
      ).every((t) => t.passed),
    ).toBe(true);
    const trimmed = exercise({ checking: { type: 'stdout', comparison: 'trimmed' } });
    expect(
      gradeResults(
        trimmed,
        runsFor(trimmed, (e) => `  ${e.trim()}  \n`),
      ).every((t) => t.passed),
    ).toBe(false);
    expect(
      gradeResults(
        trimmed,
        runsFor(trimmed, (e) => `${e.trim()}   \n\n`),
      ).every((t) => t.passed),
    ).toBe(true);
  });

  it('сравнивает custom unordered-lines без зависимости от порядка', () => {
    const value = exercise({
      checking: { type: 'custom', checker: 'unordered-lines' },
      publicTests: [{ id: 'p1', name: 'Пример', stdin: 'x', expected: 'a\nb\nc\n' }],
    });
    const runs = runsFor(value, (e) => e.trimEnd().split('\n').reverse().join('\n') + '\n');
    expect(gradeResults(value, runs).every((t) => t.passed)).toBe(true);
  });

  it('создаёт harness функции и переводит arguments в stdin', () => {
    const value = exercise({
      checking: {
        type: 'function',
        functionName: 'clamp_value',
        returnType: 'int',
        parameters: [
          { name: 'value', type: 'int' },
          { name: 'low', type: 'int' },
          { name: 'high', type: 'int' },
        ],
      },
      publicTests: [{ id: 'p1', name: 'Пример', arguments: [4, 0, 10], expected: '4\n' }],
      hiddenTests: [{ id: 'h1', name: 'Скрытый', arguments: [-3, 0, 10], expected: '0\n' }],
    });
    const source = buildSubmissionSource(value, 'int clamp_value(int v, int l, int h);');
    expect(source).toContain('int main(void)');
    expect(source).toContain('clamp_value(value, low, high)');
    expect(testInput(value.publicTests[0]!)).toBe('4 0 10\n');
  });

  it('не включает данные скрытых тестов в результат', () => {
    const value = exercise({});
    const results = gradeResults(
      value,
      runsFor(value, (e) => e),
    );
    const hidden = results.filter((test) => test.hidden);
    expect(hidden.map((test) => test.hiddenIndex)).toEqual([1, 2]);
    expect(JSON.stringify(hidden)).not.toContain('секрет-1');
    expect(
      hidden.every((test) => !('stdin' in test) && !('expected' in test) && !('actual' in test)),
    ).toBe(true);
  });

  it('ограничивает задачу двенадцатью тестами — лимитом sandbox', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `h${i}`,
      name: `Скрытый ${i}`,
      stdin: String(i),
      expected: '\n',
    }));
    expect(() => exercise({ hiddenTests: many })).toThrow();
    expect(() => exercise({ hiddenTests: many.slice(0, 11) })).not.toThrow();
  });
});

describe('Проверка ответов quiz', () => {
  const single = quizQuestionSchema.parse({
    id: 'q1',
    question: 'Вопрос',
    options: ['a', 'b'],
    correct: 1,
    explanation: 'Объяснение',
  });
  const multiple = quizQuestionSchema.parse({
    id: 'q2',
    type: 'multiple',
    question: 'Вопрос',
    options: ['a', 'b', 'c'],
    correct: [0, 2],
    explanation: 'Объяснение',
  });
  const text = quizQuestionSchema.parse({
    id: 'q3',
    type: 'text',
    question: 'Что выведет программа?',
    code: 'int main(void) { return 0; }',
    answers: ['14 10'],
    explanation: 'Объяснение',
  });

  it('проверяет один вариант', () => {
    expect(isQuizAnswerCorrect(single, 1)).toBe(true);
    expect(isQuizAnswerCorrect(single, 0)).toBe(false);
    expect(isQuizAnswerCorrect(single, [1])).toBe(false);
  });
  it('требует точный набор вариантов независимо от порядка', () => {
    expect(isQuizAnswerCorrect(multiple, [2, 0])).toBe(true);
    expect(isQuizAnswerCorrect(multiple, [0])).toBe(false);
    expect(isQuizAnswerCorrect(multiple, [0, 1, 2])).toBe(false);
  });
  it('нормализует свободный ответ', () => {
    expect(isQuizAnswerCorrect(text, '  14   10 \n')).toBe(true);
    expect(isQuizAnswerCorrect(text, '1410')).toBe(false);
    expect(normalizeTextAnswer('Ёлка\r\nДА ')).toBe('елка\nда');
  });
  it('отклоняет неверные индексы правильных ответов', () => {
    expect(quizQuestionSchema.safeParse({ ...multiple, correct: [0, 5] }).success).toBe(false);
  });
});
