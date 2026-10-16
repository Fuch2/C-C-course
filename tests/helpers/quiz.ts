import type { QuizAnswer, QuizQuestion } from '@course/shared';

/** Правильный ответ на вопрос любого типа — для тестов API. */
export function correctAnswer(question: QuizQuestion): QuizAnswer {
  if (question.type === 'text') return question.answers[0]!;
  return question.correct;
}
/** Заведомо неверный ответ того же вида. */
export function wrongAnswer(question: QuizQuestion): QuizAnswer {
  if (question.type === 'text') return '__неверный ответ__';
  if (question.type === 'multiple')
    return question.options.map((_, index) => index).filter((i) => !question.correct.includes(i));
  return (question.correct + 1) % question.options.length;
}
