'use client';
import Link from 'next/link';
import { useEffect, useState, type KeyboardEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  ListChecks,
} from 'lucide-react';
import {
  lessonPercent,
  isLessonComplete,
  difficultyLabels,
  missingPrerequisites,
  type CourseModule,
  type LessonSummary,
  type PublicLesson,
} from '@course/shared';
import { ProgressBar } from '@course/ui';
import { post, errorMessage } from '@/lib/client';
import { useProfile } from './profile-provider';
import { LessonContent } from './lesson-content';
import { Practice } from './practice';
import { Quiz } from './quiz';

const tabs = [
  { id: 'theory', label: 'Урок', icon: BookOpen },
  { id: 'quiz', label: 'Проверка знаний', icon: ListChecks },
  { id: 'practice', label: 'Практика', icon: Code2 },
] as const;
type Tab = (typeof tabs)[number]['id'];
/** «урок», «урока», «уроков» для числа n. */
function pluralLessons(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return 'урок';
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'урока';
  return 'уроков';
}

export function LessonWorkspace({
  lesson,
  courseModule,
  siblings,
  previous,
  next,
  prerequisites,
  courseId,
}: {
  lesson: PublicLesson;
  courseModule: CourseModule;
  siblings: LessonSummary[];
  previous?: LessonSummary;
  next?: LessonSummary;
  prerequisites: LessonSummary[];
  courseId: string;
}) {
  const { profile, refresh } = useProfile();
  const ready = !!profile;
  const [tab, setCurrentTab] = useState<Tab>('theory');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercises = [lesson.exercise, ...(lesson.additionalExercises ?? [])];
  const [practiceStarted, setPracticeStarted] = useState(false);
  const setTab = (next: Tab) => {
    if (next === 'practice') setPracticeStarted(true);
    setCurrentTab(next);
  };
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const progress = profile?.progress.find((p) => p.lessonId === lesson.id);
  const bookmarked = !!profile?.bookmarks.includes(lesson.id);
  useEffect(() => {
    if (ready) void post(`/api/lessons/${lesson.id}/visit`).catch((e) => setError(errorMessage(e)));
  }, [ready, lesson.id]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('part') === 'practice') {
      requestAnimationFrame(() => {
        setPracticeStarted(true);
        setCurrentTab('practice');
        const requested = new URLSearchParams(window.location.search).get('exercise');
        setExerciseIndex(
          Math.max(
            0,
            [lesson.exercise, ...(lesson.additionalExercises ?? [])].findIndex(
              (e) => e.id === requested,
            ),
          ),
        );
      });
    }
  }, [lesson.exercise, lesson.additionalExercises]);
  const missingIds = missingPrerequisites(
    lesson.effectivePrerequisites,
    prerequisites,
    profile?.progress,
  );
  const missing = prerequisites.filter((l) => missingIds.includes(l.id));
  const headings = lesson.sections;
  const changeTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let target = index;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[target]!.id);
    document.getElementById(`tab-${tabs[target]!.id}`)?.focus();
  };
  return (
    <div className="workspace">
      <nav className="lesson-top" aria-label="Хлебные крошки урока">
        <Link href={`/course/${courseId}`} className="text-link">
          <ArrowLeft size={15} />
          Программа курса
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span>
          Модуль {String(courseModule.number).padStart(2, '0')} · {courseModule.title}
        </span>
        <ChevronRight size={13} aria-hidden="true" />
        <strong aria-current="page">{lesson.title}</strong>
      </nav>
      <div className="lesson-heading">
        <div>
          <span className="eyebrow">
            УРОК {siblings.findIndex((l) => l.id === lesson.id) + 1} ИЗ {siblings.length}
          </span>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
          <div className="lesson-meta">
            <span>
              <Clock3 size={15} />
              {lesson.minutes} минут
            </span>
            <span>{lesson.standard.toUpperCase()}</span>
            <span>{difficultyLabels[lesson.difficulty]}</span>
            {lesson.tags.map((tag) => (
              <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                {tag}
              </Link>
            ))}
            {isLessonComplete(progress, lesson.completion) && (
              <span className="completed">
                <CheckCircle2 size={16} />
                Урок завершён
              </span>
            )}
          </div>
        </div>
        <button
          className={`bookmark-button ${bookmarked ? 'saved' : ''}`}
          aria-label={bookmarked ? 'Убрать из закладок' : 'В закладки'}
          aria-pressed={bookmarked}
          disabled={pending || !ready}
          onClick={async () => {
            setPending(true);
            setError('');
            try {
              await post(`/api/lessons/${lesson.id}/bookmark`, { saved: !bookmarked });
              await refresh();
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setPending(false);
            }
          }}
        >
          <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="workspace-grid">
        <div className="lesson-main">
          <div className="lesson-tabs" role="tablist" aria-label="Части урока">
            {tabs.map(({ id, label, icon: Icon }, index) => (
              <button
                key={id}
                id={`tab-${id}`}
                role="tab"
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                onKeyDown={(event) => changeTab(event, index)}
                onClick={() => setTab(id)}
                className={tab === id ? 'selected' : ''}
              >
                <Icon size={16} />
                {label}
                {(id === 'theory'
                  ? progress?.read
                  : id === 'quiz'
                    ? progress?.quizPassed
                    : progress?.practicePassed) && <Check size={14} />}
              </button>
            ))}
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div
            id="panel-theory"
            role="tabpanel"
            aria-labelledby="tab-theory"
            hidden={tab !== 'theory'}
          >
            <div className="lesson-body">
              {missing.length > 0 && (
                <div className="prerequisite-note">
                  Для уверенного старта полезен урок «
                  <Link href={`/lesson/${missing[0]!.id}`}>{missing[0]!.title}</Link>»
                  {missing.length > 1 &&
                    ` и ещё ${missing.length - 1} ${pluralLessons(missing.length - 1)} перед ним`}
                  . Можно изучать темы и в своём порядке.
                </div>
              )}
              <div className="objectives">
                <h2>После урока вы сможете</h2>
                <ul>
                  {lesson.objectives.map((objective) => (
                    <li key={objective}>
                      <Check size={15} />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
              {tab === 'theory' && (
                <LessonContent
                  document={lesson.document}
                  lesson={lesson}
                  onPractice={() => setTab('practice')}
                />
              )}
              <div className="reading-done">
                <span>
                  {progress?.read
                    ? 'Теория прочитана — закрепите её на практике.'
                    : 'Разобрались с теорией? Зафиксируем этот шаг.'}
                </span>
                <button
                  className="button button-primary"
                  disabled={pending || !ready}
                  onClick={async () => {
                    setPending(true);
                    setError('');
                    try {
                      await post(`/api/lessons/${lesson.id}/read`);
                      await refresh();
                      if (lesson.completion !== 'reading') setTab('quiz');
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    } catch (e) {
                      setError(errorMessage(e));
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  {pending
                    ? 'Сохраняем…'
                    : lesson.completion === 'reading'
                      ? isLessonComplete(progress, lesson.completion)
                        ? 'Урок завершён'
                        : 'Завершить урок'
                      : progress?.read
                        ? 'К проверке знаний'
                        : 'Прочитано. К вопросам'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
          <div id="panel-quiz" role="tabpanel" aria-labelledby="tab-quiz" hidden={tab !== 'quiz'}>
            <Quiz lesson={lesson} />
            <div className="tab-next">
              <button className="button button-secondary" onClick={() => setTab('practice')}>
                Перейти к практике
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div
            id="panel-practice"
            role="tabpanel"
            aria-labelledby="tab-practice"
            hidden={tab !== 'practice'}
          >
            {practiceStarted && tab === 'practice' && (
              <>
                <nav aria-label="Задания урока" className="tag-filters">
                  {exercises.map((exercise, index) => (
                    <button
                      type="button"
                      key={exercise.id}
                      aria-pressed={exerciseIndex === index}
                      onClick={() => setExerciseIndex(index)}
                    >
                      Задание {index + 1}: {exercise.title}
                    </button>
                  ))}
                </nav>
                {exercises.length > 1 && (
                  <p className="helper-text">
                    Для завершения практики решите все {exercises.length} задания. Черновики и
                    история сохраняются отдельно.
                  </p>
                )}
                <Practice
                  key={exercises[exerciseIndex]!.id}
                  lesson={{ ...lesson, exercise: exercises[exerciseIndex]! }}
                />
              </>
            )}
          </div>
          <div className="lesson-pagination">
            {previous ? (
              <Link href={`/lesson/${previous.id}`}>
                <ArrowLeft size={17} />
                <span>
                  <small>Предыдущий урок</small>
                  {previous.title}
                </span>
              </Link>
            ) : (
              <span className="pagination-disabled" aria-disabled="true">
                ← Предыдущий урок
              </span>
            )}
            {next ? (
              <Link href={`/lesson/${next.id}`}>
                <span>
                  <small>Следующий урок</small>
                  {next.title}
                </span>
                <ArrowRight size={17} />
              </Link>
            ) : (
              <span className="pagination-disabled" aria-disabled="true">
                Следующий урок →
              </span>
            )}
          </div>
        </div>
        <aside className="lesson-aside">
          <section className="lesson-progress">
            <span className="eyebrow">ВАШ ПРОГРЕСС</span>
            <strong>
              {lessonPercent(progress, lesson.completion)}
              <small>%</small>
            </strong>
            <ProgressBar
              value={lessonPercent(progress, lesson.completion)}
              label="Прогресс текущего урока"
            />
            <ul>
              <li className={progress?.read ? 'done' : ''}>
                <CheckCircle2 size={15} />
                Теория<span>{lesson.completion === 'reading' ? 'Урок' : '20%'}</span>
              </li>
              <li className={progress?.quizPassed ? 'done' : ''}>
                <CheckCircle2 size={15} />
                Проверка знаний<span>{lesson.completion === 'reading' ? 'Доп.' : '30%'}</span>
              </li>
              <li className={progress?.practicePassed ? 'done' : ''}>
                <CheckCircle2 size={15} />
                Практика<span>{lesson.completion === 'reading' ? 'Доп.' : '50%'}</span>
              </li>
            </ul>
          </section>
          {tab === 'theory' && (
            <nav aria-label="Содержание урока" className="lesson-toc">
              <h2>В этом уроке</h2>
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  style={{ paddingLeft: `${Math.max(0, heading.depth - 2) * 12}px` }}
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          )}
          <nav className="lesson-siblings" aria-label="Уроки модуля">
            <h2>{courseModule.title}</h2>
            {siblings.map((l, index) => (
              <Link
                key={l.id}
                aria-current={l.id === lesson.id ? 'page' : undefined}
                href={`/lesson/${l.id}`}
                className={l.id === lesson.id ? 'current' : ''}
              >
                <span>
                  {isLessonComplete(
                    profile?.progress.find((p) => p.lessonId === l.id),
                    l.completion,
                  ) ? (
                    <Check size={13} />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>
                {l.title}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
