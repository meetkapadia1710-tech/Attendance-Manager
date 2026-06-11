import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import {
  daysInMonth, isoDate, calcMins, minsToHrStr,
  fmt12, MONTH_NAMES, downloadCSV,
} from './lib/utils';

// Auth
import { LoginScreen } from './components/auth/LoginScreen';

// Layout
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';

// Views
import { GridView } from './components/views/GridView';
import { StaffView } from './components/views/StaffView';
import { SummaryView } from './components/views/SummaryView';

// Dialogs
import { TimeEntryDialog } from './components/dialogs/TimeEntryDialog';
import { StaffDialog } from './components/dialogs/StaffDialog';
import { DeleteDialog } from './components/dialogs/DeleteDialog';
import { ChangeKeyDialog } from './components/dialogs/ChangeKeyDialog';

// UI
import { ToastContainer } from './components/ui/Toast';

import type { Variants } from 'framer-motion';

const viewVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function App() {
  const { view, year, month, staff, attendance } = useStore();

  // CSV Export — reads from Zustand store (Firestore-backed)
  const handleExport = useCallback(() => {
    if (staff.length === 0) return;
    const days = daysInMonth(year, month);
    const rows: string[][] = [];

    const header = [
      'Date',
      ...staff.map(s => `${s.name} (In)`),
      ...staff.map(s => `${s.name} (Out)`),
      ...staff.map(s => `${s.name} (Hrs)`),
      'Daily Total',
    ];
    rows.push(header);

    const colTotals = staff.map(() => 0);
    for (let d = 1; d <= days; d++) {
      const date = isoDate(year, month, d);
      const entries = staff.map(s => attendance[`${date}__${s.id}`] ?? null);
      let rowTotal = 0;

      const ins  = entries.map(e => e?.timeIn  ? fmt12(e.timeIn)  : '');
      const outs = entries.map(e => e?.timeOut ? fmt12(e.timeOut) : '');
      const hrs  = entries.map((e, i) => {
        if (!e?.timeIn || !e?.timeOut) return '';
        const m = calcMins(e.timeIn, e.timeOut);
        if (typeof m !== 'number' || m <= 0) return 'ERR';
        colTotals[i] += m;
        rowTotal += m;
        return minsToHrStr(m);
      });

      rows.push([date, ...ins, ...outs, ...hrs, rowTotal > 0 ? minsToHrStr(rowTotal) : '']);
    }

    rows.push(['MTD', ...staff.map(() => ''), ...staff.map(() => ''), ...colTotals.map(m => minsToHrStr(m)), minsToHrStr(colTotals.reduce((a, b) => a + b, 0))]);

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    downloadCSV(csv, `MannBeautyStudio_Attendance_${MONTH_NAMES[month]}${year}.csv`);
    useStore.getState().addToast('CSV exported!', 'success', 'download');
  }, [year, month, staff, attendance]);

  const { isAdmin } = useAuthStore();

  return (
    <>
      <AnimatePresence>
        {!isAdmin && <LoginScreen key="login" onUnlocked={() => {}} />}
      </AnimatePresence>

      {isAdmin && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="h-full flex flex-col overflow-hidden"
        >
          <Header onExport={handleExport} />

          <main className="flex-1 flex flex-col overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
            <AnimatePresence mode="wait">
              {view === 'grid' && (
                <motion.div key="grid" variants={viewVariants} initial="initial" animate="animate" exit="exit"
                  className="flex-1 flex flex-col overflow-hidden">
                  <GridView />
                </motion.div>
              )}
              {view === 'staff' && (
                <motion.div key="staff" variants={viewVariants} initial="initial" animate="animate" exit="exit"
                  className="flex-1 flex flex-col overflow-hidden">
                  <StaffView />
                </motion.div>
              )}
              {view === 'summary' && (
                <motion.div key="summary" variants={viewVariants} initial="initial" animate="animate" exit="exit"
                  className="flex-1 flex flex-col overflow-hidden">
                  <SummaryView onExport={handleExport} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <BottomNav />

          <TimeEntryDialog />
          <StaffDialog />
          <DeleteDialog />
          <ChangeKeyDialog />

          <ToastContainer />
        </motion.div>
      )}
    </>
  );
}
