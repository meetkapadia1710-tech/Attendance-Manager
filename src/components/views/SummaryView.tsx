import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { isoDate, calcMins, minsToHrStr, MONTH_NAMES, avatarPalette, initials } from '../../lib/utils';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import type { StaffMember } from '../../lib/types';

export function SummaryView({ onExport }: { onExport: () => void }) {
  const { year, month, staff, attendance } = useStore();

  const staffStats = useMemo(() => {
    const daysCount = new Date(year, month + 1, 0).getDate();
    return staff.map(s => {
      let totalMins = 0, daysWorked = 0;
      for (let d = 1; d <= daysCount; d++) {
        const e = attendance[`${isoDate(year, month, d)}__${s.id}`];
        if (e?.timeIn && e?.timeOut) {
          const m = calcMins(e.timeIn, e.timeOut);
          if (typeof m === 'number' && m > 0) { totalMins += m; daysWorked++; }
        }
      }
      return { ...s, totalMins, daysWorked, avgMins: daysWorked > 0 ? totalMins / daysWorked : 0 };
    }).sort((a, b) => b.totalMins - a.totalMins);
  }, [year, month, staff, attendance]);

  const grandTotal  = staffStats.reduce((acc, s) => acc + s.totalMins, 0);
  const activeStaff = staffStats.filter(s => s.daysWorked > 0).length;
  const maxMins     = Math.max(...staffStats.map(s => s.totalMins), 1);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pt-3">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2
            className="text-2xl font-bold text-[color:var(--color-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {MONTH_NAMES[month]} {year} — Summary
          </h2>
          <button
            onClick={onExport}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-[color:var(--color-primary)] border border-[color:var(--color-primary)] rounded-full text-sm font-semibold hover:bg-[color:var(--color-primary-fixed)] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>

        {/* Hero card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7b4b6b 0%, #613453 60%, #4a1235 100%)' }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: '#f1b5da', filter: 'blur(40px)' }} />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-15"
            style={{ background: '#ffd8ee', filter: 'blur(30px)' }} />

          <div className="relative z-10 text-center md:text-left">
            <p className="text-[#f1b5da] text-sm font-semibold mb-1 uppercase tracking-widest">Studio Grand Total</p>
            <div className="text-white font-bold" style={{ fontSize: 48, lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>
              <AnimatedNumber
                value={grandTotal / 60}
                format={v => v === 0 ? '0' : v.toFixed(v % 1 === 0 ? 0 : 1)}
                duration={0.9}
              />
              <span className="text-2xl font-normal ml-1 opacity-70">hrs</span>
            </div>
            <p className="text-[#ffd8ee] text-sm opacity-70 mt-1">Total staff-hours this month</p>
          </div>

          <div className="w-full md:w-px h-px md:h-20 opacity-20" style={{ background: '#ffd8ee' }} />

          <div className="relative z-10 text-center md:text-right">
            <p className="text-[#f1b5da] text-sm font-semibold mb-1 uppercase tracking-widest">Active Roster</p>
            <div className="text-white font-bold" style={{ fontSize: 48, lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>
              <AnimatedNumber value={activeStaff} format={v => Math.round(v).toString()} duration={0.6} />
            </div>
            <p className="text-[#ffd8ee] text-sm opacity-70 mt-1">Staff with hours this month</p>
          </div>
        </motion.section>

        {/* Staff cards */}
        {staffStats.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[color:var(--color-on-surface-variant)]">
            <span className="material-symbols-outlined opacity-30" style={{ fontSize: 56 }}>bar_chart</span>
            <p className="text-sm">No data for this month yet</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-[color:var(--color-on-surface)] -mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Employee Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffStats.map((s, idx) => (
                <StaffCard key={s.id} staff={s} idx={idx} maxMins={maxMins} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StaffCard({
  staff: s, idx, maxMins,
}: {
  staff: StaffMember & { totalMins: number; daysWorked: number; avgMins: number };
  idx: number;
  maxMins: number;
}) {
  const { bg, text } = avatarPalette(idx);
  const pct = maxMins > 0 ? (s.totalMins / maxMins) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, type: 'spring', stiffness: 260, damping: 28 }}
      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(97,52,83,0.14)' }}
      className="bg-[color:var(--color-surface)] rounded-2xl border border-[color:var(--color-outline-variant)] p-5 flex flex-col gap-4 cursor-default transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
          style={{ background: bg, color: text, fontFamily: 'var(--font-display)' }}
        >
          {initials(s.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[color:var(--color-on-surface)] truncate">{s.name}</p>
          <p className="text-xs text-[color:var(--color-on-surface-variant)] truncate">{s.role}</p>
        </div>
        {s.daysWorked === 0 && (
          <span className="ml-auto text-[10px] font-bold text-[color:var(--color-outline)] bg-[color:var(--color-surface-container)] px-2 py-0.5 rounded-full">
            No data
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Total Hours', val: minsToHrStr(s.totalMins) },
          { label: 'Days Worked', val: s.daysWorked.toString() },
          { label: 'Avg / Day', val: s.avgMins > 0 ? minsToHrStr(Math.round(s.avgMins)) : '—' },
        ].map(({ label, val }) => (
          <div key={label} className="bg-[color:var(--color-surface-container-low)] rounded-xl py-2 px-1">
            <div className="text-sm font-black text-[color:var(--color-primary)]">{val}</div>
            <div className="text-[9px] font-semibold text-[color:var(--color-on-surface-variant)] uppercase tracking-wide mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="h-1.5 bg-[color:var(--color-surface-container-highest)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #f1b5da, #613453)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: idx * 0.06 + 0.2, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
        <p className="text-[9px] text-[color:var(--color-on-surface-variant)] text-right">{pct.toFixed(0)}% of top performer</p>
      </div>
    </motion.div>
  );
}
