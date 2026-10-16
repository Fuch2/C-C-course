import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadCourse, summarize } from '@course/course-engine';
import { CourseOverview } from '@/components/course-overview';
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ courseId: loadCourse().course.id }];
}
export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }) {
  const { course } = loadCourse();
  return { title: (await params).courseId === course.id ? course.title : 'Курс не найден' };
}
export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { course, lessons, projects, byId } = loadCourse();
  if ((await params).courseId !== course.id) notFound();
  return (
    <>
      <CourseOverview course={course} lessons={lessons.map(summarize)} detail />
      <section className="page-content" aria-labelledby="projects-title">
        <h2 id="projects-title">Практические проекты</h2>
        <p className="helper-text">
          Полные условия, подсказки, тесты и разбор доступны в практике соответствующего урока.
        </p>
        {projects
          .slice()
          .sort(
            (a, b) =>
              course.modules.find((module) => module.id === a.moduleId)!.order -
                course.modules.find((module) => module.id === b.moduleId)!.order ||
              a.order - b.order,
          )
          .map((project) => {
            const lesson = byId.get(project.lessonIds[0]!)!;
            const exercise =
              [lesson.exercise, ...lesson.additionalExercises].find(
                (item) => item.title === project.title,
              ) ?? lesson.exercise;
            return (
              <article key={project.id} className="course-overview-card">
                <h3>{project.title}</h3>
                <p>{project.description.split('\n')[0]}</p>
                <ul>
                  {project.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="helper-text">
                  Около {project.estimatedMinutes} минут ·{' '}
                  {course.modules.find((module) => module.id === project.moduleId)?.title}
                </p>
                <Link
                  className="button button-secondary"
                  href={`/lesson/${lesson.id}?part=practice&exercise=${exercise.id}`}
                >
                  Открыть проект: {project.title}
                </Link>
              </article>
            );
          })}
      </section>
    </>
  );
}
