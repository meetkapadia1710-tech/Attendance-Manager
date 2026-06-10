import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { fsDeleteStaff } from '../../lib/firestore';

const overlayV = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const cardV = {
  hidden:  { opacity: 0, scale: 0.88, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
  exit:    { opacity: 0, scale: 0.88, y: 20, transition: { duration: 0.18 } },
};
const iconV = {
  hidden:  { scale: 0, rotate: -30 },
  visible: { scale: 1, rotate: 0, transition: { type: 'spring' as const, stiffness: 500, damping: 22, delay: 0.1 } },
};

export function DeleteDialog() {
  const { dialog, closeDialog, addToast, staff } = useStore();
  const open    = dialog?.type === 'delete';
  const staffId = open ? dialog.staffId : null;
  const staffObj = staffId ? staff.find(s => s.id === staffId) : null;

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDialog(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, closeDialog]);

  const confirm = useCallback(async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      await fsDeleteStaff(staffId);
      // Firestore onSnapshot will remove the staff from the store automatically
      addToast(`${staffObj?.name ?? 'Staff member'} removed`, 'error', 'person_remove');
      closeDialog();
    } catch (err) {
      console.error('[DeleteDialog] Delete failed:', err);
      addToast('Delete failed — check your connection', 'error', 'wifi_off');
    } finally {
      setSaving(false);
    }
  }, [staffId, staffObj, addToast, closeDialog]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlayV} initial="hidden" animate="visible" exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeDialog(); }}
        >
          <motion.div
            variants={cardV} initial="hidden" animate="visible" exit="exit"
            role="dialog" aria-modal="true"
            className="bg-[color:var(--color-surface-container-high)] rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center gap-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Warning icon */}
            <motion.div
              variants={iconV} initial="hidden" animate="visible"
              className="w-14 h-14 rounded-full bg-[color:var(--color-error-container)] flex items-center justify-center"
            >
              <span className="material-symbols-outlined fill text-[color:var(--color-on-error-container)]" style={{ fontSize: 28 }}>
                warning
              </span>
            </motion.div>

            <div>
              <h2
                className="text-lg font-bold text-[color:var(--color-on-surface)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Remove Staff Member?
              </h2>
              <p className="text-sm text-[color:var(--color-on-surface-variant)] mt-1">
                <strong className="text-[color:var(--color-on-surface)]">{staffObj?.name ?? 'This person'}</strong>
                {' '}and all their attendance data will be permanently deleted from Firebase.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={closeDialog}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-[color:var(--color-primary)] border border-[color:var(--color-outline-variant)] hover:bg-[color:var(--color-surface-container-highest)] transition-colors active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold bg-[color:var(--color-error)] text-[color:var(--color-on-error)] hover:opacity-90 shadow-sm transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                      className="material-symbols-outlined text-[16px]"
                    >progress_activity</motion.span>
                    Removing…
                  </>
                ) : 'Remove'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
