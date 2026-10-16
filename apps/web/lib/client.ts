export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({ error: 'Сервер вернул неожиданный ответ.' }));
  if (!response.ok)
    throw new Error(
      typeof result.error === 'string' ? result.error : 'Не удалось выполнить запрос.',
    );
  return result as T;
}
export const post = <T>(path: string, body: unknown = {}) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить действие. Попробуйте ещё раз.';
}
