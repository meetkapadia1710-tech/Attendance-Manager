import { create } from 'zustand';

const SESSION_KEY = 'mbs_admin_unlocked';

interface AuthStore {
  /** True = admin is unlocked for this session */
  isAdmin: boolean;
  /** Try secret key. Returns true on success. */
  unlock(key: string): boolean;
  /** Lock the session (sign out) */
  lock(): void;
}

export const useAuthStore = create<AuthStore>(set => ({
  // Restore from sessionStorage so refreshing doesn't kick you out
  isAdmin: sessionStorage.getItem(SESSION_KEY) === 'true',

  unlock(key: string) {
    const secret = import.meta.env.VITE_ADMIN_SECRET ?? '';
    if (key === secret) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      set({ isAdmin: true });
      return true;
    }
    return false;
  },

  lock() {
    sessionStorage.removeItem(SESSION_KEY);
    set({ isAdmin: false });
  },
}));
