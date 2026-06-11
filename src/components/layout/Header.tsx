import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MONTH_NAMES } from '../../lib/utils';
import { MonthPicker } from '../ui/MonthPicker';
import { AdminControls } from '../ui/AdminControls';
import type { ViewType } from '../../lib/types';

const TABS: { id: ViewType; label: string; icon: string }[] = [
  { id: 'grid',    label: 'Attendance',     icon: 'calendar_month' },
  { id: 'staff',   label: 'Manage Staff',   icon: 'manage_accounts' },
  { id: 'summary', label: 'Monthly Summary', icon: 'bar_chart' },
];

export function Header({ onExport }: { onExport: () => void }) {
  const { view, setView, year, month, changeMonth, goToToday, openDialog } = useStore();
  const { isAdmin } = useAuthStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <header
      className="sticky top-0 z-50 shadow-sm select-none pt-[env(safe-area-inset-top)]"
      style={{ background: 'var(--color-surface-container)' }}
    >
      <div className="flex flex-wrap items-center min-h-14 py-2 lg:py-0 px-3 sm:px-6 gap-y-3 gap-x-2">

        {/* ── Brand ── */}
        <div className="flex items-center gap-2 shrink-0 order-1">
          <span className="material-symbols-outlined fill" style={{ fontSize: 26, color: 'var(--color-primary)' }}>spa</span>
          <h1
            className="font-bold hidden sm:block leading-none"
            style={{ fontSize: 17, color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}
          >
            Mann Beauty Studio
          </h1>
        </div>

        {/* ── Tabs (desktop) ── */}
        <nav className="hidden lg:flex items-end gap-0 self-stretch relative ml-2 order-2" style={{ paddingTop: 6 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`relative px-4 h-full text-sm font-semibold transition-colors whitespace-nowrap`}
              style={{
                color: view === tab.id
                  ? 'var(--color-primary)'
                  : 'var(--color-on-surface-variant)',
              }}
            >
              {tab.label}
              {view === tab.id && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                  style={{ background: 'var(--color-primary)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* ── Spacer ── */}
        <div className="hidden lg:block flex-1 order-3" />

        {/* ── Month Nav (only on grid view) ── */}
        <motion.div
          animate={{ opacity: view === 'grid' ? 1 : 0, pointerEvents: view === 'grid' ? 'auto' : 'none', height: view === 'grid' ? 'auto' : 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-center gap-2 w-full lg:w-auto order-5 lg:order-4 overflow-hidden"
        >
          <div
            className="flex items-center rounded-full border p-0.5"
            style={{ background: 'var(--color-surface-container-low)', borderColor: 'var(--color-outline-variant)' }}
          >
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-full transition-colors active:scale-90"
              style={{ color: 'var(--color-on-surface-variant)' }}
              aria-label="Previous month"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            </button>

            <div className="relative">
              <button
                ref={monthBtnRef}
                onClick={() => setPickerOpen(v => !v)}
                className="px-3 py-1 text-sm font-semibold rounded-full transition-colors whitespace-nowrap"
                style={{ color: 'var(--color-on-surface)' }}
              >
                {MONTH_NAMES[month]} {year}
              </button>
              <MonthPicker
                open={pickerOpen}
                anchorEl={monthBtnRef.current}
                onClose={() => setPickerOpen(false)}
              />
            </div>

            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-full transition-colors active:scale-90"
              style={{ color: 'var(--color-on-surface-variant)' }}
              aria-label="Next month"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-bold rounded-full border transition-colors active:scale-95"
            style={{
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
            }}
          >
            Today
          </button>
        </motion.div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-1 sm:gap-2 order-4 ml-auto lg:ml-0 lg:order-5">
          {/* Add Staff — admin only */}
          {isAdmin && (
            <button
              onClick={() => openDialog({ type: 'addStaff' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-colors active:scale-95"
              style={{
                background: 'var(--color-secondary-container)',
                color: 'var(--color-on-secondary-container)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
              <span className="hidden lg:inline">Add Staff</span>
            </button>
          )}

          {/* Export — always visible */}
          <button
            onClick={onExport}
            className="p-2 rounded-full transition-colors active:scale-95"
            style={{ color: 'var(--color-on-surface-variant)' }}
            title="Export CSV"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
          </button>

          {/* Admin Controls (badge + lock) — only when unlocked */}
          {isAdmin && <AdminControls />}
        </div>
      </div>
    </header>
  );
}
