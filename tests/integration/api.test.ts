import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadCourse } from '@course/course-engine';
import { PrismaClient } from '@prisma/client';
import { correctAnswer, wrongAnswer } from '../helpers/quiz';
import { browserSession, startTestApp } from '../helpers/app';
let app: Awaited<ReturnType<typeof startTestApp>>;
beforeAll(async () => {
  app = await startTestApp();
}, 90_000);
afterAll(async () => {
  await app?.cleanup();
});
describe('Этап 1: настоящий HTTP API и SQLite', () => {
  it('автоматически создаёт одного пользователя без cookie и регистрации', async () => {
    const first = browserSession(app.origin);
    const initial = await first('/api/profile');
    expect(initial.response.status).toBe(200);
    expect(initial.response.headers.get('set-cookie')).toBeNull();
    expect(initial.body.progress).toEqual([]);
    await first('/api/profile', {
      method: 'PATCH',
      body: {
        name: 'Локальный тестовый ученик',
        compiler: 'clang',
        dailyGoal: 45,
        fontSize: 17,
        onboarded: true,
      },
    });
    const second = browserSession(app.origin);
    expect((await second('/api/profile')).body.name).toBe('Локальный тестовый ученик');
    expect((await second('/api/profile')).body.compiler).toBe('clang');
    const independent = await Promise.all(
      Array.from({ length: 4 }, () => browserSession(app.origin)('/api/profile')),
    );
    expect(independent.every((r) => r.response.status === 200)).toBe(true);
    expect(independent.every((r) => r.body.name === 'Локальный тестовый ученик')).toBe(true);
  }, 90000);
  it('сохраняет закладки, черновик и завершение демоурока между запросами', async () => {
    const browser = browserSession(app.origin);
    await browser('/api/lessons/first-program/bookmark', { method: 'POST', body: { saved: true } });
    await browser('/api/lessons/first-program/draft', {
      method: 'POST',
      body: { source: 'original-draft', stdin: 'test-input' },
    });
    await browser('/api/lessons/first-program/read', { method: 'POST', body: {} });
    const profile = (await browserSession(app.origin)('/api/profile')).body;
    expect(profile.bookmarks).toEqual(['first-program']);
    expect(profile.progress[0]).toMatchObject({
      read: true,
      quizPassed: false,
      practicePassed: false,
    });
    // Урок с практикой не завершается одним чтением.
    expect(profile.progress[0].completedAt).toBeNull();
    expect(profile.studyDays).toHaveLength(1);
    expect((await browser('/api/lessons/first-program/draft')).body).toEqual({
      source: 'original-draft',
      stdin: 'test-input',
    });
    await browser('/api/lessons/first-program/bookmark', {
      method: 'POST',
      body: { saved: false },
    });
    expect((await browser('/api/profile')).body.bookmarks).toEqual([]);
  });
  it('отклоняет чужой Origin, лишние поля и неизвестный урок', async () => {
    const browser = browserSession(app.origin);
    expect(
      (
        await browser('/api/profile', {
          method: 'PATCH',
          body: { progress: [{ completedAt: 'now' }] },
        })
      ).response.status,
    ).toBe(400);
    expect(
      (
        await browser('/api/lessons/first-program/read', {
          method: 'POST',
          body: {},
          origin: 'https://untrusted.example',
        })
      ).response.status,
    ).toBe(403);
    expect((await browser('/api/lessons/unknown-id/content')).response.status).toBe(404);
  });
  it('сохраняет попытки quiz, закрывает разбор до проверки и не раскрывает скрытые тесты', async () => {
    const lesson = loadCourse().byId.get('first-program')!;
    const browser = browserSession(app.origin);
    const content = (await browser(`/api/lessons/${lesson.id}/content`)).body;
    expect(content.exercise).not.toHaveProperty('referenceSolution');
    expect(content.exercise).not.toHaveProperty('hiddenTests');
    expect(content.quiz.questions[0]).not.toHaveProperty('correct');
    expect(content.exercise.publicTests.length).toBeGreaterThan(0);
    expect(content.exercise.hints[0]).not.toHaveProperty('text');
    expect(
      (
        await browser(`/api/lessons/${lesson.id}/solution`, {
          method: 'POST',
          body: { confirmed: true },
        })
      ).response.status,
    ).toBe(403);
    const wrong = await browser(`/api/lessons/${lesson.id}/quiz`, {
      method: 'POST',
      body: { answers: lesson.quiz.questions.map(wrongAnswer) },
    });
    expect(wrong.body.passed).toBe(false);
    const correct = await browser(`/api/lessons/${lesson.id}/quiz`, {
      method: 'POST',
      body: { answers: lesson.quiz.questions.map(correctAnswer) },
    });
    expect(correct.body.passed).toBe(true);
    expect((await browser('/api/profile')).body.progress[0]).toMatchObject({
      quizPassed: true,
      practicePassed: false,
    });
    const search = await browser(`/api/search?q=${encodeURIComponent('компилятор')}`);
    expect(search.body.results.some((l: { id: string }) => l.id === 'first-program')).toBe(true);
    expect(search.body.items.some((item: { kind: string }) => item.kind === 'lesson')).toBe(true);
    expect(
      (await browser(`/api/search?q=${encodeURIComponent('Основы языка C')}`)).body.items.some(
        (item: { kind: string }) => item.kind === 'module',
      ),
    ).toBe(true);
    expect(
      (
        await browser(`/api/search?q=${encodeURIComponent('Регистр букв имеет значение')}`)
      ).body.items.some((item: { kind: string }) => item.kind === 'section'),
    ).toBe(true);
    expect(
      (
        await browser(
          `/api/search?q=${encodeURIComponent(loadCourse().lessons[0]!.exercise.title)}`,
        )
      ).body.items.some((item: { kind: string }) => item.kind === 'exercise'),
    ).toBe(true);
    const database = new PrismaClient({ datasourceUrl: app.databaseUrl });
    try {
      expect(await database.user.count()).toBe(1);
      expect(await database.settings.count()).toBe(1);
      expect(await database.quizAttempt.count()).toBe(2);
      expect(await database.courseProgress.findFirst()).toMatchObject({
        courseId: 'cpp-systems',
        percent: 0,
        totalLessons: 215,
        completedLessons: 0,
      });
    } finally {
      await database.$disconnect();
    }
  });
  it('фильтрует по тегам через HTTP и отдаёт настоящий MDX с учебными компонентами', async () => {
    const browser = browserSession(app.origin);
    expect(
      (await browser('/api/search?tag=Старт&tag=printf')).body.results.map(
        (l: { id: string }) => l.id,
      ),
    ).toEqual(['first-program']);
    expect((await browser('/api/search?tag=missing')).body.results).toEqual([]);
    expect((await browser('/api/search?tag=')).response.status).toBe(400);
    const html = await (await fetch(app.origin + '/lesson/first-program')).text();
    expect(html).toContain('learning-concept');
    expect(html).toContain('learning-mistake');
    expect(html).toContain('Начать практику');
    expect(html).toContain('Копировать');
    expect(html).toContain('Запустить');
    const content = (await browser('/api/lessons/first-program/content')).body;
    expect(content.format).toBe('mdx');
    expect(content.sections).toHaveLength(12);
    expect(content.document.type).toBe('root');
    expect((await fetch(app.origin + '/api/content-assets/course.json')).status).toBe(404);
  }, 90000);
  it('разделяет черновики и подсказки двух задач, скрывает их решения', async () => {
    const browser = browserSession(app.origin);
    const lesson = loadCourse().byId.get('c17-structure')!;
    const extra = lesson.additionalExercises[0]!;
    const base = `/api/lessons/${lesson.id}`;
    const query = `?exercise=${extra.id}`;
    await browser(`${base}/draft`, { method: 'POST', body: { source: 'primary', stdin: 'one' } });
    await browser(`${base}/draft${query}`, {
      method: 'POST',
      body: { source: 'secondary', stdin: 'two' },
    });
    expect((await browser(`${base}/draft`)).body.source).toBe('primary');
    expect((await browser(`${base}/draft${query}`)).body.source).toBe('secondary');
    await browser(`${base}/hint${query}`, { method: 'POST', body: { hintId: extra.hints[0]!.id } });
    expect((await browser(`${base}/stats${query}`)).body.hintViewed).toBe(true);
    expect((await browser(`${base}/stats`)).body.hintViewed).toBe(false);
    expect(
      (await browser(`${base}/solution${query}`, { method: 'POST', body: { confirmed: true } }))
        .response.status,
    ).toBe(403);
    expect((await browser(`${base}/draft?exercise=unknown`)).response.status).toBe(404);
    const content = (await browser(`${base}/content`)).body;
    for (const e of [content.exercise, ...content.additionalExercises]) {
      expect(e).not.toHaveProperty('hiddenTests');
      expect(e).not.toHaveProperty('referenceSolution');
      expect(e.hints[0]).not.toHaveProperty('text');
    }
    const html = await (await fetch(app.origin + `/lesson/${lesson.id}`)).text();
    expect(html).toContain(lesson.title);
    expect(html).not.toContain('referenceSolution');
  }, 90000);
  it('сохраняет независимый черновик песочницы', async () => {
    const browser = browserSession(app.origin);
    const source = '#include <stdio.h>\nint main(void){puts("test");return 0;}';
    await browser('/api/playground/draft', { method: 'POST', body: { source, stdin: 'hello' } });
    expect((await browser('/api/playground/draft')).body).toEqual({ source, stdin: 'hello' });
    expect((await browser('/api/lessons/first-program/draft')).body.source).toBe('original-draft');
  });
  it('отдаёт все запрошенные страницы, 404 и перенаправление старого урока', async () => {
    for (const route of [
      '/',
      '/course',
      '/course/cpp-systems',
      '/lesson/first-program',
      '/playground',
      '/progress',
      '/bookmarks',
      '/settings',
    ]) {
      const response = await fetch(app.origin + route);
      expect(response.status, `${route}\n${app.logs()}`).toBe(200);
      const html = await response.text();
      expect(html).toContain('lang="ru"');
      expect(html).toContain('main-content');
    }
    expect((await fetch(app.origin + '/course/no-such-course')).status).toBe(404);
    expect((await fetch(app.origin + '/lesson/no-such-lesson')).status).toBe(404);
    const old = await fetch(app.origin + '/learn/first-program', { redirect: 'manual' });
    expect(old.status).toBe(307);
    expect(old.headers.get('location')).toBe('/lesson/first-program');
  }, 90000);
});
