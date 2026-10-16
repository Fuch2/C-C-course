import { loadCourse, summarize } from '@course/course-engine';
import { json } from '@/lib/http';
export async function GET() {
  const { course, lessons, projects, tags } = loadCourse();
  return json({ course, lessons: lessons.map(summarize), projects, tags });
}
