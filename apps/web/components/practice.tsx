'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCheck, ChevronDown, History, Lightbulb, Play, RotateCcw, Save } from 'lucide-react';
import {
  compilerSchema,
  standardSchema,
  testInput,
  executionToSubmission,
  runResponseSchema,
  type Compiler,
  type PublicLesson,
  type Standard,
  type SubmissionResult,
} from '@course/shared';
import { api, errorMessage, post } from '@/lib/client';
import { useProfile } from './profile-provider';
import { Markdown } from './markdown';
import { ResultPanel, statusLabels } from './result-panel';

const CodeEditor = dynamic(() => import('./code-editor'), {
  ssr: false,
  loading: () => <div className="editor-loading">Загружаем редактор…</div>,
});
type Attempt = {
  id: string;
  source: string;
  stdin: string;
  standard: Standard;
  compiler: Compiler;
  status: SubmissionResult['status'];
  mode: string;
  createdAt: string;
  result: SubmissionResult;
};
type ExerciseStats = {
  attempts: number;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  successful: boolean;
  hintViewed: boolean;
  solutionViewed: boolean;
};
export function Practice({
  lesson,
  playground = false,
}: {
  lesson: PublicLesson;
  playground?: boolean;
}) {
  const { profile, refresh } = useProfile();
  const [source, setSource] = useState(lesson.exercise.starterCode);
  const [stdin, setStdin] = useState(
    lesson.exercise.publicTests[0] ? testInput(lesson.exercise.publicTests[0]) : '',
  );
  const [compilerOverride, setCompiler] = useState<Compiler | null>(
    playground ? null : lesson.exercise.compiler,
  );
  const compiler = compilerOverride ?? profile?.compiler ?? 'gcc';
  const [standard, setStandard] = useState<Standard>(lesson.standard);
  const [timeoutMs, setTimeoutMs] = useState(2000);
  const language = standard.startsWith('c++') ? 'cpp' : 'c';
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<'run' | 'check' | null>(null);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('Загружаем черновик…');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [solution, setSolution] = useState<{ source: string; explanation: string } | null>(null);
  const [solutionPending, setSolutionPending] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPending, setHistoryPending] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const latestDraft = useRef<{ source: string; stdin: string; loaded: boolean }>({
    source,
    stdin,
    loaded: false,
  });
  const ready = !!profile;
  const endpoint = playground ? '/api/playground' : `/api/lessons/${lesson.id}`;
  const url = useCallback(
    (action: string) =>
      `${endpoint}/${action}${playground ? '' : `?exercise=${encodeURIComponent(lesson.exercise.id)}`}`,
    [endpoint, playground, lesson.exercise.id],
  );
  useEffect(() => {
    latestDraft.current = { source, stdin, loaded };
  }, [source, stdin, loaded]);
  useEffect(() => {
    const flush = () => {
      const draft = latestDraft.current;
      if (!draft.loaded) return;
      const body = JSON.stringify({ source: draft.source, stdin: draft.stdin });
      // keepalive ограничен браузером 64 КБ; большие черновики сохраняются обычной очередью.
      void fetch(url('draft'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: new Blob([body]).size < 60_000,
      }).catch(() => {});
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      const draft = latestDraft.current;
      if (draft.loaded) {
        saveQueue.current = saveQueue.current
          .catch(() => {})
          .then(async () => {
            await post(url('draft'), { source: draft.source, stdin: draft.stdin });
          });
        void saveQueue.current.catch(() => {});
      }
    };
  }, [url]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    void api<{ source: string; stdin: string }>(url('draft'))
      .then((draft) => {
        if (active) {
          setSource(draft.source);
          setStdin(draft.stdin);
          setLoaded(true);
          setSaveStatus('Черновик сохранён');
        }
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setSaveStatus('Черновик не загружен');
        }
      });
    return () => {
      active = false;
    };
  }, [ready, url]);
  const refreshStats = useCallback(async () => {
    if (!playground) setStats(await api<ExerciseStats>(url('stats')));
  }, [url, playground]);
  useEffect(() => {
    if (ready && !playground)
      void api<ExerciseStats>(url('stats'))
        .then(setStats)
        .catch(() => {});
  }, [ready, playground, url]);
  useEffect(() => {
    if (!loaded) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setSaveStatus('Сохраняем…');
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(async () => {
          await post(url('draft'), { source, stdin });
        });
      void saveQueue.current
        .then(() => {
          if (active) setSaveStatus('Черновик сохранён');
        })
        .catch((e) => {
          if (active) {
            setSaveStatus('Не сохранено');
            setError(errorMessage(e));
          }
        });
    }, 700);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [source, stdin, loaded, url]);
  const submit = useCallback(
    async (mode: 'run' | 'check') => {
      if (busy || !loaded || !source.trim()) return;
      setBusy(mode);
      setError('');
      try {
        await saveQueue.current.catch(() => {});
        const result = playground
          ? executionToSubmission(
              runResponseSchema.parse(
                await fetch(url('execute'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    language,
                    standard,
                    sourceCode: source,
                    stdin,
                    compiler,
                    timeoutMs,
                  }),
                }).then((r) => r.json()),
              ),
            )
          : await post<SubmissionResult>(url('submit'), {
              source,
              stdin,
              compiler,
              standard,
              mode,
            });
        setResult(result);
        setSaveStatus('Черновик сохранён');
        await refresh();
        await refreshStats();
        if (historyOpen) {
          const response = await api<{ attempts: Attempt[]; nextCursor: string | null }>(
            url('attempts'),
          );
          setHistory(response.attempts);
          setCursor(response.nextCursor);
        }
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setBusy(null);
      }
    },
    [
      busy,
      loaded,
      source,
      stdin,
      compiler,
      standard,
      url,
      refresh,
      historyOpen,
      playground,
      language,
      timeoutMs,
      refreshStats,
    ],
  );
  const loadHistory = async (more = false) => {
    setHistoryOpen(true);
    setHistoryPending(true);
    setError('');
    try {
      const response = await api<{ attempts: Attempt[]; nextCursor: string | null }>(
        `${url('attempts')}${more && cursor ? `${playground ? '?' : '&'}before=${encodeURIComponent(cursor)}` : ''}`,
      );
      setHistory((previous) => (more ? [...previous, ...response.attempts] : response.attempts));
      setCursor(response.nextCursor);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setHistoryPending(false);
    }
  };
  return (
    <div className="practice">
      <div className="task-intro">
        <span className="eyebrow">{playground ? 'СВОБОДНЫЙ РЕЖИМ' : 'ПРАКТИЧЕСКАЯ ЗАДАЧА'}</span>
        <h2>{lesson.exercise.title}</h2>
        <Markdown>{lesson.exercise.description}</Markdown>
        {!playground && stats && (
          <p className="helper-text">
            Попыток: {stats.attempts} · Результат: {stats.successful ? 'решено' : 'ещё не решено'}
            {stats.firstAttemptAt
              ? ` · Первая: ${new Date(stats.firstAttemptAt).toLocaleString('ru-RU')}`
              : ''}
            {stats.lastAttemptAt
              ? ` · Последняя: ${new Date(stats.lastAttemptAt).toLocaleString('ru-RU')}`
              : ''}
          </p>
        )}
        {!playground && (
          <details className="public-examples" open>
            <summary>
              Примеры и ограничения <ChevronDown size={14} />
            </summary>
            <div className="examples-grid">
              {lesson.exercise.examples.map((example, i) => (
                <div key={i}>
                  <strong>Пример {i + 1}</strong>
                  <span>Ввод</span>
                  <pre>{example.input || '(пусто)'}</pre>
                  <span>Ожидаемый вывод</span>
                  <pre>{example.output || '(пусто)'}</pre>
                  {example.explanation && <p>{example.explanation}</p>}
                </div>
              ))}
            </div>
            <strong>Ограничения</strong>
            <ul>
              {lesson.exercise.constraints.map((constraint) => (
                <li key={constraint}>{constraint}</li>
              ))}
            </ul>
            <p>
              Открытых тестов: {lesson.exercise.publicTests.length}. Скрытых тестов:{' '}
              {lesson.exercise.hiddenTestCount}.
            </p>
          </details>
        )}
      </div>
      <div className="editor-shell">
        <div className="editor-toolbar">
          <span className="file-tab">{standard.startsWith('c++') ? 'main.cpp' : 'main.c'}</span>
          <div className="compiler-controls">
            <label>
              <span className="sr-only">Язык программирования</span>
              <select
                aria-label="Язык программирования"
                value={language}
                disabled={!!busy}
                onChange={(e) => setStandard(e.target.value === 'cpp' ? 'c++23' : 'c23')}
              >
                <option value="c">C</option>
                <option value="cpp">C++</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Компилятор</span>
              <select
                aria-label="Компилятор"
                disabled={!!busy}
                value={compiler}
                onChange={(e) => setCompiler(compilerSchema.parse(e.target.value))}
              >
                <option value="gcc">GCC</option>
                <option value="clang">Clang</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Стандарт языка</span>
              <select
                aria-label="Стандарт языка"
                disabled={!!busy}
                value={standard}
                onChange={(e) => setStandard(standardSchema.parse(e.target.value))}
              >
                {(language === 'c' ? ['c11', 'c17', 'c23'] : ['c++17', 'c++20', 'c++23']).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value.toUpperCase()}
                    </option>
                  ),
                )}
              </select>
            </label>
            {playground && (
              <label>
                <span className="sr-only">Лимит времени</span>
                <select
                  aria-label="Лимит времени"
                  value={timeoutMs}
                  disabled={!!busy}
                  onChange={(e) => setTimeoutMs(Number(e.target.value))}
                >
                  <option value={1000}>1 секунда</option>
                  <option value={2000}>2 секунды</option>
                  <option value={5000}>5 секунд</option>
                  <option value={10000}>10 секунд</option>
                </select>
              </label>
            )}
          </div>
        </div>
        {lesson.exercise.diagnostics && !playground && (
          <p className="helper-text">
            При проверке включён{' '}
            {lesson.exercise.diagnostics === 'valgrind'
              ? 'Valgrind Memcheck'
              : 'AddressSanitizer и UBSan'}
            . Ошибка памяти считается непройденным тестом даже при правильном выводе.
          </p>
        )}
        <CodeEditor
          source={source}
          onChange={setSource}
          cpp={standard.startsWith('c++')}
          fontSize={profile?.fontSize ?? 15}
          onRun={() => {
            void submit('run');
          }}
          disabled={!loaded || !!busy}
          diagnostics={result?.compilation.stderr ?? ''}
        />
        <div className="editor-status">
          <span>
            <Save size={12} />
            {saveStatus}
          </span>
          <span>Ctrl / ⌘ + Enter — запустить</span>
        </div>
      </div>
      {(playground || lesson.exercise.checking.type !== 'function') && (
        <div className="stdin-section">
          <label htmlFor={`stdin-${lesson.id}`}>
            Стандартный ввод <span>stdin</span>
          </label>
          <textarea
            id={`stdin-${lesson.id}`}
            value={stdin}
            disabled={!loaded || !!busy}
            onChange={(e) => setStdin(e.target.value)}
            rows={3}
            maxLength={16_384}
            spellCheck={false}
            placeholder="Входные данные для кнопки «Запустить»"
          />
          <p>
            {playground
              ? 'Лимиты:'
              : 'При проверке задания используются данные тестов, а не это поле. Лимиты:'}{' '}
            {playground ? timeoutMs / 1000 : 2} с, 256 МБ, 32 КБ вывода.
          </p>
        </div>
      )}
      <div className="execution-actions">
        <button
          className="button button-secondary"
          disabled={!!busy || !loaded || !source.trim()}
          onClick={() => {
            void submit('run');
          }}
        >
          {busy === 'run' ? <span className="spinner small" /> : <Play size={16} />}
          {busy === 'run' ? 'Выполняем…' : 'Запустить'}
        </button>
        {!playground && (
          <button
            className="button button-primary"
            disabled={!!busy || !loaded || !source.trim()}
            onClick={() => {
              void submit('check');
            }}
          >
            {busy === 'check' ? <span className="spinner small" /> : <CheckCheck size={17} />}
            {busy === 'check' ? 'Проверяем…' : 'Проверить решение'}
          </button>
        )}
        <button
          className="button button-ghost button-small"
          onClick={() => {
            void loadHistory();
          }}
          disabled={historyPending || !loaded}
        >
          <History size={16} />
          История
        </button>
        <details className="reset-code">
          <summary>
            <RotateCcw size={14} />
            Сбросить
          </summary>
          <div>
            <p>Заменить текущий код исходным шаблоном? История попыток сохранится.</p>
            <button
              className="button button-secondary button-small"
              disabled={!!busy || !loaded}
              onClick={() => {
                setSource(lesson.exercise.starterCode);
                setResult(null);
              }}
            >
              Восстановить шаблон
            </button>
          </div>
        </details>
      </div>
      {!playground && standard !== lesson.standard && (
        <p className="info-message">
          Свободный запуск доступен. Для автопроверки урока выберите {lesson.standard.toUpperCase()}
          .
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p className="execution-wait" role="status">
          Компилируем в отдельном контейнере{busy === 'check' ? ' и выполняем тесты' : ''}…
        </p>
      )}
      <ResultPanel result={result} />
      {!playground && (
        <div className="learning-support">
          <h3>
            <Lightbulb size={18} />
            Если нужна опора
          </h3>
          {lesson.exercise.hints.map((hint, index) => (
            <div key={hint.id}>
              <button
                className="text-link"
                disabled={!!revealedHints[hint.id]}
                onClick={async () => {
                  try {
                    const value = await post<{ id: string; text: string }>(url('hint'), {
                      hintId: hint.id,
                    });
                    setRevealedHints((current) => ({ ...current, [value.id]: value.text }));
                    await refreshStats();
                  } catch (e) {
                    setError(errorMessage(e));
                  }
                }}
              >
                {revealedHints[hint.id]
                  ? `Подсказка ${index + 1} показана`
                  : `Показать подсказку ${index + 1}`}
              </button>
              {revealedHints[hint.id] && <p>{revealedHints[hint.id]}</p>}
            </div>
          ))}
          <button
            className="text-link solution-trigger"
            disabled={solutionPending || !loaded}
            onClick={async () => {
              if (!window.confirm('Просмотр решения будет отмечен в статистике. Показать решение?'))
                return;
              setSolutionPending(true);
              setError('');
              try {
                setSolution(await post(url('solution'), { confirmed: true }));
                await refreshStats();
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setSolutionPending(false);
              }
            }}
          >
            {solutionPending ? 'Открываем решение…' : 'Показать решение'}
          </button>
          <p className="helper-text">
            Доступно после первой отправки на проверку. Просмотр решения сам по себе не завершает
            урок.
          </p>
          {solution && (
            <div className="solution">
              <Markdown>{`\`\`\`${lesson.standard.startsWith('c++') ? 'cpp' : 'c'}\n${solution.source}\n\`\`\`\n\n${solution.explanation}`}</Markdown>
            </div>
          )}
        </div>
      )}
      {historyOpen && (
        <section className="attempt-history">
          <div className="section-heading">
            <h3>История попыток</h3>
            <button className="text-link" onClick={() => setHistoryOpen(false)}>
              Скрыть
            </button>
          </div>
          {historyPending && <p role="status">Загружаем историю…</p>}
          {!history.length && !historyPending && (
            <p className="helper-text">
              Пока не было запусков. Ваша первая попытка появится здесь.
            </p>
          )}
          {history.map((attempt) => (
            <details key={attempt.id}>
              <summary>
                <span>{statusLabels[attempt.status]}</span>
                <small>
                  {attempt.mode === 'check' ? 'Проверка' : 'Запуск'} ·{' '}
                  {new Date(attempt.createdAt).toLocaleString('ru-RU')}
                </small>
              </summary>
              <pre>{attempt.source}</pre>
              <button
                className="button button-secondary button-small"
                disabled={!!busy}
                onClick={() => {
                  setSource(attempt.source);
                  setStdin(attempt.stdin);
                  setCompiler(attempt.compiler);
                  setStandard(attempt.standard);
                  setResult(attempt.result);
                }}
              >
                Загрузить эту попытку
              </button>
            </details>
          ))}
          {cursor && (
            <button
              className="button button-secondary"
              disabled={historyPending}
              onClick={() => {
                void loadHistory(true);
              }}
            >
              Более ранние попытки
            </button>
          )}
        </section>
      )}
    </div>
  );
}
