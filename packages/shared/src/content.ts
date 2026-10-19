import { z } from 'zod';
import type { Root } from 'hast';

export const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
export const standardSchema = z.enum(['c11', 'c17', 'c23', 'c++17', 'c++20', 'c++23']);
export const compilerSchema = z.enum(['gcc', 'clang']);
const text = z.string().trim().min(1);
const ids = z.array(idSchema).refine((v) => new Set(v).size === v.length, 'Повтор идентификатора');
export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const difficultyLabels = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
} as const;
export const hintSchema = z.strictObject({
  id: idSchema,
  text,
  order: z.number().int().nonnegative(),
});
const scalarSchema = z.union([z.string().max(4096), z.number().finite(), z.boolean()]);
export const testCaseSchema = z
  .strictObject({
    id: idSchema,
    name: text,
    stdin: z.string().max(16_384).optional(),
    arguments: z.array(scalarSchema).max(8).optional(),
    expected: z.string().max(32_768),
  })
  .refine(
    (value) => (value.stdin === undefined) !== (value.arguments === undefined),
    'У теста должно быть ровно одно из полей stdin или arguments',
  );
export const exampleSchema = z.strictObject({
  input: z.string().max(16_384),
  output: z.string().max(32_768),
  explanation: z.string().trim().min(1).optional(),
});
const functionTypeSchema = z.enum(['int', 'long_long', 'double', 'bool']);
export const checkingSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('stdout'), comparison: z.enum(['exact', 'trimmed']) }),
  z.strictObject({
    type: z.literal('function'),
    functionName: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    returnType: functionTypeSchema,
    parameters: z
      .array(
        z.strictObject({
          name: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
          type: functionTypeSchema,
        }),
      )
      .min(1)
      .max(8),
  }),
  z
    .strictObject({
      type: z.literal('custom'),
      checker: z.enum(['unordered-lines', 'floating-point']),
      tolerance: z.number().positive().max(1).optional(),
    })
    .refine(
      (value) =>
        value.checker === 'floating-point'
          ? value.tolerance !== undefined
          : value.tolerance === undefined,
      'tolerance требуется только для floating-point',
    ),
]);
/** Фрагмент кода, который показывается вместе с вопросом. */
const questionCode = z.string().min(1).max(4096).optional();
const questionCodeLanguage = z.enum(['c', 'cpp', 'text']).optional();
const singleQuestionSchema = z
  .strictObject({
    id: idSchema,
    type: z.literal('single').optional(),
    question: text,
    code: questionCode,
    codeLanguage: questionCodeLanguage,
    options: z.array(text).min(2).max(6),
    correct: z.number().int().nonnegative(),
    explanation: text,
  })
  .refine((v) => v.correct < v.options.length, 'Индекс ответа вне диапазона');
const multipleQuestionSchema = z
  .strictObject({
    id: idSchema,
    type: z.literal('multiple'),
    question: text,
    code: questionCode,
    codeLanguage: questionCodeLanguage,
    options: z.array(text).min(3).max(8),
    correct: z.array(z.number().int().nonnegative()).min(1),
    explanation: text,
  })
  .refine(
    (v) => v.correct.every((index) => index < v.options.length),
    'Индекс ответа вне диапазона',
  )
  .refine((v) => new Set(v.correct).size === v.correct.length, 'Повтор правильного ответа');
const textQuestionSchema = z.strictObject({
  id: idSchema,
  type: z.literal('text'),
  question: text,
  code: questionCode,
  codeLanguage: questionCodeLanguage,
  /** Допустимые ответы; сравнение после normalizeTextAnswer. */
  answers: z.array(z.string().trim().min(1).max(500)).min(1).max(12),
  placeholder: z.string().trim().min(1).max(120).optional(),
  explanation: text,
});
export const quizQuestionSchema = z.union([
  singleQuestionSchema,
  multipleQuestionSchema,
  textQuestionSchema,
]);
/** Нормализация свободного ответа: регистр, ё/е, концы строк и повторные пробелы не важны. */
export function normalizeTextAnswer(value: string) {
  return value
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim()
    .toLowerCase()
    .replaceAll('ё', 'е');
}
export type QuizAnswer = number | number[] | string;
export const quizAnswerSchema = z.union([
  z.number().int().nonnegative(),
  z.array(z.number().int().nonnegative()).max(8),
  z.string().max(500),
]);
/** Проверяет один ответ; ответ другого вида считается неверным. */
export function isQuizAnswerCorrect(question: QuizQuestion, answer: QuizAnswer): boolean {
  if (question.type === 'text') {
    if (typeof answer !== 'string') return false;
    const normalized = normalizeTextAnswer(answer);
    return question.answers.some((accepted) => normalizeTextAnswer(accepted) === normalized);
  }
  if (question.type === 'multiple') {
    if (!Array.isArray(answer)) return false;
    const chosen = [...new Set(answer)].sort((a, b) => a - b);
    const expected = [...question.correct].sort((a, b) => a - b);
    return chosen.length === expected.length && chosen.every((value, i) => value === expected[i]);
  }
  return typeof answer === 'number' && answer === question.correct;
}
export function isQuizAnswerShapeValid(question: QuizQuestion, answer: QuizAnswer): boolean {
  if (question.type === 'text') return typeof answer === 'string';
  if (question.type === 'multiple')
    return Array.isArray(answer) && answer.every((index) => index < question.options.length);
  return typeof answer === 'number' && answer < question.options.length;
}
export const quizSchema = z.strictObject({
  id: idSchema,
  title: text,
  questions: z.array(quizQuestionSchema).min(1),
});
export const codingExerciseSchema = z
  .strictObject({
    id: idSchema,
    title: text,
    description: text,
    difficulty: difficultySchema,
    starterCode: z.string().min(1).max(65_536),
    language: z.enum(['c', 'cpp']),
    standard: standardSchema,
    compiler: compilerSchema,
    diagnostics: z.enum(['sanitizers', 'valgrind']).optional(),
    examples: z.array(exampleSchema).min(1).max(8),
    constraints: z.array(text).min(1).max(16),
    hints: z.array(hintSchema),
    publicTests: z.array(testCaseSchema).min(1).max(8),
    hiddenTests: z.array(testCaseSchema).min(1).max(11),
    referenceSolution: z.string().min(1).max(65_536),
    solutionExplanation: text,
    checking: checkingSchema,
  })
  .superRefine((exercise, context) => {
    if ((exercise.language === 'cpp') !== exercise.standard.startsWith('c++'))
      context.addIssue({
        code: 'custom',
        path: ['standard'],
        message: 'Стандарт не соответствует языку задания',
      });
    const tests = [...exercise.publicTests, ...exercise.hiddenTests];
    // Каждый тест запускается в отдельном контейнере; sandbox принимает не больше 12 запусков.
    if (tests.length > 12)
      context.addIssue({
        code: 'custom',
        path: ['hiddenTests'],
        message: 'Всего тестов задания должно быть не больше 12',
      });
    const functionMode = exercise.checking.type === 'function';
    tests.forEach((test, index) => {
      if (functionMode !== (test.arguments !== undefined))
        context.addIssue({
          code: 'custom',
          path: [index < exercise.publicTests.length ? 'publicTests' : 'hiddenTests'],
          message: functionMode ? 'Function test требует arguments' : 'Stdout test требует stdin',
        });
      if (
        functionMode &&
        exercise.checking.type === 'function' &&
        test.arguments?.length !== exercise.checking.parameters.length
      )
        context.addIssue({
          code: 'custom',
          path: ['checking', 'parameters'],
          message: 'Число аргументов теста не совпадает с параметрами функции',
        });
    });
  });
export const lessonSectionSchema = z.strictObject({
  id: text,
  title: text,
  depth: z.number().int().min(1).max(6),
  line: z.number().int().positive(),
});
export const lessonSchema = z
  .strictObject({
    id: idSchema,
    title: text,
    description: text,
    moduleId: idSchema,
    order: z.number().int().nonnegative(),
    difficulty: difficultySchema,
    estimatedMinutes: z.number().int().positive(),
    prerequisites: ids,
    objectives: z.array(text).min(1),
    tags: z.array(text).min(1),
    published: z.boolean().default(true),
    standard: standardSchema,
    completion: z.enum(['reading', 'practice']).default('practice'),
    exercise: codingExerciseSchema,
    additionalExercises: z.array(codingExerciseSchema).max(8).default([]),
    quiz: quizSchema,
  })
  .superRefine((lesson, context) => {
    if (
      [lesson.exercise, ...lesson.additionalExercises].some(
        (exercise) => lesson.standard !== exercise.standard,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['exercise', 'standard'],
        message: 'Стандарт задания должен совпадать со стандартом урока',
      });
  });
export const moduleSchema = z.strictObject({
  id: idSchema,
  title: text,
  description: text,
  order: z.number().int().nonnegative(),
  level: z.enum(['Начальный', 'Средний', 'Продвинутый']),
  icon: text,
  prerequisites: ids,
});
export const courseSchema = z.strictObject({
  id: idSchema,
  title: text,
  description: text,
  subtitle: text,
  modules: z.array(moduleSchema).min(1),
});
export const projectSchema = z.strictObject({
  id: idSchema,
  title: text,
  description: text,
  moduleId: idSchema,
  order: z.number().int().nonnegative(),
  difficulty: difficultySchema,
  estimatedMinutes: z.number().int().positive(),
  prerequisites: ids,
  objectives: z.array(text).min(1),
  tags: z.array(text).min(1),
  lessonIds: ids.refine((v) => v.length > 0, 'Проект должен содержать уроки'),
  deliverables: z.array(text).min(1),
  published: z.boolean().default(true),
});
export type Hint = z.infer<typeof hintSchema>;
export type TestCase = z.infer<typeof testCaseSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type CodingExercise = z.infer<typeof codingExerciseSchema>;
export type LessonSection = z.infer<typeof lessonSectionSchema>;
export type LessonMetadata = z.infer<typeof lessonSchema>;
export type Module = z.infer<typeof moduleSchema>;
export type CourseModule = Module & { number: number; lessons: string[] };
export type Course = Omit<z.infer<typeof courseSchema>, 'modules'> & { modules: CourseModule[] };
export type Project = z.infer<typeof projectSchema>;
export type Lesson = LessonMetadata & {
  /** Совместимые имена для существующего интерфейса. Источник — metadata. */
  summary: string;
  minutes: number;
  body: string;
  format: 'md' | 'mdx';
  sections: LessonSection[];
  document: Root;
  previousLessonId: string | null;
  nextLessonId: string | null;
  effectivePrerequisites: string[];
};
export type Standard = z.infer<typeof standardSchema>;
export type Compiler = z.infer<typeof compilerSchema>;
export type PublicExercise = Omit<
  CodingExercise,
  'referenceSolution' | 'solutionExplanation' | 'hiddenTests' | 'hints'
> & {
  hints: Pick<Hint, 'id' | 'order'>[];
  hiddenTestCount: number;
};
export type PublicQuizQuestion = {
  id: string;
  type: 'single' | 'multiple' | 'text';
  question: string;
  code?: string;
  codeLanguage?: 'c' | 'cpp' | 'text';
  options?: string[];
  placeholder?: string;
};
export type PublicLesson = Omit<Lesson, 'exercise' | 'additionalExercises' | 'quiz'> & {
  exercise: PublicExercise;
  additionalExercises?: PublicExercise[];
  quiz: Omit<Quiz, 'questions'> & { questions: PublicQuizQuestion[] };
};
/** Основное упражнение сохраняет старый ключ; дополнительные имеют отдельное пространство имён. */
export function exerciseStorageKey(lessonId: string, primaryId: string, exerciseId: string) {
  return primaryId === exerciseId ? lessonId : `${lessonId}:${exerciseId}`;
}
export type LessonSummary = Pick<
  Lesson,
  | 'id'
  | 'moduleId'
  | 'title'
  | 'description'
  | 'summary'
  | 'minutes'
  | 'estimatedMinutes'
  | 'order'
  | 'difficulty'
  | 'standard'
  | 'tags'
  | 'prerequisites'
  | 'effectivePrerequisites'
  | 'completion'
>;

export type CourseSearchItem = {
  id: string;
  kind: 'module' | 'lesson' | 'section' | 'exercise';
  title: string;
  description: string;
  href: string;
  moduleTitle: string;
  lessonTitle?: string;
};
