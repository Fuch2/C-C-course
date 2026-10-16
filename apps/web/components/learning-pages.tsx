'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Boxes,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Search,
  TrendingUp,
} from 'lucide-react';
import { EmptyState, ProgressBar } from '@course/ui';
import {
  calculateProgress,
  isLessonComplete,
  lessonPercent,
  type Course,
  type CourseSearchItem,
  type LessonSummary,
} from '@course/shared';
import { api, errorMessage, post } from '@/lib/client';
import { useProfile } from './profile-provider';

export function ProgressPage({ course, lessons }: { course: Course; lessons: LessonSummary[] }) {
  const { profile } = useProfile();
  if (!profile)
    return (
      <div className="loading-state" role="status">
        Загружаем прогресс…
      </div>
    );
  const completed = lessons.filter((l) =>
    isLessonComplete(
      profile.progress.find((p) => p.lessonId === l.id),
      l.completion,
    ),
  );
  const percentage = calculateProgress(lessons, profile?.progress).percent;
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">УЧИТЬСЯ — ЗНАЧИТ ДВИГАТЬСЯ</span>
          <h1>Ваш прогресс</h1>
          <p>Каждый пройденный шаг сохраняется: чтение, проверка знаний и решённые задачи.</p>
        </div>
        <TrendingUp size={38} className="heading-icon" />
      </div>
      <div className="progress-overview">
        <div>
          <strong>
            {percentage}
            <span>%</span>
          </strong>
          <p>всего курса</p>
          <ProgressBar value={percentage} label="Общий прогресс курса" />
        </div>
        <div>
          <strong>
            {completed.length}
            <span> / {lessons.length}</span>
          </strong>
          <p>уроков завершено</p>
        </div>
        <div>
          <strong>{profile.attempts}</strong>
          <p>запусков и проверок</p>
        </div>
        <div>
          <strong>{profile.studyDays.length}</strong>
          <p>дней практики за 90 дней</p>
        </div>
      </div>
      <section className="activity-panel">
        <h2>Ритм обучения</h2>
        <p>Дни с чтением, проверкой знаний или запуском программы. Даты учитываются по UTC.</p>
        <div className="activity-grid" role="list" aria-label="Активность за последние 84 дня">
          {Array.from({ length: 84 }, (_, index) => {
            const date = new Date();
            date.setUTCDate(date.getUTCDate() - 83 + index);
            const key = date.toISOString().slice(0, 10);
            const active = profile.studyDays.includes(key);
            return (
              <span
                role="listitem"
                key={key}
                className={active ? 'active' : ''}
                title={`${key}: ${active ? 'была практика' : 'нет активности'}`}
                aria-label={`${key}: ${active ? 'была практика' : 'нет активности'}`}
              />
            );
          })}
        </div>
      </section>
      <section className="progress-modules">
        <h2>По модулям</h2>
        {course.modules.map((m) => {
          const moduleLessons = lessons.filter((l) => l.moduleId === m.id);
          const value = calculateProgress(moduleLessons, profile?.progress).percent;
          return (
            <details className="progress-module" key={m.id}>
              <summary>
                <span className="module-number">{String(m.number).padStart(2, '0')}</span>
                <strong>{m.title}</strong>
                <ProgressBar value={value} label={m.title} />
                <span>{Math.round(value)}%</span>
              </summary>
              <div>
                {moduleLessons.map((l) => (
                  <Link className="progress-lesson" key={l.id} href={`/lesson/${l.id}`}>
                    <span>
                      {isLessonComplete(
                        profile.progress.find((p) => p.lessonId === l.id),
                        l.completion,
                      ) ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Clock3 size={16} />
                      )}
                      {l.title}
                    </span>
                    <span>
                      {lessonPercent(
                        profile.progress.find((p) => p.lessonId === l.id),
                        l.completion,
                      )}
                      %
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                ))}
              </div>
            </details>
          );
        })}
      </section>
      {completed.length === 0 && (
        <p className="helper-text">
          Откройте демонстрационный урок и нажмите «Завершить урок». Результаты дополнительных
          вопросов и практики сохраняются отдельно.
        </p>
      )}
    </div>
  );
}

export function BookmarksPage({ lessons }: { lessons: LessonSummary[] }) {
  const { profile, refresh } = useProfile();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const saved = lessons.filter((l) => profile?.bookmarks.includes(l.id));
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ПОД РУКОЙ</span>
          <h1>Закладки</h1>
          <p>Уроки, к которым хочется вернуться.</p>
        </div>
        <Bookmark className="heading-icon" size={34} />
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {!profile ? (
        <p role="status">Загружаем закладки…</p>
      ) : saved.length ? (
        <div className="lesson-list">
          {saved.map((lesson) => (
            <article key={lesson.id}>
              <Link href={`/lesson/${lesson.id}`}>
                <h2>{lesson.title}</h2>
                <p>{lesson.summary}</p>
                <small>
                  {lesson.standard.toUpperCase()} · {lesson.minutes} мин
                </small>
              </Link>
              <button
                className="bookmark-button saved"
                aria-label={`Удалить закладку: ${lesson.title}`}
                disabled={pending === lesson.id}
                onClick={async () => {
                  setPending(lesson.id);
                  setError('');
                  try {
                    await post(`/api/lessons/${lesson.id}/bookmark`, { saved: false });
                    await refresh();
                  } catch (e) {
                    setError(errorMessage(e));
                  } finally {
                    setPending(null);
                  }
                }}
              >
                <Bookmark size={19} fill="currentColor" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Bookmark size={35} />} title="Пока без закладок">
          Нажмите на значок закладки в заголовке любого урока. Он появится здесь.
          <br />
          <Link className="text-link inline-link" href="/course">
            Выбрать урок
            <ArrowRight size={15} />
          </Link>
        </EmptyState>
      )}
    </div>
  );
}

export function SearchPage({
  initialQuery = '',
  initialTags = [],
  tags,
}: {
  initialQuery?: string;
  initialTags?: string[];
  tags: string[];
}) {
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<CourseSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const value = query.trim();
      setSearching(true);
      setError('');
      try {
        const data = await api<{ items: CourseSearchItem[] }>(
          `/api/search?${new URLSearchParams([['q', value], ...selectedTags.map((tag) => ['tag', tag])])}`,
          { signal: controller.signal },
        );
        setResults(data.items);
        setSearched(value || selectedTags.join(', '));
      } catch (e) {
        if (!controller.signal.aborted) setError(errorMessage(e));
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedTags]);
  return (
    <div className="page-content narrow-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">НАЙДИТЕ СВЯЗИ</span>
          <h1>Поиск по курсу</h1>
          <p>Ищите модули, уроки, заголовки, термины и практические задания.</p>
        </div>
      </div>
      <label className="search-field">
        <Search size={22} />
        <span className="sr-only">Поисковый запрос</span>
        <input
          type="search"
          value={query}
          maxLength={160}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например, указатели или время жизни"
          autoFocus
        />
      </label>
      <fieldset className="tag-filters">
        <legend>Фильтр по тегам · урок должен содержать все выбранные теги</legend>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={selectedTags.includes(tag)}
            onClick={() =>
              setSelectedTags((current) =>
                current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
              )
            }
          >
            {tag}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button type="button" onClick={() => setSelectedTags([])}>
            Сбросить теги
          </button>
        )}
      </fieldset>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <p className="helper-text" role="status">
        {searching
          ? 'Ищем…'
          : searched
            ? `Найдено результатов: ${results.length}`
            : 'Введите слово или несколько терминов.'}
      </p>
      <div className="lesson-list">
        {results.map((result) => {
          const Icon =
            result.kind === 'module'
              ? Boxes
              : result.kind === 'exercise'
                ? Code2
                : result.kind === 'section'
                  ? FileText
                  : CheckCircle2;
          const kind = {
            module: 'Модуль',
            lesson: 'Урок',
            section: 'Заголовок',
            exercise: 'Задание',
          }[result.kind];
          return (
            <article key={`${result.kind}:${result.id}`}>
              <span className="search-result-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <Link href={result.href}>
                <span className="search-result-kind">{kind}</span>
                <h2>{result.title}</h2>
                <p>{result.description}</p>
                <small>
                  {result.moduleTitle}
                  {result.lessonTitle ? ` · ${result.lessonTitle}` : ''}
                </small>
              </Link>
              <ArrowRight size={20} />
            </article>
          );
        })}
      </div>
      {searched && !results.length && !searching && !error && (
        <EmptyState icon={<Search size={30} />} title="Совпадений нет">
          Попробуйте корень слова или более общий термин: «указател» вместо «указателями».
        </EmptyState>
      )}
    </div>
  );
}
