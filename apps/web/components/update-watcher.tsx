'use client';
import { useEffect } from 'react';

const currentBuild = process.env.NEXT_PUBLIC_BUILD_STAMP;
const pollMs = 10_000;

/** Ученик печатает: перезагрузка подождёт, пока фокус не уйдёт из поля ввода. */
function isEditing(): boolean {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) return false;
  return (
    element.isContentEditable ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLInputElement &&
      !['button', 'checkbox', 'radio'].includes(element.type)) ||
    element.closest('.monaco-editor') !== null
  );
}

/** Перезагружает вкладку, когда сервер начинает отдавать новую сборку. */
export function UpdateWatcher() {
  useEffect(() => {
    if (!currentBuild) return;
    let pending = false;
    let checking = false;
    const reloadIfIdle = () => {
      if (pending && (document.hidden || !isEditing())) window.location.reload();
    };
    const check = async () => {
      if (checking || pending) return reloadIfIdle();
      checking = true;
      try {
        const response = await fetch('/api/version', { cache: 'no-store' });
        if (!response.ok) return;
        const { build } = (await response.json()) as { build?: unknown };
        if (typeof build === 'string' && build !== currentBuild) pending = true;
      } catch {
        // Сервер перезапускается после пересборки: проверим на следующем шаге.
      } finally {
        checking = false;
      }
      reloadIfIdle();
    };
    const timer = window.setInterval(() => void check(), pollMs);
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('focusout', reloadIfIdle);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('focusout', reloadIfIdle);
    };
  }, []);
  return null;
}
