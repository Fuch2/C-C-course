import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadCourse } from '@course/course-engine';
import { runResponseSchema } from '@course/shared';
import { correctAnswer } from '../helpers/quiz';
import { browserSession, startTestApp } from '../helpers/app';
const suite = process.env.RUN_DOCKER_TESTS === '1' ? describe : describe.skip;
suite('Полный учебный путь: браузерный API → runner → Docker → SQLite', () => {
  let app: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    app = await startTestApp(true);
  }, 90000);
  afterAll(async () => {
    await app?.cleanup();
  });
  it('завершает практику только после обеих задач C17', async () => {
    const browser = browserSession(app.origin);
    const lesson = loadCourse().byId.get('c17-structure')!;
    const base = `/api/lessons/${lesson.id}`;
    await browser(`${base}/read`, { method: 'POST', body: {} });
    await browser(`${base}/quiz`, {
      method: 'POST',
      body: { answers: lesson.quiz.questions.map(correctAnswer) },
    });
    for (const [index, exercise] of [lesson.exercise, ...lesson.additionalExercises].entries()) {
      const query = `?exercise=${exercise.id}`;
      const result = await browser(`${base}/submit${query}`, {
        method: 'POST',
        body: {
          source: exercise.referenceSolution,
          compiler: 'gcc',
          standard: 'c17',
          stdin: '',
          mode: 'check',
        },
      });
      expect(result.body.status, JSON.stringify(result.body)).toBe('accepted');
      const progress = (await browser('/api/profile')).body.progress.find(
        (p: { lessonId: string }) => p.lessonId === lesson.id,
      );
      expect(progress.practicePassed).toBe(index === 1);
      expect(Boolean(progress.completedAt)).toBe(index === 1);
      expect((await browser(`${base}/stats${query}`)).body.attempts).toBe(1);
      expect((await browser(`${base}/attempts${query}`)).body.attempts).toHaveLength(1);
    }
  }, 120000);
  it('проваленная попытка, разбор, успешная проверка, история и завершение', async () => {
    const browser = browserSession(app.origin);
    const lesson = loadCourse().byId.get('first-program')!;
    await browser('/api/profile', { method: 'POST', body: {} });
    const endpoint = `/api/lessons/${lesson.id}`;
    const options = { compiler: 'gcc', standard: 'c17', stdin: '', mode: 'check' };
    const wrong = await browser(`${endpoint}/submit`, {
      method: 'POST',
      body: { ...options, source: 'int main(void){return 0;}' },
    });
    expect(wrong.response.status, app.logs()).toBe(200);
    expect(wrong.body.status).toBe('wrong_answer');
    const hint = await browser(`${endpoint}/hint`, {
      method: 'POST',
      body: { hintId: lesson.exercise.hints[0]!.id },
    });
    expect(hint.body.text).toBe(lesson.exercise.hints[0]!.text);
    expect(
      (await browser(`${endpoint}/solution`, { method: 'POST', body: { confirmed: true } })).body
        .source,
    ).toBe(lesson.exercise.referenceSolution);
    const accepted = await browser(`${endpoint}/submit`, {
      method: 'POST',
      body: { ...options, source: lesson.exercise.referenceSolution },
    });
    expect(accepted.body.status, JSON.stringify(accepted.body)).toBe('accepted');
    expect(
      accepted.body.tests
        .filter((t: { hidden: boolean }) => t.hidden)
        .every((t: object) => !('stdin' in t) && !('actual' in t) && !('expected' in t)),
    ).toBe(true);
    await browser(`${endpoint}/read`, { method: 'POST', body: {} });
    await browser(`${endpoint}/quiz`, {
      method: 'POST',
      body: { answers: lesson.quiz.questions.map(correctAnswer) },
    });
    const profile = (await browser('/api/profile')).body;
    expect(
      profile.progress.find((p: { lessonId: string }) => p.lessonId === lesson.id).completedAt,
    ).toBeTruthy();
    expect(profile.attempts).toBe(4);
    const history = (await browser(`${endpoint}/attempts`)).body;
    expect(history.attempts).toHaveLength(2);
    expect(history.attempts[0].source).toBe(lesson.exercise.referenceSolution);
    expect((await browser(`${endpoint}/draft`)).body.source).toBe(
      lesson.exercise.referenceSolution,
    );
    const run = await browser(`${endpoint}/submit`, {
      method: 'POST',
      body: { ...options, mode: 'run', stdin: '9 5\n', source: lesson.exercise.referenceSolution },
    });
    expect(run.body.run.stdout).toBe('Система готова\nКанал открыт\n');
    const stats = (await browser(`${endpoint}/stats`)).body;
    expect(stats).toMatchObject({
      attempts: 3,
      successful: true,
      hintViewed: true,
      solutionViewed: true,
    });
    expect(stats.firstAttemptAt).toBeTruthy();
    expect(stats.lastAttemptAt).toBeTruthy();
    const playground = await browser('/api/playground/submit', {
      method: 'POST',
      body: {
        ...options,
        mode: 'run',
        source: '#include <stdio.h>\nint main(void){puts("playground");return 0;}',
      },
    });
    expect(playground.body.status).toBe('executed');
    expect(playground.body.run.stdout).toBe('playground\n');
    expect((await browser('/api/playground/attempts')).body.attempts).toHaveLength(1);
    const sourceCode =
      '#include <stdio.h>\nint main(void){int n;scanf("%d",&n);printf("%d\\n",n*2);}';
    const execution = await browser('/api/playground/execute', {
      method: 'POST',
      body: {
        language: 'c',
        standard: 'c17',
        compiler: 'clang',
        sourceCode,
        stdin: '21\n',
        timeoutMs: 2000,
      },
    });
    expect(execution.response.status, JSON.stringify(execution.body)).toBe(200);
    expect(runResponseSchema.parse(execution.body)).toMatchObject({
      status: 'success',
      stdout: '42\n',
      exitCode: 0,
    });
    expect((await browser('/api/playground/draft')).body.source).toBe(sourceCode);
    const saved = (await browser('/api/playground/attempts')).body.attempts;
    expect(saved).toHaveLength(2);
    expect(saved[0].result.run.stdout).toBe('42\n');
    const invalid = await browser('/api/playground/execute', {
      method: 'POST',
      body: {
        language: 'c',
        standard: 'c++20',
        compiler: 'gcc',
        sourceCode,
        stdin: '',
        timeoutMs: 2000,
      },
    });
    expect(invalid.response.status).toBe(400);
    expect(runResponseSchema.safeParse(invalid.body).success).toBe(true);
  }, 90000);
  it('не принимает утечку с правильным stdout и не позволяет отключить диагностику', async () => {
    const browser = browserSession(app.origin);
    const lesson = loadCourse().byId.get('memory-memory-leak')!;
    const endpoint = `/api/lessons/${lesson.id}/submit`;
    const body = {
      source: lesson.exercise.referenceSolution,
      standard: 'c17',
      compiler: 'gcc',
      stdin: '',
      mode: 'check',
    };
    expect(
      (await browser(endpoint, { method: 'POST', body: { ...body, diagnostics: 'none' } })).response
        .status,
    ).toBe(400);
    const source = body.source.replace('free(p);', '');
    expect(source).not.toBe(body.source);
    const leaked = await browser(endpoint, { method: 'POST', body: { ...body, source } });
    expect(leaked.response.status, JSON.stringify(leaked.body)).toBe(200);
    expect(leaked.body.status).toBe('wrong_answer');
    expect(leaked.body.tests[0].actual).toBe(lesson.exercise.publicTests[0]!.expected);
    expect(leaked.body.tests[0].passed).toBe(false);
    for (const test of leaked.body.tests.filter((t: { hidden: boolean }) => t.hidden)) {
      expect(test).not.toHaveProperty('stderr');
      expect(test).not.toHaveProperty('stdin');
      expect(test).not.toHaveProperty('actual');
    }
    const fixed = await browser(endpoint, { method: 'POST', body });
    expect(fixed.body.status, JSON.stringify(fixed.body)).toBe('accepted');
  }, 120000);
});
