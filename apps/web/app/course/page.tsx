import { loadCourse, summarize } from '@course/course-engine';
import { CourseOverview } from '@/components/course-overview';
export const metadata = { title: 'Каталог курсов' };
export default function CoursePage() {
  const { course, lessons } = loadCourse();
  return <CourseOverview course={course} lessons={lessons.map(summarize)} />;
}
