import { useStore } from '../../store/useStore';
import { isoDate, TODAY, calcMins, daysInMonth, minsToHrStr } from '../../lib/utils';
import { AttendanceGrid } from '../grid/AttendanceGrid';

export function GridView() {
  const { staff, attendance, loadingStaff, year, month, openDialog } = useStore();

  // Stats
  const todayStr = isoDate(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  let presentToday = 0;
  let monthlyMins  = 0;
  const days = daysInMonth(year, month);

  staff.forEach(s => {
    const e = attendance[`${todayStr}__${s.id}`];
    if (e?.timeIn) presentToday++;
  });

  for (let d = 1; d <= days; d++) {
    const date = isoDate(year, month, d);
    staff.forEach(s => {
      const e = attendance[`${date}__${s.id}`];
      if (e?.timeIn && e?.timeOut) {
        const m = calcMins(e.timeIn, e.timeOut);
        if (typeof m === 'number' && m > 0) monthlyMins += m;
      }
    });
  }

  const isEmpty = !loadingStaff && staff.length === 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 pt-3 gap-3">
      {/* Stats bar */}
      {!isEmpty && staff.length > 0 && (
        <div className="flex items-center gap-4 text-sm flex-wrap shrink-0">
          <Stat icon="group" label={`${staff.length} staff`} />
          <div className="w-px h-4 bg-[color:var(--color-outline-variant)]" />
          <Stat icon="schedule" label={`${minsToHrStr(monthlyMins)} this month`} />
          <div className="w-px h-4 bg-[color:var(--color-outline-variant)]" />
          <Stat icon="check_circle" label={`${presentToday} present today`} color="text-green-700" iconFill />
        </div>
      )}

      {/* Grid or empty state */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[color:var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined opacity-30" style={{ fontSize: 72 }}>group_add</span>
          <p className="text-xl font-bold text-[color:var(--color-on-surface)]" style={{ fontFamily: 'var(--font-display)' }}>No staff yet</p>
          <p className="text-sm text-center max-w-xs">Add your first team member to start tracking attendance.</p>
          <button
            onClick={() => openDialog({ type: 'addStaff' })}
            className="mt-2 px-6 py-3 bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] rounded-full text-sm font-bold shadow transition-all active:scale-95"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="material-symbols-outlined text-[16px] align-middle mr-1">person_add</span>
            Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="flex-1 bg-[color:var(--color-surface)] rounded-2xl border border-[color:var(--color-outline-variant)] overflow-hidden flex flex-col shadow-sm">
          <AttendanceGrid />
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, color = 'text-[color:var(--color-on-surface-variant)]', iconFill = false }: {
  icon: string; label: string; color?: string; iconFill?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <span className={`material-symbols-outlined text-[16px] ${iconFill ? 'fill' : ''}`}>{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
