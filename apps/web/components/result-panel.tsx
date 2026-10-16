'use client';
import { CheckCircle2, CircleX, LockKeyhole, Terminal } from 'lucide-react';
import type { SubmissionResult } from '@course/shared';

export const statusLabels: Record<SubmissionResult['status'], string> = {
  accepted: 'Все проверки пройдены',
  wrong_answer: 'Нужна доработка',
  compile_error: 'Ошибка компиляции',
  runtime_error: 'Ошибка выполнения',
  timeout: 'Превышено время',
  output_limit: 'Слишком много вывода',
  executed: 'Программа выполнена',
  resource_limit: 'Превышен лимит ресурсов',
  internal_error: 'Ошибка среды выполнения',
};
const reasons: Record<string, string> = {
  timeout:
    'Превышен выбранный лимит выполнения или лимит компиляции (15 секунд). Проверьте условие завершения цикла.',
  resource_limit: 'Превышен лимит памяти, процессов, диска или вывода. Контейнер остановлен.',
  internal_error: 'Среда не смогла выполнить запрос. Проверьте сообщение ниже и повторите запуск.',
  output_limit: 'Превышен общий лимит вывода 32 КБ. Проверьте вывод внутри цикла.',
  runtime_error:
    'Программа завершилась с ошибкой или сигналом. Проверьте обращения к памяти и код возврата.',
  compile_error: 'Компилятор не создал исполняемый файл. Начните с первого сообщения об ошибке.',
  wrong_answer:
    'Сравните результат с условием. Дополнительные приглашения и пояснения в stdout тоже считаются ответом.',
};
export function ResultPanel({ result }: { result: SubmissionResult | null }) {
  if (!result)
    return (
      <div className="result-empty">
        <Terminal size={21} />
        <span>Результат появится после запуска или проверки.</span>
      </div>
    );
  return (
    <section className="result-panel" aria-label="Результат выполнения" aria-live="polite">
      <div
        className={`result-heading ${result.status === 'accepted' || result.status === 'executed' ? 'success' : 'failure'}`}
      >
        {result.status === 'accepted' || result.status === 'executed' ? (
          <CheckCircle2 size={19} />
        ) : (
          <CircleX size={19} />
        )}
        <strong>{statusLabels[result.status]}</strong>
        {result.total !== undefined && (
          <span>
            Пройдено тестов: {result.passed} из {result.total}
          </span>
        )}
      </div>
      {reasons[result.status] && <p className="result-explanation">{reasons[result.status]}</p>}
      {(result.compilation.stderr || result.compilation.stdout) && (
        <details open={result.status === 'compile_error'} className="diagnostics">
          <summary>Сообщения компилятора</summary>
          <pre>{result.compilation.stdout + result.compilation.stderr}</pre>
        </details>
      )}
      {result.run && (
        <>
          <div className="output-meta">
            Код завершения: {result.run.exitCode ?? '—'} · Время: {result.run.durationMs} мс
          </div>
          <label className="output-label">Стандартный вывод · stdout</label>
          <pre className="output-block">{result.run.stdout || '(пусто)'}</pre>
          <label className="output-label">Поток ошибок · stderr</label>
          <pre className="output-block stderr">{result.run.stderr || '(пусто)'}</pre>
        </>
      )}
      {result.tests?.map((test, index) =>
        test.hidden ? (
          <div key={index} className={`test-result ${test.passed ? 'test-passed' : 'test-failed'}`}>
            <div className="result-heading">
              <LockKeyhole size={13} />
              <span>
                Скрытый тест №{test.hiddenIndex}: {test.passed ? 'пройден' : 'не пройден'}
              </span>
            </div>
          </div>
        ) : (
          <details
            key={index}
            className={`test-result ${test.passed ? 'test-passed' : 'test-failed'}`}
            open={!test.passed}
          >
            <summary>
              {test.passed ? <CheckCircle2 size={16} /> : <CircleX size={16} />}
              <span>{test.name}</span>
              <small>
                {test.passed
                  ? 'Пройдено'
                  : test.status === 'timeout'
                    ? 'Время истекло'
                    : test.status === 'output_limit'
                      ? 'Лимит вывода'
                      : test.status === 'runtime_error'
                        ? 'Ошибка программы'
                        : 'Не пройдено'}{' '}
                · {test.durationMs} мс
              </small>
            </summary>
            <div className="test-details">
              <div>
                <span>Ввод</span>
                <pre>{test.stdin || '(пусто)'}</pre>
              </div>
              <div>
                <span>Ожидается</span>
                <pre>{test.expected || '(пусто)'}</pre>
              </div>
              <div>
                <span>Получено</span>
                <pre>{test.actual || '(пусто)'}</pre>
              </div>
              {test.stderr && (
                <div>
                  <span>Ошибки программы</span>
                  <pre>{test.stderr}</pre>
                </div>
              )}
            </div>
          </details>
        ),
      )}
    </section>
  );
}
