import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { StaffMember, AttendanceEntry } from '../../lib/types';
import { isoDate, calcMins, minsToHrStr } from '../../lib/utils';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface Props {
  year: number;
  month: number;
  days: number;
  staff: StaffMember[];
  attendance: Record<string, AttendanceEntry>;
}

export function GridFooter({ year, month, days, staff, attendance }: Props) {
  const colTotals = useMemo(() => {
    const totals = staff.map(() => 0);
    for (let d = 1; d <= days; d++) {
      const date = isoDate(year, month, d);
      staff.forEach((s, idx) => {
        const e = attendance[`${date}__${s.id}`];
        if (e?.timeIn && e?.timeOut) {
          const m = calcMins(e.timeIn, e.timeOut);
          if (typeof m === 'number' && m > 0) totals[idx] += m;
        }
      });
    }
    return totals;
  }, [year, month, days, staff, attendance]);

  const grandTotal = colTotals.reduce((a, b) => a + b, 0);

  return (
    <tfoot className="sticky bottom-0 z-20">
      <tr className="border-t-2 border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-variant)]">
        {/* MTD label */}
        <td
          className="sticky left-0 z-30 bg-[color:var(--color-surface-variant)] border-r border-[color:var(--color-outline-variant)] text-center p-2"
          style={{ minWidth: 72 }}
        >
          <span className="text-[10px] font-black text-[color:var(--color-on-surface-variant)] uppercase tracking-widest">
            MTD
          </span>
        </td>

        {/* Per-staff totals */}
        {colTotals.map((mins, idx) => (
          <motion.td
            key={staff[idx]?.id ?? idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.3 }}
            className="border-r border-[color:var(--color-outline-variant)] text-center p-2"
            style={{ minWidth: 148 }}
          >
            <span className="text-base font-black text-[color:var(--color-on-surface)]">
              <AnimatedNumber
                value={mins / 60}
                format={v => v === 0 ? '0h' : `${v.toFixed(v % 1 === 0 ? 0 : 1)}h`}
                duration={0.6}
              />
            </span>
          </motion.td>
        ))}

        {/* Grand total */}
        <td
          className="sticky right-0 z-30 text-center p-2 shadow-right"
          style={{
            minWidth: 90,
            background: 'linear-gradient(135deg, #7b4b6b, #613453)',
            color: '#fec0e6',
          }}
        >
          <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-0.5">Studio</div>
          <div className="text-sm font-black">
            <AnimatedNumber
              value={grandTotal / 60}
              format={v => v === 0 ? '0h' : `${v.toFixed(v % 1 === 0 ? 0 : 1)}h`}
              duration={0.7}
            />
          </div>
        </td>
      </tr>
    </tfoot>
  );
}
