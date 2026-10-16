'use client';
import { useId, useState } from 'react';
import { CheckCircle2, CircleHelp, CircleX } from 'lucide-react';
import type { PublicLesson, PublicQuizQuestion, QuizAnswer } from '@course/shared';
import { errorMessage, post } from '@/lib/client';
import { useProfile } from './profile-provider';

type QuizResult = {
  passed: boolean;
  score: number;
  total: number;
  questions: { id: string; correct: boolean; explanation: string }[];
};
type Draft = number | number[] | string | null;

function initialDraft(question: PublicQuizQuestion): Draft {
  if (question.type === 'multiple') return [];
  if (question.type === 'text') return '';
  return null;
}
function isAnswered(draft: Draft) {
  if (draft === null) return false;
  if (Array.isArray(draft)) return draft.length > 0;
  if (typeof draft === 'string') return draft.trim().length > 0;
  return true;
}
const typeHints: Record<PublicQuizQuestion['type'], string> = {
  single: 'Один ответ',
  multiple: 'Несколько ответов',
  text: 'Введите ответ',
};

export function Quiz({ lesson }: { lesson: PublicLesson }) {
  const formId = useId();
  const { profile, refresh } = useProfile();
  const questions = lesson.quiz.questions;
  const [drafts, setDrafts] = useState<Draft[]>(() => questions.map(initialDraft));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const update = (index: number, value: Draft) => {
    setDrafts((previous) => previous.map((item, i) => (i === index ? value : item)));
    setResult(null);
  };
  return (
    <section className="quiz">
      <span className="eyebrow">ПРОВЕРКА ПОНИМАНИЯ</span>
      <h2>{lesson.quiz.title}</h2>
      <p className="helper-text">
        Ответьте на все вопросы. Если ошиблись — прочитайте объяснение, вернитесь к теории и
        попробуйте снова.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError('');
          try {
            const answers: QuizAnswer[] = drafts.map((draft) => draft ?? -1);
            setResult(await post<QuizResult>(`/api/lessons/${lesson.id}/quiz`, { answers }));
            await refresh();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setPending(false);
          }
        }}
      >
        {questions.map((question, index) => {
          const draft = drafts[index] ?? null;
          const feedback = result?.questions[index];
          return (
            <fieldset key={question.id} disabled={pending}>
              <legend>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {question.question}
              </legend>
              <small className="quiz-type">{typeHints[question.type]}</small>
              {question.code && (
                <pre className="quiz-code">
                  <code className={`language-${question.codeLanguage ?? 'c'}`}>
                    {question.code}
                  </code>
                </pre>
              )}
              {question.type === 'text' ? (
                <textarea
                  className="quiz-text-input"
                  aria-label={`Ответ на вопрос ${index + 1}`}
                  rows={Math.min(6, Math.max(1, String(draft ?? '').split('\n').length))}
                  maxLength={500}
                  spellCheck={false}
                  placeholder={question.placeholder ?? 'Ваш ответ'}
                  value={typeof draft === 'string' ? draft : ''}
                  onChange={(event) => update(index, event.target.value)}
                />
              ) : (
                question.options?.map((option, optionIndex) => {
                  const multiple = question.type === 'multiple';
                  const selected = multiple
                    ? Array.isArray(draft) && draft.includes(optionIndex)
                    : draft === optionIndex;
                  return (
                    <label
                      className={`quiz-option ${selected ? 'selected' : ''}`}
                      key={optionIndex}
                    >
                      <input
                        type={multiple ? 'checkbox' : 'radio'}
                        name={`${formId}-${question.id}`}
                        value={optionIndex}
                        checked={selected}
                        onChange={() => {
                          if (!multiple) return update(index, optionIndex);
                          const current = Array.isArray(draft) ? draft : [];
                          update(
                            index,
                            current.includes(optionIndex)
                              ? current.filter((value) => value !== optionIndex)
                              : [...current, optionIndex],
                          );
                        }}
                      />
                      {option}
                    </label>
                  );
                })
              )}
              {feedback && (
                <div className={`quiz-feedback ${feedback.correct ? 'success' : 'failure'}`}>
                  {feedback.correct ? <CheckCircle2 size={18} /> : <CircleX size={18} />}
                  <p>
                    <strong>{feedback.correct ? 'Верно. ' : 'Неверно. '}</strong>
                    {feedback.explanation}
                  </p>
                </div>
              )}
            </fieldset>
          );
        })}
        <button
          className="button button-primary"
          disabled={pending || !profile || !drafts.every(isAnswered)}
        >
          <CircleHelp size={17} />
          {pending ? 'Проверяем…' : 'Проверить ответы'}
        </button>
      </form>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className={result.passed ? 'success-message' : 'info-message'} role="status">
          {result.passed
            ? 'Всё верно! Проверка знаний засчитана.'
            : `Верно ${result.score} из ${result.total}. Прочитайте объяснения и попробуйте снова.`}
        </p>
      )}
    </section>
  );
}
