/**
 * AdminLoginButton.tsx
 *
 * Shown in the Header. When not logged in → shows "Admin Login" button.
 * When logged in → shows avatar + name + "Sign out".
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/useAuthStore';

export function AdminLoginButton() {
  const { user } = useAuthStore();
  const [busy, setBusy]       = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogin() {
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== 'auth/popup-closed-by-user') {
        console.error('[Auth] Sign-in failed:', err);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut(auth);
  }

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        disabled={busy}
        title="Admin Login"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[color:var(--color-outline-variant)] hover:bg-[color:var(--color-surface-container-high)] transition-colors text-xs font-semibold text-[color:var(--color-on-surface-variant)] active:scale-95 disabled:opacity-50"
      >
        {busy ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
            className="material-symbols-outlined text-[16px]"
          >progress_activity</motion.span>
        ) : (
          <span className="material-symbols-outlined text-[16px]">lock</span>
        )}
        <span className="hidden sm:inline">{busy ? 'Signing in…' : 'Admin Login'}</span>
      </button>
    );
  }

  // Logged in — show avatar + dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-[color:var(--color-primary-fixed)] bg-[color:var(--color-primary-fixed)] hover:bg-[color:var(--color-primary-fixed-dim)] transition-colors active:scale-95"
        title={user.displayName ?? 'Admin'}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? ''}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
          >
            {(user.displayName ?? 'A')[0].toUpperCase()}
          </div>
        )}
        <span
          className="hidden sm:inline text-xs font-bold max-w-[120px] truncate"
          style={{ color: 'var(--color-on-primary-fixed)' }}
        >
          {user.displayName?.split(' ')[0] ?? 'Admin'}
        </span>
        <span
          className="material-symbols-outlined text-[14px]"
          style={{ color: 'var(--color-on-primary-container)' }}
        >
          {menuOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-52 bg-[color:var(--color-surface-container-high)] rounded-2xl shadow-2xl border border-[color:var(--color-outline-variant)] overflow-hidden z-50"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[color:var(--color-outline-variant)]">
                <p className="text-xs font-bold text-[color:var(--color-on-surface)] truncate">
                  {user.displayName}
                </p>
                <p className="text-[10px] text-[color:var(--color-on-surface-variant)] truncate">
                  {user.email}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 bg-[color:var(--color-primary-fixed)] px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined fill text-[10px]" style={{ color: 'var(--color-primary)' }}>
                    shield
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                    Admin
                  </span>
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[color:var(--color-error)] hover:bg-[color:var(--color-error-container)] transition-colors font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
