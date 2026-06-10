import { memo } from 'react';
import type { StaffMember, AttendanceEntry } from '../../lib/types';
import { DAY_SHORT, isoDate, isToday as checkToday, calcTotalMins, minsToHrStr } from '../../lib/utils';
import { AttendanceCell } from './AttendanceCell';

interface Props {
  year: number;
  month: number;
  day: number;
  staff: StaffMember[];
  attendance: Record<string, AttendanceEntry>; // from Zustand (Firestore-backed)
}

export const GridRow = memo(function GridRow({ year, month, day, staff, attendance }: Props) {
  const date    = isoDate(year, month, day);
  const dow     = new Date(year, month, day).getDay();
  const todayRow = checkToday(year, month, day);

  // Read entries directly from the reactive attendance map
  const entries: (AttendanceEntry | null)[] = staff.map(s => {
    return attendance[`${date}__${s.id}`] ?? null;
  });

  // Row total
  let rowMins = 0;
  let hasData = false;
  entries.forEach(e => {
    const tm = calcTotalMins(e);
    if (typeof tm === 'number' && tm > 0) { rowMins += tm; hasData = true; }
  });

  const dateBg = todayRow
    ? 'bg-[rgba(255,242,249,0.98)] group-hover:bg-[rgba(255,233,245,0.98)] border-r border-[color:var(--color-primary-fixed)]'
    : 'bg-[color:var(--color-surface)] group-hover:bg-[color:var(--color-surface-container-lowest)] border-r border-[color:var(--color-outline-variant)]';

  const totalBg = todayRow
    ? 'bg-[rgba(255,242,249,0.98)] group-hover:bg-[rgba(255,233,245,0.98)] border-l border-[color:var(--color-primary-fixed)] shadow-right'
    : 'bg-[color:var(--color-surface)] group-hover:bg-[color:var(--color-surface-container-lowest)] border-l border-[color:var(--color-outline-variant)] shadow-right';

  return (
    <tr
      className={`group border-b transition-colors duration-100 ${
        todayRow
          ? 'border-[color:var(--color-primary-fixed)] today-row'
          : 'border-[color:var(--color-outline-variant)] hover:bg-[color:var(--color-surface-container-lowest)]'
      }`}
    >
      {/* Date cell — sticky left */}
      <td
        className={`sticky left-0 z-10 text-center p-1.5 relative ${dateBg}`}
        style={{ minWidth: 72, width: 72 }}
      >
        {todayRow && (
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[color:var(--color-primary)] rounded-r" />
        )}
        <div
          className="text-base font-bold leading-tight"
          style={{ color: todayRow ? 'var(--color-primary)' : 'var(--color-on-surface)' }}
        >
          {day}
        </div>
        <div
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: todayRow ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', opacity: todayRow ? 0.8 : 1 }}
        >
          {DAY_SHORT[dow]}
        </div>
      </td>

      {/* Attendance cells */}
      {staff.map((s) => (
        <AttendanceCell
          key={s.id}
          staffId={s.id}
          date={date}
          entry={entries[staff.indexOf(s)]}
          isToday={todayRow}
        />
      ))}

      {/* Row total — sticky right */}
      <td
        className={`sticky right-0 z-10 text-center p-2 ${totalBg}`}
        style={{ minWidth: 90 }}
      >
        {hasData
          ? (
            <span
              className="text-sm font-bold"
              style={{ color: todayRow ? 'var(--color-primary)' : 'var(--color-on-surface)' }}
            >
              {minsToHrStr(rowMins)}
            </span>
          )
          : <span className="text-sm opacity-30" style={{ color: 'var(--color-outline)' }}>—</span>
        }
      </td>
    </tr>
  );
}, (prev, next) =>
  prev.day === next.day &&
  prev.year === next.year &&
  prev.month === next.month &&
  prev.attendance === next.attendance &&
  prev.staff === next.staff
);
