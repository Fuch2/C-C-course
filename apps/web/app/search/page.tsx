import { loadCourse } from '@course/course-engine';
import { SearchPage } from '@/components/learning-pages';
export const metadata = { title: 'Поиск по курсу' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string | string[] }>;
}) {
  const { q, tag } = await searchParams;
  const tags = loadCourse().tags;
  const selected = (Array.isArray(tag) ? tag : tag ? [tag] : []).filter((t) => tags.includes(t));
  return <SearchPage initialQuery={q?.slice(0, 160)} initialTags={selected} tags={tags} />;
}
