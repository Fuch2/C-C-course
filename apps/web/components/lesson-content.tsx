'use client';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  type ReactNode,
} from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Check, Copy, LoaderCircle, Play } from 'lucide-react';
import type { Root } from 'hast';
import { runResponseSchema, type PublicLesson, type RunResponse } from '@course/shared';
import { Quiz as LessonQuiz } from './quiz';
import { Practice } from './practice';

const LessonContext = createContext<{ lesson: PublicLesson; onPractice: () => void } | null>(null);
type Props = { title?: string; children?: ReactNode };

function textContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textContent(node.props.children);
  return '';
}
const executionLabels: Record<RunResponse['status'], string> = {
  success: 'Выполнено успешно',
  compile_error: 'Ошибка компиляции',
  runtime_error: 'Ошибка выполнения',
  timeout: 'Превышено время',
  resource_limit: 'Превышен лимит ресурсов',
  internal_error: 'Ошибка среды выполнения',
};
function LessonCodeBlock({ children }: { children?: ReactNode }) {
  const code = Children.toArray(children)[0];
  const className = isValidElement<{ className?: string }>(code)
    ? (code.props.className ?? '')
    : '';
  const language = /language-([^\s]+)/.exec(className)?.[1]?.toLowerCase() ?? '';
  const source = textContent(code).replace(/\n$/, '');
  const cpp = language === 'cpp' || language === 'c++';
  // Блок с именем файла — часть многофайловой программы: его не запускают отдельно.
  const file = isValidElement<{ 'data-file'?: string }>(code) ? code.props['data-file'] : undefined;
  const runnable = !file && (language === 'c' || cpp) && /\bmain\s*\(/.test(source);
  const filename =
    file ?? (language === 'c' ? 'main.c' : cpp ? 'main.cpp' : language || 'фрагмент кода');
  const readsInput = runnable && /\b(scanf|getchar|fgets|getline|cin)\b/.test(source);
  const initialStdin = isValidElement<{ 'data-stdin'?: string }>(code)
    ? (code.props['data-stdin'] ?? '')
    : '';
  const [stdin, setStdin] = useState(initialStdin);
  const stdinId = useId();
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [error, setError] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Не удалось скопировать код. Выделите его вручную.');
    }
  };
  const run = async () => {
    setPending(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: cpp ? 'cpp' : 'c',
          standard: cpp ? 'c++23' : 'c23',
          sourceCode: source,
          stdin: readsInput ? stdin : '',
          compiler: 'gcc',
          timeoutMs: 2000,
        }),
      });
      const parsed = runResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error('Некорректный ответ среды выполнения');
      setResult(parsed.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось запустить пример.');
    } finally {
      setPending(false);
    }
  };
  return (
    <figure className="lesson-code-block">
      <figcaption>
        <span>{filename}</span>
        <span className="code-block-actions">
          <button type="button" onClick={copy} aria-label={`Копировать код из ${filename}`}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          {runnable && (
            <button
              type="button"
              onClick={run}
              disabled={pending}
              aria-label={`Запустить ${filename}`}
            >
              {pending ? <LoaderCircle className="spin-icon" size={14} /> : <Play size={14} />}
              {pending ? 'Запускаем…' : 'Запустить'}
            </button>
          )}
        </span>
      </figcaption>
      <pre>{children}</pre>
      {readsInput && (
        <div className="code-stdin">
          <label htmlFor={stdinId}>Ввод для программы (stdin)</label>
          <textarea
            id={stdinId}
            rows={2}
            maxLength={16_384}
            spellCheck={false}
            placeholder="Например: 3 4"
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
          />
        </div>
      )}
      {(result || error) && (
        <div
          className={`code-run-result ${result?.status === 'success' ? 'success' : 'failure'}`}
          role="status"
          aria-live="polite"
        >
          <strong>{result ? executionLabels[result.status] : 'Не удалось выполнить пример'}</strong>
          {result?.compilerOutput && <pre>{result.compilerOutput}</pre>}
          {result?.stdout && <pre>{result.stdout}</pre>}
          {result?.stderr && <pre>{result.stderr}</pre>}
          {result && (
            <small>
              Время: {result.executionTimeMs} мс · Код завершения: {result.exitCode ?? '—'}
            </small>
          )}
          {error && <span>{error}</span>}
        </div>
      )}
    </figure>
  );
}
function Callout({ title, children, kind }: Props & { kind: string }) {
  return (
    <aside className={`learning-block learning-${kind}`}>
      <h3>{title}</h3>
      <div>{children}</div>
    </aside>
  );
}
export function Concept({ title = 'Понятие', children }: Props) {
  return (
    <Callout kind="concept" title={title}>
      {children}
    </Callout>
  );
}
export function Important({ title = 'Важно', children }: Props) {
  return (
    <Callout kind="important" title={title}>
      {children}
    </Callout>
  );
}
export function Warning({ title = 'Предупреждение', children }: Props) {
  return (
    <Callout kind="warning" title={title}>
      {children}
    </Callout>
  );
}
export function Tip({ title = 'Совет', children }: Props) {
  return (
    <Callout kind="tip" title={title}>
      {children}
    </Callout>
  );
}
export function CommonMistake({ title = 'Частая ошибка', children }: Props) {
  return (
    <Callout kind="mistake" title={title}>
      {children}
    </Callout>
  );
}
export function MemoryDiagram({ title = 'Схема памяти', children }: Props) {
  return (
    <figure className="learning-memory">
      <figcaption>{title}</figcaption>
      <div className="memory-scroll">{children}</div>
    </figure>
  );
}
export function Checkpoint({ title = 'Проверьте себя', children }: Props) {
  return (
    <details className="learning-details">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}
export function UnderTheHood({ title = 'Как это устроено', children }: Props) {
  return (
    <details className="learning-details">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}
export function TryIt({ title = 'Попробуйте сами', children }: Props) {
  const context = useContext(LessonContext);
  return (
    <Callout kind="try" title={title}>
      {children}
      <button className="button button-secondary" onClick={context?.onPractice}>
        Открыть редактор урока
      </button>
    </Callout>
  );
}
export function Quiz({ title, children }: Props) {
  const context = useContext(LessonContext);
  return (
    <section className="embedded-activity">
      {title && <h3>{title}</h3>}
      {children}
      {context && <LessonQuiz lesson={context.lesson} />}
    </section>
  );
}
export function CodingExercise({ title = 'Задание с кодом', children }: Props) {
  const context = useContext(LessonContext);
  const [opened, setOpened] = useState(false);
  return (
    <section className="embedded-activity">
      <h3>{title}</h3>
      {children}
      {opened && context ? (
        <Practice lesson={context.lesson} />
      ) : (
        <button
          className="button button-primary"
          onClick={() => {
            if (context?.lesson.additionalExercises?.length) context.onPractice();
            else setOpened(true);
          }}
        >
          Начать практику
        </button>
      )}
    </section>
  );
}
const registry: Record<string, (props: Props) => ReactNode> = {
  Concept,
  Important,
  Warning,
  Tip,
  MemoryDiagram,
  TryIt,
  Quiz,
  CodingExercise,
  Checkpoint,
  CommonMistake,
  UnderTheHood,
};
function LearningBlock(props: Props & { 'data-component'?: string }) {
  const Component = registry[props['data-component'] ?? ''];
  return Component ? (
    <Component title={props.title}>{props.children}</Component>
  ) : (
    <aside>{props.children}</aside>
  );
}
export function LessonContent({
  document,
  lesson,
  onPractice,
}: {
  document: Root;
  lesson: PublicLesson;
  onPractice: () => void;
}) {
  return (
    <LessonContext.Provider value={{ lesson, onPractice }}>
      <div className="prose">
        {toJsxRuntime(document, {
          Fragment,
          jsx,
          jsxs,
          components: { aside: LearningBlock, pre: LessonCodeBlock },
        })}
      </div>
    </LessonContext.Provider>
  );
}
