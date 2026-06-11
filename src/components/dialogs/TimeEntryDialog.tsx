import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { fsSetEntry, fsClearEntry } from '../../lib/firestore';
import { calcMins, minsToHrStr, normalizeBlocks } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import type { AttendanceEntry, TimeBlock } from '../../lib/types';

/** Stable unique key for each time block (not stored — UI only) */
type BlockRow = TimeBlock & { _id: string };
let _uid = 0;
const mkBlock = (b: TimeBlock = { in: '', out: '' }): BlockRow => ({ ...b, _id: `b${++_uid}` });

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

  const [blocks, setBlocks] = useState<BlockRow[]>([mkBlock()]);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const inRef = useRef<any>(null);

  // Load existing entry from reactive store (not db)
  useEffect(() => {
    if (!open) return;
    const key   = `${date}__${staffId}`;
    const entry: AttendanceEntry = attendance[key] ?? {};
    const norm = normalizeBlocks(entry);
    setBlocks(norm.length ? norm.map(mkBlock) : [mkBlock()]);
    setSaving(false);
    setSaved(false);
    setTimeout(() => inRef.current?.focus(), 80);
  }, [open, date, staffId, attendance]);

  const addBlock = () => setBlocks(prev => [...prev, mkBlock()]);
  const removeBlock = (i: number) => {
    const next = [...blocks];
    next.splice(i, 1);
    setBlocks(next.length ? next : [mkBlock()]);
  };
  const updateBlock = (i: number, field: 'in' | 'out', val: string) => {
    const next = [...blocks];
    next[i] = { ...next[i], [field]: val };
    setBlocks(next);
  };

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

  let totalMins = 0;
  let isError = false;
  let hasData = false;

  blocks.forEach(b => {
    if (b.in || b.out) hasData = true;
    if (b.in && b.out) {
      const m = calcMins(b.in, b.out);
      if (m === -1) isError = true;
      else if (m !== null) totalMins += m;
    }
  });

  const save = useCallback(async () => {
    if (isError) return;
    setSaving(true);
    try {
      // Strip the internal _id before saving — Firestore only gets TimeBlock fields
      const cleanBlocks: TimeBlock[] = blocks.map(({ _id: _, ...b }) => b);
      await fsSetEntry(date, staffId, { timeIn: '', timeOut: '', blocks: cleanBlocks });
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
  }, [isError, date, staffId, blocks, addToast, closeDialog, sObj]);

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
          className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeDialog(); }}
        >
          <motion.div
            ref={trapRef}
            variants={cardV}
            initial="hidden" animate="visible" exit="exit"
            role="dialog" aria-modal="true" aria-labelledby="td-title"
            className="bg-[color:var(--color-surface-container-high)] rounded-2xl shadow-2xl w-full max-w-sm my-auto relative"
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
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {blocks.map((b, i) => {
                    const blockErr = !!b.in && !!b.out && calcMins(b.in, b.out) === -1;
                    return (
                      <motion.div
                        key={b._id}
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', transitionEnd: { overflow: 'visible' } }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <TimeField
                            label="Time In"
                            value={b.in}
                            onChange={(v) => updateBlock(i, 'in', v)}
                            inputRef={i === 0 ? inRef : undefined}
                            error={false}
                          />
                          <TimeField
                            label="Time Out"
                            value={b.out}
                            onChange={(v) => updateBlock(i, 'out', v)}
                            error={blockErr}
                          />
                        </div>
                        {blocks.length > 1 && (
                          <button
                            onClick={() => removeBlock(i)}
                            className="mt-6 w-10 h-10 shrink-0 flex items-center justify-center text-[color:var(--color-error)] hover:bg-[color:var(--color-error-container)] rounded-full transition-colors active:scale-90"
                            title="Remove timing"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                <button
                  onClick={addBlock}
                  className="self-start text-sm font-semibold text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-container-highest)] px-3 py-1.5 rounded-full transition-colors active:scale-95 flex items-center gap-1.5 mt-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  Add Block
                </button>
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
                <span className="text-sm text-[color:var(--color-on-surface-variant)] font-medium">Total Duration</span>
                <motion.span
                  key={totalMins > 0 ? totalMins : 'empty'}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="text-sm font-bold flex items-center gap-1"
                  style={{
                    color: isError ? 'var(--color-error)' :
                           totalMins > 0 ? 'var(--color-primary)' :
                           'var(--color-on-surface-variant)',
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {totalMins > 0 ? minsToHrStr(totalMins) : '—'}
                </motion.span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-low)] rounded-b-2xl">
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

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINS = ['00','05','10','15','20','25','30','35','40','45','50','55'];

function TimeField({
  label, value, onChange, error = false, inputRef,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  inputRef?: any;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [open]);

  const h24 = value ? parseInt(value.split(':')[0], 10) : null;
  const min = value ? value.split(':')[1] : '';
  const ampm = h24 !== null ? (h24 >= 12 ? 'PM' : 'AM') : 'AM';
  const h12 = h24 !== null ? (h24 % 12 || 12).toString() : '';

  const setTime = (h: string | number, m: string | number, ap: string) => {
    let finalH = parseInt(h.toString(), 10) || 12;
    let finalM = parseInt(m.toString(), 10) || 0;
    
    // clamp minutes
    if (finalM < 0) finalM = 59;
    if (finalM > 59) finalM = 0;

    let h24Val = finalH;
    if (ap === 'PM' && finalH < 12) h24Val += 12;
    if (ap === 'AM' && finalH === 12) h24Val = 0;
    
    onChange(`${h24Val.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[11px] font-semibold text-[color:var(--color-on-surface-variant)] mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div
        ref={inputRef}
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
        className="relative rounded-t-lg overflow-hidden transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-inset"
        style={{ background: error ? 'var(--color-error-container)' : 'var(--color-surface-variant)' }}
      >
        <div className="px-3 pt-2 pb-2 w-full flex items-center justify-between">
           <span className="text-base font-semibold" style={{ color: value ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)' }}>
             {value ? `${h12.padStart(2, '0')}:${min} ${ampm}` : '--:--'}
           </span>
           <span className="material-symbols-outlined text-[18px] opacity-50 text-[color:var(--color-on-surface)]">schedule</span>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: error ? 'var(--color-error)' : 'var(--color-outline)' }}
        />
        {open && !error && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--color-primary)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-[320px] bg-[color:var(--color-surface-container-high)] border border-[color:var(--color-outline-variant)] shadow-xl rounded-2xl p-5 z-[200]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[color:var(--color-on-surface)] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                Time
              </span>
              <div className="flex bg-[color:var(--color-surface-variant)] p-1 rounded-lg">
                <button 
                  onClick={(e) => { e.stopPropagation(); setTime(h12 || 12, min, 'AM'); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${ampm === 'AM' ? 'bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] shadow-sm' : 'text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container-highest)]'}`}
                >AM</button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setTime(h12 || 12, min, 'PM'); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${ampm === 'PM' ? 'bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] shadow-sm' : 'text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container-highest)]'}`}
                >PM</button>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-[11px] font-extrabold text-[color:var(--color-on-surface-variant)] tracking-wider mb-2.5 uppercase">Hour</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {HOURS.map(h => (
                    <button 
                      key={h} 
                      onClick={(e) => { e.stopPropagation(); setTime(h, min, ampm); }}
                      className={`h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-colors active:scale-95 ${parseInt(h12) === h ? 'bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)]' : 'hover:bg-[color:var(--color-surface-container-highest)] text-[color:var(--color-on-surface)]'}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-px bg-[color:var(--color-outline-variant)] opacity-50" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-[11px] font-extrabold text-[color:var(--color-on-surface-variant)] tracking-wider uppercase">Minute</div>
                  <div className="flex gap-1 items-center bg-[color:var(--color-surface-variant)] rounded px-1 py-0.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTime(h12 || 12, parseInt(min || '0') - 1, ampm); }}
                      className="text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-on-surface)] text-[14px] font-black px-1.5 active:scale-90"
                    >-</button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTime(h12 || 12, parseInt(min || '0') + 1, ampm); }}
                      className="text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-on-surface)] text-[14px] font-black px-1.5 active:scale-90"
                    >+</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MINS.map(m => (
                    <button 
                      key={m} 
                      onClick={(e) => { e.stopPropagation(); setTime(h12 || 12, m, ampm); setOpen(false); }}
                      className={`h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-colors active:scale-95 ${min === m ? 'bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)]' : 'hover:bg-[color:var(--color-surface-container-highest)] text-[color:var(--color-on-surface)]'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
