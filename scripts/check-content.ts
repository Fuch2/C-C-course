import { loadCourse } from '@course/course-engine';
try {
  const { course, lessons, projects } = loadCourse();
  console.log(
    `Курс «${course.title}»: модулей ${course.modules.length}, опубликованных уроков ${lessons.length}, проектов ${projects.length}. Структура корректна.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
