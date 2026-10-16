import type { LessonProgress } from './index';
type Progress = Pick<LessonProgress, 'read' | 'quizPassed' | 'practicePassed'> & {
  completedAt?: string | null;
};
type ProgressLesson = { id: string; completion: 'reading' | 'practice' };
export function isLessonComplete(
  progress?: Progress,
  completion: ProgressLesson['completion'] = 'practice',
): boolean {
  return (
    !!progress &&
    (!!progress.completedAt ||
      (progress.read &&
        (completion === 'reading' || (progress.quizPassed && progress.practicePassed))))
  );
}
export function lessonPercent(
  progress?: Progress,
  completion: ProgressLesson['completion'] = 'practice',
): number {
  if (isLessonComplete(progress, completion)) return 100;
  if (!progress || completion === 'reading') return 0;
  return (
    Number(progress.read) * 20 +
    Number(progress.quizPassed) * 30 +
    Number(progress.practicePassed) * 50
  );
}
/** Равный вес уроков; посторонние записи игнорируются, повторные ID не увеличивают вес. */
export function calculateProgress(
  lessons: readonly ProgressLesson[],
  records: readonly LessonProgress[] = [],
) {
  const unique = [...new Map(lessons.map((l) => [l.id, l])).values()];
  const byId = new Map(records.map((p) => [p.lessonId, p]));
  const total = unique.length;
  const completed = unique.filter((l) => isLessonComplete(byId.get(l.id), l.completion)).length;
  return {
    total,
    completed,
    percent: total
      ? Math.round(
          unique.reduce((sum, l) => sum + lessonPercent(byId.get(l.id), l.completion), 0) / total,
        )
      : 0,
    complete: total > 0 && completed === total,
  };
}
export const courseProgress = calculateProgress;
export const moduleProgress = calculateProgress;
export function missingPrerequisites(
  ids: readonly string[],
  lessons: readonly ProgressLesson[],
  records: readonly LessonProgress[] = [],
) {
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const progress = new Map(records.map((p) => [p.lessonId, p]));
  return [...new Set(ids)].filter(
    (id) => !byId.has(id) || !isLessonComplete(progress.get(id), byId.get(id)?.completion),
  );
}
