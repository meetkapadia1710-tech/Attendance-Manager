import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { daysInMonth } from '../../lib/utils';
import { GridHeader } from './GridHeader';
import { GridRow } from './GridRow';
import { GridFooter } from './GridFooter';
import { GridSkeleton } from './GridSkeleton';

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '30%' : '-30%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 35 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-30%' : '30%',
    opacity: 0,
    transition: { duration: 0.18 },
  }),
};

export function AttendanceGrid() {
  const { year, month, monthDir, staff, attendance, loadingStaff, loadingAttendance } = useStore();
  const days = daysInMonth(year, month);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Track horizontal scroll for shadow cue
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollLeft > 4);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const loading = loadingStaff || loadingAttendance;

  if (staff.length === 0 && !loading) return null;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto relative"
      style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      {loading ? (
        <GridSkeleton rows={Math.min(days, 20)} cols={Math.max(staff.length, 3)} />
      ) : (
        <AnimatePresence mode="wait" custom={monthDir}>
          <motion.table
            key={`${year}-${month}`}
            custom={monthDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="border-collapse"
            style={{ minWidth: 'max-content', width: '100%' }}
          >
            <GridHeader staff={staff} />

            <tbody>
              {Array.from({ length: days }, (_, i) => (
                <GridRow
                  key={i + 1}
                  year={year}
                  month={month}
                  day={i + 1}
                  staff={staff}
                  attendance={attendance}
                />
              ))}
            </tbody>

            <GridFooter
              year={year}
              month={month}
              days={days}
              staff={staff}
              attendance={attendance}
            />
          </motion.table>
        </AnimatePresence>
      )}
    </div>
  );
}
