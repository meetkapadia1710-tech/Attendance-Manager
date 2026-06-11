/**
 * ChangeKeyDialog.tsx
 * Allows the admin to update the secret key from within the app.
 * The current key must be verified before a new key is persisted to Firestore.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';

const overlayV = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const cardV = {
  hidden:  { opacity: 0, scale: 0.93, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, scale: 0.93, y: 16, transition: { duration: 0.18 } },
};

type FieldError = 'current' | 'new' | 'confirm' | null;

export function ChangeKeyDialog() {
  const { dialog, closeDialog, addToast } = useStore();
  const { changeKey } = useAuthStore();

  const open = dialog?.type === 'changeKey';

  const [current,  setCurrent]  = useState('');
  const [newKey,   setNewKey]   = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showCon,  setShowCon]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [shake,    setShake]    = useState<FieldError>(null);
  const [fieldErr, setFieldErr] = useState<Partial<Record<'current' | 'new' | 'confirm', string>>>({});
  const [success,  setSuccess]  = useState(false);

  const currentRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return;
    setCurrent(''); setNewKey(''); setConfirm('');
    setShowCur(false); setShowNew(false); setShowCon(false);
    setSaving(false); setShake(null); setFieldErr({}); setSuccess(false);
    setTimeout(() => currentRef.current?.focus(), 80);
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDialog(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, closeDialog]);

  const triggerShake = (field: FieldError) => {
    setShake(field);
    setTimeout(() => setShake(null), 450);
  };

  const validate = (): boolean => {
    const errs: typeof fieldErr = {};
    if (!current.trim()) errs.current = 'Current key is required';
    if (newKey.length < 4) errs.new = 'New key must be at least 4 characters';
    if (newKey !== confirm) errs.confirm = 'Keys do not match';
    if (newKey === current && newKey.length >= 4) errs.new = 'New key must differ from current key';
    setFieldErr(errs);
    if (errs.current) { triggerShake('current'); currentRef.current?.focus(); return false; }
    if (errs.new)     { triggerShake('new'); return false; }
    if (errs.confirm) { triggerShake('confirm'); return false; }
    return true;
  };

  const submit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    setFieldErr({});

    const result = await changeKey(current, newKey);
    setSaving(false);

    if (result === 'ok') {
      setSuccess(true);
      addToast('Secret key updated successfully!', 'success', 'key');
      setTimeout(() => closeDialog(), 1400);
    } else if (result === 'wrong_current') {
      setFieldErr({ current: 'Current key is incorrect' });
      triggerShake('current');
      setCurrent('');
      currentRef.current?.focus();
    } else {
      addToast('Failed to update key — check your connection', 'error', 'wifi_off');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, newKey, confirm, changeKey, addToast, closeDialog]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlayV} initial="hidden" animate="visible" exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeDialog(); }}
        >
          <motion.div
            variants={cardV} initial="hidden" animate="visible" exit="exit"
            role="dialog" aria-modal="true" aria-labelledby="change-key-title"
            className="bg-[color:var(--color-surface-container-high)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="px-6 pt-6 pb-2 flex items-start gap-3">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary-fixed)' }}
              >
                <span
                  className="material-symbols-outlined fill"
                  style={{ fontSize: 20, color: 'var(--color-primary)' }}
                >
                  key
                </span>
              </div>
              <div>
                <h2
                  id="change-key-title"
                  className="text-xl font-bold text-[color:var(--color-on-surface)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Change Secret Key
                </h2>
                <p className="text-xs text-[color:var(--color-on-surface-variant)] mt-0.5">
                  Verify your current key, then set a new one.
                </p>
              </div>
            </div>

            {/* ── Success state ── */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-6 mb-4 mt-4 rounded-xl p-4 flex items-center gap-3"
                  style={{ background: 'var(--color-secondary-container)' }}
                >
                  <span
                    className="material-symbols-outlined fill"
                    style={{ fontSize: 22, color: 'var(--color-primary)' }}
                  >
                    check_circle
                  </span>
                  <p className="text-sm font-semibold text-[color:var(--color-on-surface)]">
                    Key updated! Closing…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Fields ── */}
            {!success && (
              <div className="px-6 py-4 flex flex-col gap-5">

                {/* Current Key */}
                <PasswordField
                  label="Current Secret Key *"
                  value={current}
                  onChange={v => { setCurrent(v); setFieldErr(p => ({ ...p, current: undefined })); }}
                  onKeyDown={handleKey}
                  show={showCur}
                  onToggleShow={() => setShowCur(s => !s)}
                  error={fieldErr.current}
                  shake={shake === 'current'}
                  inputRef={currentRef}
                  id="change-key-current"
                  placeholder="Enter current key…"
                />

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[color:var(--color-outline-variant)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-on-surface-variant)]">
                    New Key
                  </span>
                  <div className="flex-1 h-px bg-[color:var(--color-outline-variant)]" />
                </div>

                {/* New Key */}
                <PasswordField
                  label="New Secret Key *"
                  value={newKey}
                  onChange={v => { setNewKey(v); setFieldErr(p => ({ ...p, new: undefined, confirm: undefined })); }}
                  onKeyDown={handleKey}
                  show={showNew}
                  onToggleShow={() => setShowNew(s => !s)}
                  error={fieldErr.new}
                  shake={shake === 'new'}
                  id="change-key-new"
                  placeholder="At least 4 characters…"
                  hint={newKey.length > 0 && newKey.length < 4 ? `${newKey.length}/4 min` : undefined}
                />

                {/* Confirm Key */}
                <PasswordField
                  label="Confirm New Key *"
                  value={confirm}
                  onChange={v => { setConfirm(v); setFieldErr(p => ({ ...p, confirm: undefined })); }}
                  onKeyDown={handleKey}
                  show={showCon}
                  onToggleShow={() => setShowCon(s => !s)}
                  error={fieldErr.confirm}
                  shake={shake === 'confirm'}
                  id="change-key-confirm"
                  placeholder="Re-enter new key…"
                  matchOk={confirm.length > 0 && confirm === newKey}
                />
              </div>
            )}

            {/* ── Actions ── */}
            {!success && (
              <div
                className="px-6 py-4 flex justify-end gap-2 border-t border-[color:var(--color-outline-variant)]"
                style={{ background: 'var(--color-surface-container-low)' }}
              >
                <button
                  onClick={closeDialog}
                  disabled={saving}
                  className="h-10 px-5 rounded-full text-sm font-semibold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-fixed)] transition-colors active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={saving || !current.trim() || newKey.length < 4 || !confirm.trim()}
                  id="change-key-submit"
                  className="h-10 px-6 rounded-full text-sm font-semibold bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
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
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                      Update Key
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Internal helper component ────────────────────────────────────────────────

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  shake?: boolean;
  hint?: string;
  matchOk?: boolean;
  id: string;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

function PasswordField({
  label, value, onChange, onKeyDown, show, onToggleShow,
  error, shake, hint, matchOk, id, placeholder, inputRef,
}: PasswordFieldProps) {
  return (
    <motion.div animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}>
      <label
        htmlFor={id}
        className="block text-[11px] font-bold text-[color:var(--color-on-surface-variant)] mb-1.5 uppercase tracking-wide"
      >
        {label}
      </label>

      <div
        className="relative rounded-t-lg transition-colors"
        style={{
          background: 'var(--color-surface-variant)',
          outline: error ? '1.5px solid var(--color-error)' : undefined,
          outlineOffset: -1,
        }}
      >
        {/* key icon */}
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            fontSize: 18,
            color: error
              ? 'var(--color-error)'
              : matchOk
              ? 'var(--color-primary)'
              : 'var(--color-on-surface-variant)',
          }}
        >
          {matchOk ? 'check_circle' : 'key'}
        </span>

        <input
          ref={inputRef}
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent border-none outline-none pl-10 pr-10 py-3.5 text-[color:var(--color-on-surface)] text-sm font-medium placeholder-[color:var(--color-outline)]"
          style={{ caretColor: 'var(--color-primary)' }}
        />

        {/* toggle visibility */}
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {show ? 'visibility_off' : 'visibility'}
          </span>
        </button>

        {/* bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--color-outline)]" />
        <motion.div
          className="absolute bottom-0 left-0 h-0.5"
          style={{ background: error ? 'var(--color-error)' : matchOk ? 'var(--color-primary)' : 'var(--color-primary)' }}
          animate={{ width: value ? '100%' : '0%' }}
          transition={{ duration: 0.25 }}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1 mt-1 text-xs font-medium px-1"
            style={{ color: 'var(--color-error)' }}
          >
            <span className="material-symbols-outlined fill" style={{ fontSize: 13 }}>error</span>
            {error}
          </motion.p>
        )}
        {!error && hint && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-1 text-xs px-1"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
