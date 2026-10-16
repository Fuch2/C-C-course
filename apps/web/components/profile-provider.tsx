'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ProfileState } from '@course/shared';
import { api, errorMessage, post } from '@/lib/client';

const Context = createContext<{
  profile: ProfileState | null;
  error: string;
  refresh: () => Promise<void>;
}>({ profile: null, error: '', refresh: async () => {} });
let initialization: Promise<ProfileState> | undefined;
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      setProfile(await api<ProfileState>('/api/profile'));
      setError('');
    } catch (error) {
      setError(errorMessage(error));
    }
  }, []);
  useEffect(() => {
    const update = () => {
      void refresh();
    };
    window.addEventListener('focus', update);
    return () => window.removeEventListener('focus', update);
  }, [refresh]);
  useEffect(() => {
    let active = true;
    initialization ??= post<ProfileState>('/api/profile').catch((error) => {
      initialization = undefined;
      throw error;
    });
    void initialization
      .then((value) => {
        if (active) {
          setProfile(value);
          setError('');
        }
      })
      .catch((error) => {
        if (active) setError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <Context.Provider value={{ profile, error, refresh }}>
      {error && (
        <div className="global-error" role="alert">
          {error}
          <button
            onClick={() => {
              initialization = undefined;
              void post<ProfileState>('/api/profile')
                .then((value) => {
                  setProfile(value);
                  setError('');
                })
                .catch((e) => setError(errorMessage(e)));
            }}
          >
            Повторить
          </button>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export const useProfile = () => useContext(Context);
