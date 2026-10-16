'use client';
import { useEffect } from 'react';
import { z } from 'zod';
import { calculateProgress, type LessonSummary, type ProfileState } from '@course/shared';
import { api } from '@/lib/client';

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<unknown>;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
/** Необязательная поддержка браузеров с WebMCP; обычная навигация не зависит от неё. */
export function LearningTools({ lessons }: { lessons: LessonSummary[] }) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'get_course_progress',
            title: 'Получить прогресс курса',
            description:
              'Прочитать сохранённый прогресс локального пользователя без завершения уроков и запуска программ.',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            async execute(input) {
              z.object({}).strict().parse(input);
              const state = await api<ProfileState>('/api/profile');
              const progress = calculateProgress(lessons, state.progress);
              return {
                totalLessons: progress.total,
                completedLessons: progress.completed,
                percent: progress.percent,
                lastLessonId: state.lastLessonId,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        console.warn('WebMCP: регистрация инструмента недоступна.');
      });
    } catch {
      console.warn('WebMCP: браузер не поддерживает регистрацию инструмента.');
    }
    return () => lifecycle.abort();
  }, [lessons]);
  return null;
}
