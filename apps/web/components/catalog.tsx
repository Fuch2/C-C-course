'use client';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Terminal,
} from 'lucide-react';
import { Badge, ProgressBar } from '@course/ui';
import {
  calculateProgress,
  isLessonComplete,
  type Course,
  type LessonSummary,
} from '@course/shared';
import { useProfile } from './profile-provider';

export function Catalog({
  course,
  lessons,
  compact = false,
}: {
  course: Course;
  lessons: LessonSummary[];
  compact?: boolean;
}) {
  const { profile } = useProfile();
  return (
    <section className="catalog-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ШАГ ЗА ШАГОМ</span>
          <h2>
            {compact
              ? 'Ваша программа'
              : `${course.modules.length} направлений. Одна система знаний.`}
          </h2>
        </div>
        {compact && (
          <Link href="/course" className="text-link">
            Вся программа
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
      <div className="module-grid">
        {course.modules.slice(0, compact ? 6 : undefined).map((courseModule) => {
          const moduleLessons = lessons.filter((l) => l.moduleId === courseModule.id);
          const value = calculateProgress(moduleLessons, profile?.progress).percent;
          const missingModules = course.modules.filter(
            (item) =>
              courseModule.prerequisites.includes(item.id) &&
              !calculateProgress(
                lessons.filter((lesson) => lesson.moduleId === item.id),
                profile?.progress,
              ).complete,
          );
          const locked = missingModules.length > 0;
          const state = locked
            ? 'Заблокировано'
            : value === 100
              ? 'Завершено'
              : value > 0
                ? 'В процессе'
                : 'Не начато';
          const stateClass = locked
            ? 'locked'
            : value === 100
              ? 'complete'
              : value > 0
                ? 'active'
                : 'idle';
          const next =
            moduleLessons.find(
              (l) =>
                !isLessonComplete(
                  profile?.progress.find((p) => p.lessonId === l.id),
                  l.completion,
                ),
            ) ?? moduleLessons[0];
          return (
            <article
              className={`module-card module-${stateClass}`}
              id={`module-${courseModule.id}`}
              key={courseModule.id}
              aria-label={`Модуль ${courseModule.number}: ${courseModule.title}. Состояние: ${state}`}
            >
              <div className="module-card-top">
                <span className="module-icon">
                  {locked ? (
                    <LockKeyhole size={20} />
                  ) : value === 100 ? (
                    <CheckCircle2 size={22} />
                  ) : courseModule.number < 6 ? (
                    <Terminal size={22} />
                  ) : (
                    <Braces size={22} />
                  )}
                </span>
                <span className="module-number">
                  {String(courseModule.number).padStart(2, '0')}
                </span>
                <span className={`module-state module-state-${stateClass}`}>{state}</span>
              </div>
              <Badge
                tone={
                  courseModule.level === 'Начальный'
                    ? 'green'
                    : courseModule.level === 'Средний'
                      ? 'blue'
                      : 'amber'
                }
              >
                {courseModule.level}
              </Badge>
              <h3>{courseModule.title}</h3>
              <p>{courseModule.description}</p>
              <div className="module-metadata">
                <span>
                  <BookOpen size={14} />
                  Уроков: {courseModule.lessons.length}
                </span>
                <span>
                  <Clock3 size={14} />
                  {moduleLessons.reduce((sum, l) => sum + l.minutes, 0)} мин
                </span>
                {value > 0 && <span>{Math.round(value)}%</span>}
              </div>
              <ProgressBar value={value} label={`Прогресс: ${courseModule.title}`} />
              {locked ? (
                <div className="module-lock-note">
                  <LockKeyhole size={14} />
                  Сначала завершите: {missingModules.map((item) => item.title).join(', ')}
                </div>
              ) : next ? (
                <Link className="module-action" href={`/lesson/${next.id}`}>
                  <span>
                    {value === 100
                      ? 'Повторить модуль'
                      : value > 0
                        ? 'Продолжить модуль'
                        : 'Открыть модуль'}
                  </span>
                  <ArrowRight size={17} />
                </Link>
              ) : (
                <p className="helper-text">Уроки этого модуля ещё не опубликованы.</p>
              )}
              <details className="module-lessons" open={!compact || (value > 0 && !locked)}>
                <summary>
                  <span>{compact ? 'Уроки модуля' : 'Содержание модуля'}</span>
                  <small>{moduleLessons.length} уроков</small>
                </summary>
                <ol>
                  {moduleLessons.map((lesson, lessonIndex) => {
                    const done = isLessonComplete(
                      profile?.progress.find((item) => item.lessonId === lesson.id),
                      lesson.completion,
                    );
                    return (
                      <li key={lesson.id}>
                        {locked ? (
                          <span aria-disabled="true">
                            <span>{String(lessonIndex + 1).padStart(2, '0')}</span>
                            {lesson.title}
                            <LockKeyhole size={12} />
                          </span>
                        ) : (
                          <Link href={`/lesson/${lesson.id}`}>
                            <span>
                              {done ? (
                                <Check size={12} />
                              ) : (
                                String(lessonIndex + 1).padStart(2, '0')
                              )}
                            </span>
                            {lesson.title}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
                {courseModule.prerequisites.length > 0 && (
                  <p className="module-prerequisites">
                    Необходимые модули:{' '}
                    {course.modules
                      .filter((module) => courseModule.prerequisites.includes(module.id))
                      .map((module) => module.title)
                      .join(', ')}
                  </p>
                )}
              </details>
            </article>
          );
        })}
      </div>
      <div className="course-footnote">
        <Check size={16} />
        Теория, короткие тесты и проверяемая практика в каждом уроке.
      </div>
    </section>
  );
}
