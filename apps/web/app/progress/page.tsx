import { loadCourse, summarize } from '@course/course-engine';
import { ProgressPage } from '@/components/learning-pages';
export const metadata = { title: 'Мой прогресс' };
export default function Page() {
  const { course, lessons } = loadCourse();
  return <ProgressPage course={course} lessons={lessons.map(summarize)} />;
}
