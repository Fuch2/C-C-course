import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="eyebrow">404</span>
      <h1>Такой страницы нет</h1>
      <p>Урок мог переехать. Все доступные темы есть в программе курса.</p>
      <Link href="/course" className="button button-primary">
        К программе
      </Link>
    </div>
  );
}
