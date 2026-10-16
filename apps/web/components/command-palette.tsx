'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowRight, BookOpen, Boxes, Code2, FileText, Search, X } from 'lucide-react';
import type { CourseSearchItem } from '@course/shared';
import { api, errorMessage } from '@/lib/client';

type PaletteItem = Omit<CourseSearchItem, 'kind'> & {
  kind: CourseSearchItem['kind'] | 'navigation';
};
const getQuickLinks = (courseId: string): PaletteItem[] => [
  {
    id: 'quick-course',
    kind: 'navigation',
    title: 'Программа курса',
    description: 'Все модули и уроки',
    href: `/course/${courseId}`,
    moduleTitle: 'Быстрый переход',
  },
  {
    id: 'quick-playground',
    kind: 'navigation',
    title: 'Песочница C / C++',
    description: 'Запустить код в защищённой среде',
    href: '/playground',
    moduleTitle: 'Быстрый переход',
  },
  {
    id: 'quick-progress',
    kind: 'navigation',
    title: 'Мой прогресс',
    description: 'Статистика обучения по модулям',
    href: '/progress',
    moduleTitle: 'Быстрый переход',
  },
  {
    id: 'quick-bookmarks',
    kind: 'navigation',
    title: 'Закладки',
    description: 'Сохранённые уроки',
    href: '/bookmarks',
    moduleTitle: 'Быстрый переход',
  },
];
const kindLabels: Record<PaletteItem['kind'], string> = {
  navigation: 'Раздел',
  module: 'Модуль',
  lesson: 'Урок',
  section: 'Заголовок',
  exercise: 'Задание',
};
const kindIcons = {
  navigation: ArrowRight,
  module: Boxes,
  lesson: BookOpen,
  section: FileText,
  exercise: Code2,
} as const;

export function CommandPalette({
  open,
  onClose,
  courseId,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseSearchItem[]>([]);
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const items: PaletteItem[] = query.trim() ? results : getQuickLinks(courseId);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input, a[href]',
      );
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trapFocus);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', trapFocus);
    };
  }, [open]);
  useEffect(() => {
    if (!open || !query.trim()) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPending(true);
      setError('');
      try {
        const response = await api<{ items: CourseSearchItem[] }>(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        setResults(response.items);
        setActive(0);
      } catch (cause) {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    }, 140);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    if (!open || !items[active]) return;
    document.getElementById(`command-${items[active].id}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, items, open]);

  if (!open) return null;
  const select = (item?: PaletteItem) => {
    if (!item) return;
    onClose();
    setQuery('');
    router.push(item.href);
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => (value + 1) % Math.max(items.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => (value - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(items[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="command-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-title"
      >
        <h2 id="command-title" className="sr-only">
          Поиск и быстрый переход
        </h2>
        <div className="command-input">
          <Search size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              const value = event.target.value.slice(0, 160);
              setQuery(value);
              setActive(0);
              if (!value.trim()) {
                setResults([]);
                setPending(false);
                setError('');
              }
            }}
            onKeyDown={onKeyDown}
            placeholder="Модуль, урок, термин или задание…"
            aria-label="Поиск по курсу"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={items[active] ? `command-${items[active].id}` : undefined}
          />
          <button type="button" onClick={onClose} aria-label="Закрыть поиск">
            <X size={18} />
          </button>
        </div>
        <div className="command-meta" role="status" aria-live="polite">
          <span>
            {pending ? 'Ищем…' : query.trim() ? `Результатов: ${items.length}` : 'Быстрый переход'}
          </span>
          <span>↑↓ выбрать · Enter открыть · Esc закрыть</span>
        </div>
        {error ? (
          <p className="command-error" role="alert">
            {error}
          </p>
        ) : (
          <div id="command-results" className="command-results" role="listbox">
            {items.map((item, index) => {
              const Icon = kindIcons[item.kind];
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  id={`command-${item.id}`}
                  key={`${item.kind}:${item.id}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(item)}
                >
                  <span className="command-kind-icon">
                    <Icon size={17} />
                  </span>
                  <span className="command-result-copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  <span className="command-kind">{kindLabels[item.kind]}</span>
                </button>
              );
            })}
            {!pending && query.trim() && !items.length && (
              <div className="command-empty">
                <Search size={22} />
                <strong>Ничего не найдено</strong>
                <span>Попробуйте более короткий или общий запрос.</span>
              </div>
            )}
          </div>
        )}
        <footer className="command-footer">
          <Link href={`/search?q=${encodeURIComponent(query.trim())}`} onClick={onClose}>
            Расширенный поиск и фильтры
            <ArrowRight size={15} />
          </Link>
          <kbd>Ctrl / ⌘ K</kbd>
        </footer>
      </section>
    </div>
  );
}
