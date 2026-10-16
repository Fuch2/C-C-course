import type { ReactNode } from 'react';

export function ProgressBar({
  value,
  label = 'Прогресс',
  className = '',
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const percentage = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`progress-track ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'blue' | 'amber';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
