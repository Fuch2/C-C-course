import { expect, it } from 'vitest';
import { loadCourse } from '@course/course-engine';

it('все файлы курса согласованы, имеют задания, quiz и непустую теорию', () => {
  const { course, lessons, byId } = loadCourse();
  expect(course.modules.flatMap((m) => m.lessons)).toHaveLength(lessons.length);
  for (const lesson of lessons) {
    expect(lesson.body).toContain('## ');
    expect(lesson.exercise.referenceSolution.length).toBeGreaterThan(20);
    expect(lesson.quiz.questions.length).toBeGreaterThanOrEqual(1);
    expect(lesson.exercise.publicTests.length).toBeGreaterThan(0);
    expect(lesson.exercise.hiddenTests.length).toBeGreaterThan(0);
    for (const id of lesson.prerequisites) expect(byId.has(id)).toBe(true);
  }
});
