import { loadCourse, summarize } from '@course/course-engine';
import { BookmarksPage } from '@/components/learning-pages';
export const metadata = { title: 'Закладки' };
export default function Page() {
  return <BookmarksPage lessons={loadCourse().lessons.map(summarize)} />;
}
