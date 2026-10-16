'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  Bookmark,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  GraduationCap,
  Layers3,
  Menu,
  Search,
  Settings2,
  Terminal,
  X,
} from 'lucide-react';
import {
  calculateProgress,
  isLessonComplete,
  type Course,
  type LessonSummary,
} from '@course/shared';
import { ProgressBar } from '@course/ui';
import { useProfile } from './profile-provider';
import { CommandPalette } from './command-palette';

const navigation = [
  { href: '/', label: 'Моё обучение', icon: GraduationCap },
  { href: '/course', label: 'Каталог курсов', icon: BookOpen },
  { href: '/projects', label: 'Проекты', icon: Layers3 },
  { href: '/playground', label: 'Песочница', icon: Code2 },
  { href: '/progress', label: 'Мой прогресс', icon: ChartNoAxesCombined },
  { href: '/bookmarks', label: 'Закладки', icon: Bookmark },
];
export function Shell({
  children,
  course,
  lessons,
}: {
  children: React.ReactNode;
  course: Course;
  lessons: LessonSummary[];
}) {
  const pathname = usePathname();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const lesson = lessons.find((l) => pathname === `/lesson/${l.id}`);
  const percent = calculateProgress(lessons, profile?.progress).percent;
  const current =
    lesson?.title ??
    navigation.find((item) => item.href === pathname)?.label ??
    (pathname === '/search'
      ? 'Поиск'
      : pathname.startsWith('/course/')
        ? 'Программа курса'
        : 'Настройки');
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k' &&
        !(event.target as HTMLElement).closest('.monaco-editor')
      ) {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === 'Escape') {
        setMenuOpen(false);
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  return (
    <div className="app-shell">
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        courseId={course.id}
      />
      <a className="skip-link" href="#main-content">
        Перейти к содержимому
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть навигацию"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-symbol">
            <Terminal size={23} />
          </span>
          <span>
            Код<span className="brand-slash"> / </span>Система<small>Школа C и C++</small>
          </span>
        </Link>
        <button
          className="icon-button mobile-close"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="sidebar-scroll">
          <nav className="main-navigation" aria-label="Основная навигация">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${pathname === href ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {pathname === href && <ChevronRight size={14} />}
              </Link>
            ))}
          </nav>
          <Link
            className="sidebar-course"
            href={`/course/${course.id}`}
            onClick={() => setMenuOpen(false)}
          >
            <span className="tiny-label">ТЕКУЩИЙ КУРС</span>
            <strong>C / C++</strong>
            <span>
              От основ до системного
              <br />
              программирования
            </span>
          </Link>
          <nav className="module-tree" aria-label="Модули и уроки курса">
            {course.modules.map((courseModule) => {
              const finished = calculateProgress(
                lessons.filter((l) => l.moduleId === courseModule.id),
                profile?.progress,
              ).complete;
              return (
                <details
                  key={courseModule.id}
                  open={
                    course.modules.length === 1 || courseModule.lessons.includes(lesson?.id ?? '')
                  }
                >
                  <summary>
                    <span className={`module-tree-index ${finished ? 'finished' : ''}`}>
                      {finished ? (
                        <Check size={13} />
                      ) : (
                        String(courseModule.number).padStart(2, '0')
                      )}
                    </span>
                    <span>{courseModule.title}</span>
                    <ChevronDown size={14} />
                  </summary>
                  <ol>
                    {courseModule.lessons.map((id) => {
                      const item = lessons.find((l) => l.id === id)!;
                      const done = isLessonComplete(
                        profile?.progress.find((p) => p.lessonId === id),
                        item.completion,
                      );
                      return (
                        <li key={id}>
                          <Link
                            href={`/lesson/${id}`}
                            className={lesson?.id === id ? 'current' : ''}
                            aria-current={lesson?.id === id ? 'page' : undefined}
                            onClick={() => setMenuOpen(false)}
                          >
                            {done ? <Check className="finished" size={14} /> : <Circle size={8} />}
                            <span>{item.title}</span>
                            <span className="sr-only">{done ? 'Пройден' : 'Не завершён'}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </details>
              );
            })}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <Link
            className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}
            href="/settings"
            onClick={() => setMenuOpen(false)}
          >
            <Settings2 size={18} />
            Настройки
          </Link>
          <div className="local-label">
            <span />
            Локальный пользователь
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <nav className="breadcrumb" aria-label="Хлебные крошки">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
            >
              <Menu size={21} />
            </button>
            <Link href={lesson ? `/course/${course.id}` : '/'}>
              {lesson ? 'C / C++' : 'Главная'}
            </Link>
            <ChevronRight size={14} />
            <strong aria-current="page">{current}</strong>
          </nav>
          <button
            type="button"
            className="search-trigger"
            onClick={() => setPaletteOpen(true)}
            aria-label="Открыть поиск по курсу"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <Search size={17} />
            <span>Поиск</span>
            <kbd>⌘ K</kbd>
          </button>
          <Link
            href="/progress"
            className="header-progress"
            aria-label={`Общий прогресс курса: ${percent}%`}
          >
            <span>{percent}% курса</span>
            <ProgressBar value={percent} label="Общий прогресс" />
          </Link>
          <Link className="avatar" href="/settings" aria-label="Открыть профиль">
            {profile?.name.slice(0, 1).toLocaleUpperCase('ru') ?? 'Л'}
          </Link>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
