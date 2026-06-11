import { create } from 'zustand';
import { fsGetAdminSecret, fsSetAdminSecret } from '../lib/firestore';

const SESSION_KEY = 'mbs_admin_unlocked';

interface AuthStore {
  /** True = admin is unlocked for this session */
  isAdmin: boolean;
  /** Try secret key against Firestore. Returns true on success. */
  unlock(key: string): Promise<boolean>;
  /** Lock the session (sign out) */
  lock(): void;
  /**
   * Change the admin secret key.
   * Requires the current key to be correct.
   * Returns 'ok' | 'wrong_current' | 'error'
   */
  changeKey(currentKey: string, newKey: string): Promise<'ok' | 'wrong_current' | 'error'>;
}

export const useAuthStore = create<AuthStore>(_set => ({
  // Restore from sessionStorage so refreshing doesn't kick you out
  isAdmin: sessionStorage.getItem(SESSION_KEY) === 'true',

  async unlock(key: string) {
    const secret = await fsGetAdminSecret();
    if (key === secret) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      _set({ isAdmin: true });
      return true;
    }
    return false;
  },

  lock() {
    sessionStorage.removeItem(SESSION_KEY);
    _set({ isAdmin: false });
  },

  async changeKey(currentKey: string, newKey: string) {
    try {
      const secret = await fsGetAdminSecret();
      if (currentKey !== secret) return 'wrong_current';
      await fsSetAdminSecret(newKey);
      return 'ok';
    } catch {
      return 'error';
    }
  },
}));
