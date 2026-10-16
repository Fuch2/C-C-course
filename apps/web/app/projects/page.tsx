import Link from 'next/link';
import { ArrowRight, Layers3 } from 'lucide-react';
import { loadCourse } from '@course/course-engine';
export const metadata = { title: 'Итоговые проекты' };
export default function ProjectsPage() {
  const { projects: allProjects, byId, course } = loadCourse();
  const moduleOrder = (id: string) => course.modules.find((module) => module.id === id)!.order;
  const projects = allProjects
    .slice()
    .sort((a, b) => moduleOrder(a.moduleId) - moduleOrder(b.moduleId) || a.order - b.order);
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">СОБЕРИТЕ ЗНАНИЯ В СИСТЕМУ</span>
          <h1>Итоговые проекты</h1>
          <p>Примените изученные темы и проверьте результат по условиям проекта.</p>
        </div>
        <Layers3 size={36} className="heading-icon" />
      </div>
      <div className="project-grid">
        {projects.map((project, index) => {
          const lesson = byId.get(project.lessonIds[0]!)!;
          const exercise =
            [lesson.exercise, ...lesson.additionalExercises].find(
              (item) => item.title === project.title,
            ) ?? lesson.exercise;
          return (
            <article className="project-card" key={project.id}>
              <span className="project-number">ПРОЕКТ {String(index + 1).padStart(2, '0')}</span>
              <h2>{project.title}</h2>
              <p>{project.description.split('\n')[0]}</p>
              <ul>
                {project.deliverables.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
              <Link
                className="button button-primary"
                href={`/lesson/${lesson.id}?part=practice&exercise=${exercise.id}`}
              >
                Открыть проект
                <ArrowRight size={16} />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
