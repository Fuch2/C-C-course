import { loadCourse, summarize } from '@course/course-engine';
import { Dashboard } from '@/components/dashboard';
export default function HomePage() {
  const { course, lessons } = loadCourse();
  return <Dashboard course={course} lessons={lessons.map(summarize)} />;
}
