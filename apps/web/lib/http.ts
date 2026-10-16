import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assertOrigin(request: Request): void {
  const configured = process.env.APP_ORIGIN ?? 'http://localhost:3000';
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') throw new ApiError(403, 'Запрос из другого источника запрещён.');
  if (!origin || origin === configured) return;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = null;
  }
  if (!originHost || originHost !== host)
    throw new ApiError(403, 'Запрос из другого источника запрещён.');
}
export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = 100_000,
): Promise<T> {
  assertOrigin(request);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new ApiError(415, 'Ожидается JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Пустой запрос.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, 'Запрос слишком большой.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let json: unknown;
  try {
    json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'Некорректный JSON.');
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success)
    throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Проверьте введённые данные.');
  return parsed.data;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  console.error('Ошибка API:', error instanceof Error ? error.name : 'unknown');
  return json(
    {
      error:
        'Не удалось сохранить или получить данные. Проверьте доступность сервисов и попробуйте снова.',
    },
    500,
  );
}
