import { Practice } from '@/components/practice';
import { playgroundLesson } from '@/lib/playground';
export const metadata = { title: 'Песочница C и C++' };
export default function PlaygroundPage() {
  return (
    <div className="page-content playground-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ИДЕЯ → КОД → РЕЗУЛЬТАТ</span>
          <h1>Песочница C / C++</h1>
          <p>Личная лаборатория для небольших программ и экспериментов.</p>
        </div>
        <span className="course-label">
          GCC <span>/</span> Clang
        </span>
      </div>
      <Practice lesson={playgroundLesson} playground />
    </div>
  );
}
