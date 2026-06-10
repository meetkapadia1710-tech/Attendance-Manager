import { useCallback, useRef } from 'react';
import type { AttendanceEntry, CellStatus } from '../../lib/types';
import { getCellStatus, fmt12, minsToHrStr, calcTotalMins, normalizeBlocks } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  staffId: string;
  date: string;
  entry: AttendanceEntry | null;
  isToday: boolean;
}

const STATUS_BG: Record<CellStatus, string> = {
  empty:      '',
  present:    'cell-present',
  inprogress: 'cell-inprogress',
  error:      'cell-error',
};

export function AttendanceCell({ staffId, date, entry, isToday }: Props) {
  const { openDialog } = useStore();
  const { isAdmin } = useAuthStore();
  const status = getCellStatus(entry);
  const cellRef = useRef<HTMLTableCellElement>(null);

  const handleClick = useCallback(() => {
    if (!isAdmin) return; // read-only for non-admins
    if (cellRef.current) {
      const el = cellRef.current;
      const rect = el.getBoundingClientRect();
      const dot = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 2;
      dot.className = 'ripple-dot';
      dot.style.cssText = `width:${size}px;height:${size}px;left:${rect.width/2 - size/2}px;top:${rect.height/2 - size/2}px`;
      el.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    }
    openDialog({ type: 'time', staffId, date });
  }, [staffId, date, openDialog]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTableCellElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
    if (e.key === 'ArrowRight') focusCell(cellRef.current, 0,  1);
    if (e.key === 'ArrowLeft')  focusCell(cellRef.current, 0, -1);
    if (e.key === 'ArrowDown')  focusCell(cellRef.current,  1, 0);
    if (e.key === 'ArrowUp')    focusCell(cellRef.current, -1, 0);
  }, [handleClick]);

  const mins = calcTotalMins(entry);

  return (
    <td
      ref={cellRef}
      tabIndex={isAdmin ? 0 : -1}
      role={isAdmin ? 'button' : 'cell'}
      aria-label={`${date} attendance${!isAdmin ? ' (read-only)' : ''}`}
      onClick={handleClick}
      onKeyDown={isAdmin ? handleKeyDown : undefined}
      title={!isAdmin ? 'Login as Admin to edit' : undefined}
      className={`ripple-host align-middle outline-none focus-primary
        transition-all duration-150 select-none group/cell
        border-r border-[color:var(--color-outline-variant)]
        ${isAdmin ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}
        ${STATUS_BG[status]}
        ${isToday && status === 'empty' ? 'bg-[rgba(97,52,83,0.03)]' : ''}`}
      style={{ minWidth: 148, padding: '6px 10px', textAlign: 'center', verticalAlign: 'middle' }}
    >
      <CellContent status={status} entry={entry} mins={mins} />
    </td>
  );
}

function CellContent({
  status, entry, mins,
}: {
  status: CellStatus;
  entry: AttendanceEntry | null;
  mins: number | null | -1;
}) {
  if (status === 'empty') {
    return <span className="text-sm opacity-30 group-hover/cell:opacity-60 transition-opacity" style={{ color: 'var(--color-outline)' }}>—</span>;
  }
  
  const blocks = normalizeBlocks(entry);
  const displayBlocks = blocks.length > 0 ? blocks : [{ in: '', out: '' }];

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-0.5 items-center">
        {displayBlocks.map((b, i) => (
          <span key={i} className="text-[11px] font-medium leading-tight whitespace-nowrap" style={{ color: 'var(--color-error)' }}>
            {fmt12(b.in)} – {fmt12(b.out)}
          </span>
        ))}
        <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-error)' }}>
          <span className="material-symbols-outlined fill text-[12px]">error</span> Invalid
        </span>
      </div>
    );
  }
  if (status === 'inprogress') {
    return (
      <div className="flex flex-col gap-0.5 items-center">
        {displayBlocks.map((b, i) => (
          <span key={i} className="text-[11px] leading-tight whitespace-nowrap" style={{ color: 'var(--color-on-surface-variant)' }}>
            {b.in && !b.out ? fmt12(b.in) : `${fmt12(b.in)} – ${fmt12(b.out)}`}
          </span>
        ))}
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wide mt-0.5">In Progress</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5 items-center">
      {displayBlocks.map((b, i) => (
        <span key={i} className="text-[11px] leading-tight whitespace-nowrap" style={{ color: 'var(--color-on-surface-variant)' }}>
          {fmt12(b.in)} – {fmt12(b.out)}
        </span>
      ))}
      <span className="text-xs font-bold mt-0.5" style={{ color: 'var(--color-primary)' }}>
        {minsToHrStr(mins as number)}
      </span>
    </div>
  );
}

function focusCell(el: HTMLElement | null, rowDelta: number, colDelta: number) {
  if (!el) return;
  const row = el.closest('tr');
  const tbody = el.closest('tbody');
  if (!row || !tbody) return;
  const rows  = Array.from(tbody.querySelectorAll('tr'));
  const cells = Array.from(row.querySelectorAll('td[tabindex]'));
  const rIdx  = rows.indexOf(row as HTMLTableRowElement);
  const cIdx  = cells.indexOf(el);
  if (rowDelta !== 0) {
    const nextCells = Array.from((rows[rIdx + rowDelta] ?? rows[0]).querySelectorAll('td[tabindex]'));
    (nextCells[cIdx] as HTMLElement)?.focus();
  } else {
    (cells[cIdx + colDelta] as HTMLElement)?.focus();
  }
}
