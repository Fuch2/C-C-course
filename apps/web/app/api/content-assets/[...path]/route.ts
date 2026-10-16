import { readContentAsset } from '@course/course-engine';
export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { body, mime } = readContentAsset((await context.params).path);
    return new Response(new Uint8Array(body), {
      headers: {
        'Content-Type': mime,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return Response.json({ error: 'Изображение не найдено' }, { status: 404 });
  }
}
