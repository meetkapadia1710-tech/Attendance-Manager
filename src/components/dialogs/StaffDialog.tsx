import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { fsAddStaff, fsUpdateStaff } from '../../lib/firestore';
import { ROLES, genId } from '../../lib/utils';

const overlayV = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const cardV = {
  hidden:  { opacity: 0, scale: 0.93, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, scale: 0.93, y: 16, transition: { duration: 0.18 } },
};

export function StaffDialog() {
  const { dialog, closeDialog, addToast, staff } = useStore();
  const isAdd  = dialog?.type === 'addStaff';
  const isEdit = dialog?.type === 'editStaff';
  const open   = isAdd || isEdit;
  const editId = isEdit ? dialog.staffId : null;

  const [name,    setName]    = useState('');
  const [role,        setRole]        = useState(ROLES[0]);
  const [roleOpen,    setRoleOpen]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [shake,   setShake]   = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (isEdit && editId) {
      const s = staff.find(x => x.id === editId);
      setName(s?.name ?? '');
      setRole(s?.role ?? ROLES[0]);
    } else {
      setName(''); setRole(ROLES[0]);
    }
    setSaving(false);
    setTimeout(() => nameRef.current?.focus(), 80);
  }, [open, isEdit, editId, staff]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDialog(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, closeDialog]);

  const submit = useCallback(async () => {
    if (!name.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      nameRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editId) {
        const existing = staff.find(s => s.id === editId);
        if (existing) {
          await fsUpdateStaff({ ...existing, name: name.trim(), role });
          addToast(`${name.trim()} updated`, 'success');
        }
      } else {
        const newMember = { id: genId(), name: name.trim(), role };
        await fsAddStaff(newMember);
        addToast(`${name.trim()} added to team`, 'success', 'person_add');
      }
      closeDialog();
    } catch (err) {
      console.error('[StaffDialog] Write failed:', err);
      addToast('Failed to save — check your connection', 'error', 'wifi_off');
    } finally {
      setSaving(false);
    }
  }, [name, role, isEdit, editId, staff, addToast, closeDialog]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlayV} initial="hidden" animate="visible" exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeDialog(); }}
        >
          <motion.div
            variants={cardV} initial="hidden" animate="visible" exit="exit"
            role="dialog" aria-modal="true"
            className="bg-[color:var(--color-surface-container-high)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-2">
              <h2
                className="text-xl font-bold text-[color:var(--color-on-surface)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <p className="text-xs text-[color:var(--color-on-surface-variant)] mt-0.5">
                {isEdit ? 'Update name and role.' : 'Add a new team member to the roster.'}
              </p>
            </div>

            {/* Fields */}
            <div className="px-6 py-4 flex flex-col gap-4">
              {/* Name */}
              <motion.div animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}>
                <label className="block text-[11px] font-bold text-[color:var(--color-on-surface-variant)] mb-1.5 uppercase tracking-wide">
                  Full Name *
                </label>
                <div className="relative bg-[color:var(--color-surface-variant)] rounded-t-lg hover:bg-[color:var(--color-surface-container-highest)] transition-colors">
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={handleKey}
                    maxLength={40}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-transparent border-none outline-none px-4 py-3.5 text-[color:var(--color-on-surface)] text-sm font-medium placeholder-[color:var(--color-outline)]"
                    style={{ caretColor: 'var(--color-primary)' }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--color-outline)]" />
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-[color:var(--color-primary)]"
                    animate={{ width: name ? '100%' : '0%' }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
                {shake && (
                  <p className="text-xs text-[color:var(--color-error)] mt-1 px-1">Name is required</p>
                )}
              </motion.div>

              {/* Role */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-[color:var(--color-on-surface-variant)] mb-1.5 uppercase tracking-wide">
                  Role
                </label>
                <button
                  type="button"
                  onClick={() => setRoleOpen(!roleOpen)}
                  className="w-full relative bg-[color:var(--color-surface-variant)] rounded-t-lg hover:bg-[color:var(--color-surface-container-highest)] transition-colors flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="text-[color:var(--color-on-surface)] text-sm font-medium">{role}</span>
                  <motion.span
                    animate={{ rotate: roleOpen ? 180 : 0 }}
                    className="material-symbols-outlined text-[color:var(--color-on-surface-variant)]"
                    style={{ fontSize: 20 }}
                  >
                    expand_more
                  </motion.span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--color-outline)]" />
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-[color:var(--color-primary)]"
                    animate={{ width: roleOpen ? '100%' : '0%' }}
                    transition={{ duration: 0.25 }}
                  />
                </button>

                <AnimatePresence>
                  {roleOpen && (
                    <>
                      {/* Invisible backdrop to catch outside clicks */}
                      <div className="fixed inset-0 z-[190]" onClick={() => setRoleOpen(false)} />
                      
                      <motion.div
                        initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-0 right-0 mt-1 bg-[color:var(--color-surface-container-high)] border border-[color:var(--color-outline-variant)] rounded-xl shadow-lg z-[200] overflow-hidden origin-top max-h-[220px] flex flex-col"
                      >
                        <div className="overflow-y-auto py-1">
                          {ROLES.map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => { setRole(r); setRoleOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${role === r ? 'bg-[color:var(--color-primary-container)] text-[color:var(--color-on-primary-container)] font-bold' : 'text-[color:var(--color-on-surface)] hover:bg-[color:var(--color-surface-container-highest)] font-medium'}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 flex justify-end gap-2 border-t border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-low)]">
              <button
                onClick={closeDialog}
                disabled={saving}
                className="h-10 px-5 rounded-full text-sm font-semibold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-fixed)] transition-colors active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="h-10 px-6 rounded-full text-sm font-semibold bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] shadow-sm transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                      className="material-symbols-outlined text-[16px]"
                    >progress_activity</motion.span>
                    Saving…
                  </>
                ) : isEdit ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
