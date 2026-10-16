import { notFound } from 'next/navigation';
import { loadCourse, lessonNavigation, summarize, toPublicLesson } from '@course/course-engine';
import { LessonWorkspace } from '@/components/lesson-workspace';
export const dynamicParams = false;
export function generateStaticParams() {
  return loadCourse().lessons.map((lesson) => ({ lessonId: lesson.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }) {
  const lesson = loadCourse().byId.get((await params).lessonId);
  return { title: lesson?.title ?? 'Урок не найден', description: lesson?.summary };
}
export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const loaded = loadCourse();
  const { course, lessons, byId } = loaded;
  const lesson = byId.get(lessonId);
  if (!lesson) notFound();
  const { previous, next } = lessonNavigation(lessonId, loaded);
  const courseModule = course.modules.find((m) => m.id === lesson.moduleId)!;
  return (
    <LessonWorkspace
      key={lessonId}
      courseId={course.id}
      lesson={toPublicLesson(lesson)}
      courseModule={courseModule}
      siblings={lessons.filter((l) => l.moduleId === courseModule.id).map(summarize)}
      previous={previous ? summarize(previous) : undefined}
      next={next ? summarize(next) : undefined}
      prerequisites={lesson.effectivePrerequisites.map((id) => summarize(byId.get(id)!))}
    />
  );
}
