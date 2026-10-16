'use client';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock3, Layers3 } from 'lucide-react';
import {
  calculateProgress,
  isLessonComplete,
  type Course,
  type LessonSummary,
} from '@course/shared';
import { ProgressBar } from '@course/ui';
import { useProfile } from './profile-provider';
import { Catalog } from './catalog';

export function CourseOverview({
  course,
  lessons,
  detail = false,
}: {
  course: Course;
  lessons: LessonSummary[];
  detail?: boolean;
}) {
  const { profile } = useProfile();
  const completed = lessons.filter((l) =>
    isLessonComplete(
      profile?.progress.find((p) => p.lessonId === l.id),
      l.completion,
    ),
  ).length;
  const percent = calculateProgress(lessons, profile?.progress).percent;
  const next =
    lessons.find(
      (l) =>
        !isLessonComplete(
          profile?.progress.find((p) => p.lessonId === l.id),
          l.completion,
        ),
    ) ?? lessons[0]!;
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{detail ? 'ПРОГРАММА КУРСА' : 'УЧЕБНОЕ ПРОСТРАНСТВО'}</span>
          <h1>{detail ? course.title : 'Каталог курсов'}</h1>
          <p>
            {detail
              ? course.subtitle
              : 'Изучайте устройство программ — от первой строки C до системного мышления.'}
          </p>
        </div>
      </div>
      <section className="course-overview-card">
        {!detail && (
          <>
            <span className="course-tag">C / C++</span>
            <h2>
              <Link href={`/course/${course.id}`}>{course.title}</Link>
            </h2>
            <p>{course.subtitle}</p>
          </>
        )}
        {detail && <p className="course-detail-description">{course.description}</p>}
        <div className="course-facts">
          <span>
            <Layers3 size={18} />
            Модулей: {course.modules.length}
          </span>
          <span>
            <BookOpen size={18} />
            Уроков: {lessons.length}
          </span>
          <span>
            <Clock3 size={18} />
            Около {lessons.reduce((sum, l) => sum + l.minutes, 0)} минут
          </span>
        </div>
        <div className="course-progress-line">
          <span>
            Пройдено {completed} из {lessons.length} уроков
          </span>
          <strong>{percent}%</strong>
        </div>
        <ProgressBar value={percent} label="Прогресс курса" />
        <div className="course-overview-actions">
          <Link
            className="button button-primary"
            href={detail ? `/lesson/${next.id}` : `/course/${course.id}`}
          >
            {detail
              ? percent === 100
                ? 'Повторить урок'
                : percent > 0
                  ? 'Продолжить обучение'
                  : 'Начать обучение'
              : 'Открыть курс'}
            <ArrowRight size={17} />
          </Link>
          <span className="helper-text">
            {lessons.length} уроков · теория, проверка знаний и практика
          </span>
        </div>
      </section>
      {detail && <Catalog course={course} lessons={lessons} />}
    </div>
  );
}
