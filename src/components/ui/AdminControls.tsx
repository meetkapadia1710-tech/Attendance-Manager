/**
 * AdminControls.tsx
 * Shows in the Header when admin is unlocked.
 * Provides a "Lock" button to end the admin session.
 */
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

export function AdminControls() {
  const { lock } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      {/* Admin badge */}
      <div
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: 'var(--color-primary-fixed)' }}
      >
        <span
          className="material-symbols-outlined fill"
          style={{ fontSize: 14, color: 'var(--color-primary)' }}
        >
          shield
        </span>
        <span
          className="text-xs font-black uppercase tracking-wider"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}
        >
          Admin
        </span>
      </div>

      {/* Lock button */}
      <button
        onClick={lock}
        title="Lock dashboard"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors active:scale-95 text-xs font-semibold"
        style={{
          borderColor: 'var(--color-outline-variant)',
          color: 'var(--color-on-surface-variant)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>
        <span className="hidden sm:inline">Lock</span>
      </button>
    </motion.div>
  );
}
