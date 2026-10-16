import { z } from 'zod';
import { loadCourse, searchCourse, searchCourseItems } from '@course/course-engine';
import { json, apiError, ApiError } from '@/lib/http';
const searchSchema = z.strictObject({
  q: z.string().max(160),
  tags: z.array(z.string().trim().min(1).max(80)).max(40),
});
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const parsed = searchSchema.safeParse({ q: params.get('q') ?? '', tags: params.getAll('tag') });
    if (!parsed.success) throw new ApiError(400, 'Проверьте длину запроса и выбранные теги.');
    const { q, tags } = parsed.data;
    const loaded = loadCourse();
    return json({
      results: searchCourse(q, loaded, tags),
      items: searchCourseItems(q, loaded, tags),
      tags: loaded.tags,
    });
  } catch (error) {
    return apiError(error);
  }
}
