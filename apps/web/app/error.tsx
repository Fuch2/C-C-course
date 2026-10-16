'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h1>Не удалось открыть страницу</h1>
      <p>Проверьте, запущены ли сервисы и доступна ли база данных. Затем попробуйте снова.</p>
      <button className="button button-primary" onClick={reset}>
        Попробовать снова
      </button>
    </div>
  );
}
