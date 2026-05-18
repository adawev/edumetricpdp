import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'STUDENT' | 'MENTOR' | 'ADMIN';

type AuthUser = { id: string; email: string; role: Role; profile: any };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clear: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('em_token', token);
        set({ token, user });
      },
      clear: () => {
        localStorage.removeItem('em_token');
        set({ token: null, user: null });
      },
    }),
    { name: 'em_auth' },
  ),
);
