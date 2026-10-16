'use client';
import Link from 'next/link';
import { ArrowRight, Clock3, Code2, Layers3, Route } from 'lucide-react';
import {
  calculateProgress,
  type Course,
  type LessonSummary,
  lessonPercent,
  isLessonComplete,
} from '@course/shared';
import { ProgressBar } from '@course/ui';
import { useProfile } from './profile-provider';
import { Catalog } from './catalog';

export function Dashboard({ course, lessons }: { course: Course; lessons: LessonSummary[] }) {
  const { profile } = useProfile();
  const completed = new Set(
    lessons
      .filter((l) =>
        isLessonComplete(
          profile?.progress.find((p) => p.lessonId === l.id),
          l.completion,
        ),
      )
      .map((l) => l.id),
  );
  const current =
    lessons.find((l) => l.id === profile?.lastLessonId && !completed.has(l.id)) ??
    lessons.find((l) => !completed.has(l.id)) ??
    lessons[lessons.length - 1]!;
  const currentModule = course.modules.find((m) => m.id === current.moduleId)!;
  const value = lessonPercent(
    profile?.progress.find((p) => p.lessonId === current.id),
    current.completion,
  );
  const courseProgress = calculateProgress(lessons, profile?.progress);
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  return (
    <div className="page-content">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">ВАШ КУРС</span>
          <h1>{course.title}</h1>
          <p className="dashboard-subtitle">{course.subtitle}</p>
          <p className="dashboard-description">{course.description}</p>
        </div>
        <aside className="dashboard-progress" aria-label="Общий прогресс курса">
          <div>
            <span>Общий прогресс</span>
            <strong>{courseProgress.percent}%</strong>
          </div>
          <ProgressBar value={courseProgress.percent} label="Общий прогресс курса" />
          <small>
            Завершено {courseProgress.completed} из {courseProgress.total} уроков
          </small>
        </aside>
      </div>
      <section className="continue-card">
        <div className="continue-info">
          <span className="light-eyebrow">
            <span />
            {profile?.lastLessonId ? 'ПРОДОЛЖИМ ВАШ ПУТЬ' : 'НАЧНЁМ С ОСНОВ'}
          </span>
          <h2>{current.title}</h2>
          <p>{current.summary}</p>
          <div className="continue-meta">
            <span>
              <Route size={15} />
              Модуль {String(currentModule.number).padStart(2, '0')} · {currentModule.title}
            </span>
            <span>
              <Clock3 size={15} />
              {current.minutes} минут
            </span>
          </div>
          <span className="resume-label">{value > 0 ? `${value}% урока завершено` : ''}</span>
          <Link className="button button-lime" href={`/lesson/${current.id}`}>
            {courseProgress.percent > 0 ? 'Продолжить обучение' : 'Начать обучение'}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="code-preview" aria-label="Пример программы на C">
          <div className="code-preview-top">
            <span />
            <span />
            <span />
            <p>main.c</p>
          </div>
          <pre>
            <span className="line-number">1</span>
            <span className="code-purple">#include</span>{' '}
            <span className="code-green">&lt;stdio.h&gt;</span>
            {'\n'}
            <span className="line-number">2</span>
            {'\n'}
            <span className="line-number">3</span>
            <span className="code-blue">int</span> main(<span className="code-blue">void</span>){' '}
            {'{\n'}
            <span className="line-number">4</span> printf(
            <span className="code-green">{'"Поехали!\\n"'}</span>);{'\n'}
            <span className="line-number">5</span> <span className="code-purple">return</span>{' '}
            <span className="code-orange">0</span>;{'\n'}
            <span className="line-number">6</span>
            {'}'}
            <span className="code-caret" />
          </pre>
          <div className="code-preview-footer">
            <span className="green-dot" />
            Практика начинается здесь<span>C17</span>
          </div>
        </div>
      </section>
      <div className="stats-row">
        <div>
          <span className="stat-icon">
            <Layers3 size={21} />
          </span>
          <strong>
            {course.modules.length}
            <small>
              {course.modules.length === 1 ? 'модуль в программе' : 'модулей в программе'}
            </small>
          </strong>
        </div>
        <div>
          <span className="stat-icon">
            <Code2 size={21} />
          </span>
          <strong>
            {completed.size} / {lessons.length}
            <small>уроков завершено</small>
          </strong>
        </div>
        <div>
          <span className="stat-icon">
            <Clock3 size={21} />
          </span>
          <strong>
            {profile?.dailyGoal ?? 30} минут в день<small>ваш учебный ритм</small>
          </strong>
        </div>
        <div>
          <span className="stat-icon">
            <Clock3 size={21} />
          </span>
          <strong>
            {totalMinutes} минут<small>примерное время курса</small>
          </strong>
        </div>
      </div>
      <Catalog course={course} lessons={lessons} compact />
    </div>
  );
}
