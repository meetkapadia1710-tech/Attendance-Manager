/**
 * AuthProvider.tsx
 * Subscribes to Firebase Auth state changes and writes to useAuthStore.
 * Wraps the entire app so auth state is always available.
 */
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Listen for sign-in / sign-out events
    const unsub = onAuthStateChanged(auth, user => {
      setUser(user);
    });
    return () => unsub();
  }, [setUser]);

  return <>{children}</>;
}
