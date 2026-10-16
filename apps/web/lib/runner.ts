import { readFileSync } from 'node:fs';
import {
  sandboxResultSchema,
  runResponseSchema,
  executionFailure,
  type RunRequest,
  type RunResponse,
  type SandboxRequest,
} from '@course/shared';
import { ApiError } from './http';

export function runnerToken(): string {
  return process.env.RUNNER_TOKEN_FILE
    ? readFileSync(process.env.RUNNER_TOKEN_FILE, 'utf8').trim()
    : (process.env.RUNNER_TOKEN ?? '');
}
export async function runCode(input: SandboxRequest) {
  const token = runnerToken();
  if (token.length < 32)
    throw new ApiError(
      503,
      'Среда выполнения не настроена. Запустите сервисы через Docker Compose.',
    );
  let response: Response;
  try {
    response = await fetch(`${process.env.RUNNER_URL ?? 'http://127.0.0.1:4001'}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(125_000),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      503,
      'Среда выполнения недоступна. Проверьте, запущены ли Docker и runner, затем повторите попытку.',
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      response.status === 429 ? 429 : 503,
      typeof body?.error === 'string'
        ? body.error
        : 'Среда выполнения не смогла обработать запрос.',
    );
  }
  const value = sandboxResultSchema.safeParse(await response.json());
  if (!value.success) throw new ApiError(502, 'Среда выполнения вернула некорректные данные.');
  return value.data;
}

export async function runPlayground(
  input: RunRequest,
): Promise<{ result: RunResponse; httpStatus: number }> {
  try {
    const response = await fetch(`${process.env.RUNNER_URL ?? 'http://127.0.0.1:4001'}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${runnerToken()}` },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(125_000),
      cache: 'no-store',
    });
    const parsed = runResponseSchema.safeParse(await response.json());
    if (!parsed.success)
      return { httpStatus: 502, result: executionFailure('Среда вернула некорректный ответ.') };
    return { httpStatus: response.status, result: parsed.data };
  } catch {
    return {
      httpStatus: 503,
      result: executionFailure('Среда выполнения недоступна. Проверьте Docker и runner.'),
    };
  }
}

const inflight = new Set<string>();
const recent = new Map<string, number[]>();
export async function limitSubmission<T>(userId: string, job: () => Promise<T>): Promise<T> {
  if (inflight.has(userId)) throw new ApiError(429, 'Дождитесь завершения текущего запуска.');
  const now = Date.now();
  // Удаляем истёкшие записи, чтобы список сессий не рос бесконечно.
  for (const [id, times] of recent)
    if (!times.some((time) => now - time < 60_000)) recent.delete(id);
  const times = (recent.get(userId) ?? []).filter((time) => now - time < 60_000);
  if (times.length >= 20) throw new ApiError(429, 'Слишком много запусков. Подождите минуту.');
  recent.set(userId, [...times, now]);
  inflight.add(userId);
  try {
    return await job();
  } finally {
    inflight.delete(userId);
  }
}
