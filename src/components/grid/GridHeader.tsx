import type { StaffMember } from '../../lib/types';
import { Avatar } from '../ui/Avatar';

interface Props {
  staff: StaffMember[];
}

export function GridHeader({ staff }: Props) {
  return (
    <thead className="sticky top-0 z-20">
      <tr className="border-b border-outline-variant bg-surface-container-low shadow-sm">
        {/* Date corner */}
        <th
          className="sticky left-0 z-30 bg-surface-container-low border-r border-outline-variant"
          style={{ minWidth: 72, width: 72, padding: '10px 8px', textAlign: 'center', verticalAlign: 'bottom' }}
        >
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Date</span>
        </th>

        {/* Staff columns */}
        {staff.map((s, idx) => (
          <th
            key={s.id}
            className="border-r border-outline-variant bg-surface-container-low"
            style={{ minWidth: 148, padding: '8px 10px', textAlign: 'center', verticalAlign: 'bottom' }}
          >
            <div className="flex flex-col items-center gap-1">
              <Avatar name={s.name} idx={idx} size="sm" />
              <div className="leading-tight">
                <div className="text-xs font-bold text-on-surface truncate max-w-[120px]">
                  {s.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-on-surface-variant font-medium truncate max-w-[120px]">
                  {s.role}
                </div>
              </div>
            </div>
          </th>
        ))}

        {/* Daily total corner */}
        <th
          className="sticky right-0 z-30 bg-surface-container-low border-l border-outline-variant shadow-right"
          style={{ minWidth: 90, padding: '10px 8px', textAlign: 'center', verticalAlign: 'bottom' }}
        >
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Total</span>
        </th>
      </tr>
    </thead>
  );
}
