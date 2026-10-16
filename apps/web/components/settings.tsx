'use client';
import { useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import type { ProfileState } from '@course/shared';
import { api, errorMessage } from '@/lib/client';
import { useProfile } from './profile-provider';

function SettingsForm({ profile }: { profile: ProfileState }) {
  const { refresh } = useProfile();
  const [name, setName] = useState(profile.name);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [compiler, setCompiler] = useState(profile.compiler);
  const [fontSize, setFontSize] = useState(profile.fontSize);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <form
      className="settings-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage('');
        setError('');
        try {
          await api('/api/profile', {
            method: 'PATCH',
            body: JSON.stringify({ name, dailyGoal, compiler, fontSize, onboarded: true }),
          });
          await refresh();
          setMessage('Настройки сохранены.');
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setPending(false);
        }
      }}
    >
      <section>
        <h2>Ваш учебный профиль</h2>
        <label>
          Имя
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            autoComplete="given-name"
          />
        </label>
        <label>
          Минут в день
          <input
            type="number"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            min={10}
            max={120}
            required
          />
        </label>
        <p>Этот ориентир отображается на главной странице. Темп и порядок уроков выбираете вы.</p>
      </section>
      <section>
        <h2>Редактор и выполнение</h2>
        <label>
          Компилятор по умолчанию
          <select
            value={compiler}
            onChange={(e) => setCompiler(e.target.value === 'clang' ? 'clang' : 'gcc')}
          >
            <option value="gcc">GCC</option>
            <option value="clang">Clang</option>
          </select>
        </label>
        <label>
          Размер шрифта кода: {fontSize} px
          <input
            type="range"
            min={12}
            max={24}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </label>
        <div className="font-preview" style={{ fontSize }}>
          <code>
            int main(void) {'{'} return 0; {'}'}
          </code>
        </div>
      </section>
      <button className="button button-primary" disabled={pending}>
        <Save size={17} />
        {pending ? 'Сохраняем…' : 'Сохранить настройки'}
      </button>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      <aside className="privacy-note">
        <ShieldCheck size={21} />
        <p>
          Прогресс, закладки и исходники хранятся в локальной SQLite. Все браузеры на этом
          компьютере используют одного локального пользователя. Регистрация и cookie для доступа к
          прогрессу не нужны.
        </p>
      </aside>
    </form>
  );
}
export function SettingsPage() {
  const { profile } = useProfile();
  return (
    <div className="page-content narrow-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">СВОЙ РИТМ. СВОИ ИНСТРУМЕНТЫ.</span>
          <h1>Настройки</h1>
          <p>Удобная среда помогает сосредоточиться на задаче.</p>
        </div>
      </div>
      {profile ? <SettingsForm profile={profile} /> : <p role="status">Загружаем настройки…</p>}
    </div>
  );
}
