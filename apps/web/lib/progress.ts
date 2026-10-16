import type { Prisma } from '@prisma/client';
import { calculateProgress, isLessonComplete, type ProfileState } from '@course/shared';
import { loadCourse, type LoadedCourse } from '@course/course-engine';
import { db } from './db';

type ProgressCourse = Pick<LoadedCourse, 'course' | 'lessons' | 'byId'>;

export async function syncCourseProgress(
  transaction: Prisma.TransactionClient,
  userId: string,
  loaded: ProgressCourse,
  lastLessonId?: string,
) {
  const { course, lessons } = loaded;
  const records = await transaction.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessons.map((l) => l.id) } },
  });
  const aggregate = calculateProgress(
    lessons,
    records.map((p) => ({ ...p, completedAt: p.completedAt?.toISOString() ?? null })),
  );
  const value = {
    totalLessons: aggregate.total,
    completedLessons: aggregate.completed,
    percent: aggregate.percent,
    ...(lastLessonId ? { lastLessonId } : {}),
  };
  return transaction.courseProgress.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    create: { userId, courseId: course.id, ...value },
    update: value,
  });
}
export async function profileState(userId: string): Promise<ProfileState> {
  const loaded = loadCourse();
  await db.$transaction((tx) => syncCourseProgress(tx, userId, loaded));
  const profile = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      settings: true,
      progress: true,
      bookmarks: true,
      _count: { select: { attempts: true } },
    },
  });
  const active = new Set(loaded.lessons.map((l) => l.id));
  const recent = await db.studyDay.findMany({
    where: {
      userId,
      day: { gte: new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10) },
    },
    select: { day: true },
    orderBy: { day: 'asc' },
  });
  return {
    name: profile.name,
    onboarded: profile.onboarded,
    dailyGoal: profile.settings?.dailyGoal ?? 30,
    compiler: profile.settings?.compiler === 'clang' ? 'clang' : 'gcc',
    fontSize: profile.settings?.fontSize ?? 15,
    lastLessonId:
      profile.lastLessonId && active.has(profile.lastLessonId) ? profile.lastLessonId : null,
    attempts: profile._count.attempts,
    bookmarks: profile.bookmarks.filter((b) => active.has(b.lessonId)).map((b) => b.lessonId),
    progress: profile.progress
      .filter((p) => active.has(p.lessonId))
      .map(({ lessonId, read, quizPassed, practicePassed, completedAt }) => ({
        lessonId,
        read,
        quizPassed,
        practicePassed,
        completedAt: completedAt?.toISOString() ?? null,
      })),
    studyDays: recent.map((record) => record.day),
  };
}
export async function recordProgress(
  transaction: Prisma.TransactionClient,
  userId: string,
  lessonId: string,
  changes: { read?: true; quizPassed?: true; practicePassed?: true },
  loaded: ProgressCourse,
) {
  await recordStudy(transaction, userId);
  const progress = await transaction.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, ...changes },
    update: changes,
  });
  const completion = loaded.byId.get(lessonId)?.completion ?? 'practice';
  if (
    isLessonComplete(
      { ...progress, completedAt: progress.completedAt?.toISOString() ?? null },
      completion,
    ) &&
    !progress.completedAt
  ) {
    await transaction.lessonProgress.update({
      where: { id: progress.id },
      data: { completedAt: new Date() },
    });
  }
  await transaction.user.update({ where: { id: userId }, data: { lastLessonId: lessonId } });
  await syncCourseProgress(transaction, userId, loaded, lessonId);
}
export async function recordStudy(transaction: Prisma.TransactionClient, userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  await transaction.studyDay.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day },
    update: {},
  });
}
