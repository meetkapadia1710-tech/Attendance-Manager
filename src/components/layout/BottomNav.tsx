import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import type { ViewType } from '../../lib/types';

const TABS: { id: ViewType; label: string; icon: string }[] = [
  { id: 'grid',    label: 'Attendance', icon: 'calendar_month' },
  { id: 'staff',   label: 'Staff',      icon: 'manage_accounts' },
  { id: 'summary', label: 'Summary',    icon: 'bar_chart' },
];

export function BottomNav() {
  const { view, setView } = useStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-low border-t border-outline-variant flex">
      {TABS.map(tab => {
        const active = view === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
          >
            {active && (
              <motion.span
                layoutId="bottom-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span
              className={`material-symbols-outlined transition-all ${active ? 'fill text-primary' : 'text-on-surface-variant'}`}
              style={{ fontSize: 22, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
