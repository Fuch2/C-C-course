'use client';
import { useState } from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { useProfile } from './profile-provider';
import { api, errorMessage } from '@/lib/client';

export function Onboarding() {
  const { profile, refresh } = useProfile();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(30);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  if (!profile || profile.onboarded) return null;
  return (
    <section className="onboarding">
      <div className="onboarding-heading">
        <Compass size={24} />
        <div>
          <h2>Давайте познакомимся</h2>
          <p>
            Читайте теорию, проверяйте понимание и решайте задачи. Данные останутся в этой локальной
            среде.
          </p>
        </div>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError('');
          try {
            await api('/api/profile', {
              method: 'PATCH',
              body: JSON.stringify({
                name: name.trim() || 'Исследователь',
                dailyGoal: goal,
                onboarded: true,
              }),
            });
            await refresh();
          } catch (error) {
            setError(errorMessage(error));
          } finally {
            setPending(false);
          }
        }}
      >
        <label>
          Как к вам обращаться?
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            placeholder="Ваше имя"
            autoComplete="given-name"
          />
        </label>
        <label>
          Время на обучение
          <select value={goal} onChange={(event) => setGoal(Number(event.target.value))}>
            <option value={15}>15 минут в день</option>
            <option value={30}>30 минут в день</option>
            <option value={60}>60 минут в день</option>
          </select>
        </label>
        <button className="button button-primary" disabled={pending}>
          {pending ? 'Сохраняем…' : 'Сохранить и начать'}
          <ArrowRight size={16} />
        </button>
      </form>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
