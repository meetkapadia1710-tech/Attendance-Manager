import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MONTH_NAMES } from '../../lib/utils';
import { useStore } from '../../store/useStore';

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export function MonthPicker({ open, anchorEl, onClose }: Props) {
  const { year, month } = useStore();
  const [pickerYear, setPickerYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  // Sync picker year when opening
  useEffect(() => { if (open) setPickerYear(year); }, [open, year]);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          anchorEl && !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorEl]);

  function select(m: number) {
    const dir = pickerYear !== year ? (pickerYear > year ? 1 : -1) :
                m !== month ? (m > month ? 1 : -1) : 0;
    useStore.setState({ year: pickerYear, month: m, monthDir: dir });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.9, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -6 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[100] bg-surface-container-high rounded-2xl shadow-xl border border-outline-variant p-4"
          style={{ width: 256, transformOrigin: 'top center' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Year row */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setPickerYear(y => y - 1)}
              className="p-1.5 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors active:scale-90">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            <motion.span key={pickerYear} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="font-display font-semibold text-on-surface text-sm select-none">
              {pickerYear}
            </motion.span>
            <button onClick={() => setPickerYear(y => y + 1)}
              className="p-1.5 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors active:scale-90">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1">
            {MONTH_NAMES.map((name, i) => {
              const active = i === month && pickerYear === year;
              return (
                <motion.button
                  key={name}
                  onClick={() => select(i)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-colors ${
                    active ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-surface-container-highest text-on-surface'
                  }`}
                >
                  {name.substring(0, 3)}
                </motion.button>
              );
            })}
          </div>

          {/* Today */}
          <button
            onClick={() => { useStore.getState().goToToday(); onClose(); }}
            className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary-fixed transition-colors border border-outline-variant"
          >
            Go to Today
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
