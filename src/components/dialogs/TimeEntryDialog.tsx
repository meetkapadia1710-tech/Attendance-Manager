import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { fsSetEntry, fsClearEntry } from '../../lib/firestore';
import { calcMins, minsToHrStr } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import type { AttendanceEntry } from '../../lib/types';

const overlayV = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};
const cardV = {
  hidden:  { opacity: 0, scale: 0.93, y: 24 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.93, y: 16, transition: { duration: 0.18 } },
};

export function TimeEntryDialog() {
  const { dialog, closeDialog, addToast, staff, attendance } = useStore();
  const open    = dialog?.type === 'time';
  const staffId = open ? dialog.staffId : '';
  const date    = open ? dialog.date    : '';

  const sIdx = staff.findIndex(s => s.id === staffId);
  const sObj = staff[sIdx] ?? null;

  const [timeIn,  setTimeIn]  = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const inRef = useRef<HTMLInputElement>(null);

  // Load existing entry from reactive store (not db)
  useEffect(() => {
    if (!open) return;
    const key   = `${date}__${staffId}`;
    const entry: AttendanceEntry = attendance[key] ?? { timeIn: '', timeOut: '' };
    setTimeIn(entry.timeIn ?? '');
    setTimeOut(entry.timeOut ?? '');
    setSaving(false);
    setSaved(false);
    setTimeout(() => inRef.current?.focus(), 80);
  }, [open, date, staffId, attendance]);

  // Escape + focus trap
  const trapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeDialog(); return; }
      if (e.key === 'Tab' && trapRef.current) {
        const els = Array.from(
          trapRef.current.querySelectorAll<HTMLElement>('button,input,[tabindex]:not([tabindex="-1"])')
        );
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, closeDialog]);

  const mins    = calcMins(timeIn, timeOut);
  const isError = mins === -1;
  const hasData = !!(timeIn || timeOut);

  const save = useCallback(async () => {
    if (isError) return;
    setSaving(true);
    try {
      await fsSetEntry(date, staffId, { timeIn, timeOut });
      // Firestore onSnapshot will push the update into the store automatically
      setSaved(true);
      addToast(`Saved — ${sObj?.name ?? 'Staff'}`, 'success');
      setTimeout(closeDialog, 340);
    } catch (err) {
      console.error('[TimeEntry] Save failed:', err);
      addToast('Save failed — check your connection', 'error', 'wifi_off');
    } finally {
      setSaving(false);
    }
  }, [isError, date, staffId, timeIn, timeOut, addToast, closeDialog, sObj]);

  const clear = useCallback(async () => {
    try {
      await fsClearEntry(date, staffId);
      addToast('Entry cleared', 'info', 'delete');
      closeDialog();
    } catch (err) {
      console.error('[TimeEntry] Clear failed:', err);
      addToast('Clear failed — check your connection', 'error', 'wifi_off');
    }
  }, [date, staffId, addToast, closeDialog]);

  const dateLabel = (() => {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlayV}
          initial="hidden" animate="visible" exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeDialog(); }}
        >
          <motion.div
            ref={trapRef}
            variants={cardV}
            initial="hidden" animate="visible" exit="exit"
            role="dialog" aria-modal="true" aria-labelledby="td-title"
            className="bg-[color:var(--color-surface-container-high)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3">
              {sObj && <Avatar name={sObj.name} idx={sIdx} size="md" />}
              <div className="flex-1 min-w-0">
                <h2 id="td-title" className="text-base font-bold text-[color:var(--color-on-surface)] truncate">
                  {sObj?.name ?? ''}
                </h2>
                <p className="text-xs text-[color:var(--color-on-surface-variant)]">{dateLabel}</p>
              </div>
              <button
                onClick={closeDialog}
                className="w-9 h-9 rounded-full hover:bg-[color:var(--color-surface-container-highest)] flex items-center justify-center text-[color:var(--color-on-surface-variant)] transition-colors shrink-0 active:scale-90"
                aria-label="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <TimeField label="Time In"  value={timeIn}  onChange={setTimeIn}  inputRef={inRef} error={false} />
                <TimeField label="Time Out" value={timeOut} onChange={setTimeOut} error={isError} />
              </div>

              <AnimatePresence>
                {isError && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-[color:var(--color-error)] text-xs font-medium px-1">
                      <span className="material-symbols-outlined fill text-[16px]">error</span>
                      Time Out must be after Time In
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Duration chip */}
              <div className="bg-[color:var(--color-surface-container)] rounded-xl px-4 py-3 flex items-center justify-between border border-[color:var(--color-outline-variant)]">
                <span className="text-sm text-[color:var(--color-on-surface-variant)] font-medium">Calculated Duration</span>
                <motion.span
                  key={typeof mins === 'number' && mins > 0 ? mins : 'empty'}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="text-sm font-bold flex items-center gap-1"
                  style={{
                    color: isError ? 'var(--color-error)' :
                           typeof mins === 'number' && mins > 0 ? 'var(--color-primary)' :
                           'var(--color-on-surface-variant)',
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {typeof mins === 'number' && mins > 0 ? minsToHrStr(mins) : '—'}
                </motion.span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-low)]">
              <button
                onClick={clear}
                disabled={!hasData || saving}
                className="h-10 px-4 rounded-full text-sm font-semibold text-[color:var(--color-error)] hover:bg-[color:var(--color-error-container)] transition-colors disabled:opacity-30 active:scale-95"
              >
                Clear
              </button>
              <div className="flex gap-2">
                <button
                  onClick={closeDialog}
                  className="h-10 px-4 rounded-full text-sm font-semibold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-fixed)] transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={isError || saving}
                  className="h-10 px-5 rounded-full text-sm font-semibold bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] shadow-sm transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
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
                  ) : saved ? (
                    <>
                      <span className="material-symbols-outlined fill text-[16px]">check_circle</span>
                      Saved!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TimeField({
  label, value, onChange, error = false, inputRef,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[color:var(--color-on-surface-variant)] mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div
        className="relative rounded-t-lg overflow-hidden transition-colors"
        style={{ background: error ? 'var(--color-error-container)' : 'var(--color-surface-variant)' }}
      >
        <input
          ref={inputRef}
          type="time"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent border-none outline-none text-[color:var(--color-on-surface)] text-base font-semibold px-3 pt-2 pb-2 cursor-pointer"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: error ? 'var(--color-error)' : 'var(--color-outline)' }}
        />
        {focused && !error && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-[color:var(--color-primary)]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    </div>
  );
}
