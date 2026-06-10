import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../ui/Avatar';
import type { StaffMember } from '../../lib/types';

export function StaffView() {
  const { openDialog, staff } = useStore();
  const { isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? staff.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.role.toLowerCase().includes(search.toLowerCase())
      )
    : staff;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pt-3">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[color:var(--color-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Manage Staff
          </h2>
          {isAdmin && (
            <button
              onClick={() => openDialog({ type: 'addStaff' })}
              className="flex items-center gap-2 px-4 py-2.5 bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] rounded-full text-sm font-bold shadow transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Staff
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-on-surface-variant)]" style={{ fontSize: 20 }}>
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role…"
            className="w-full pl-12 pr-4 h-12 bg-[color:var(--color-surface-container-low)] border border-[color:var(--color-outline-variant)] rounded-full text-sm text-[color:var(--color-on-surface)] placeholder-[color:var(--color-outline)] focus:outline-none focus:border-[color:var(--color-primary)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-on-surface)]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="bg-[color:var(--color-surface-container-low)] rounded-2xl border border-[color:var(--color-outline-variant)] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-[color:var(--color-on-surface-variant)]">
              <span className="material-symbols-outlined opacity-30" style={{ fontSize: 48 }}>
                {staff.length === 0 ? 'group_add' : 'person_search'}
              </span>
              <p className="text-sm">{staff.length === 0 ? 'No staff yet' : 'No results found'}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((s, idx) => (
                <StaffItem
                  key={s.id}
                  staff={s}
                  idx={staff.indexOf(s)}
                  isLast={idx === filtered.length - 1}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        <p className="text-xs text-[color:var(--color-on-surface-variant)] text-center">
          {staff.length} total staff member{staff.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

function StaffItem({ staff: s, idx, isLast }: { staff: StaffMember; idx: number; isLast: boolean }) {
  const { openDialog } = useStore();
  const { isAdmin } = useAuthStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: idx * 0.04 }}
      className={`flex items-center gap-4 px-4 py-3.5 ${!isLast ? 'border-b border-[color:var(--color-outline-variant)]' : ''} hover:bg-[color:var(--color-surface-container)] transition-colors group`}
    >
      <Avatar name={s.name} idx={idx} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[color:var(--color-on-surface)] truncate">{s.name}</p>
        <p className="text-xs text-[color:var(--color-on-surface-variant)] truncate">{s.role}</p>
      </div>
      {/* Actions — admin only, visible on hover */}
      {isAdmin && (
        <div className="flex gap-1 opacity-100 md:opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => openDialog({ type: 'editStaff', staffId: s.id })}
            className="p-2 rounded-full hover:bg-[color:var(--color-surface-container-highest)] text-[color:var(--color-on-surface-variant)] transition-colors active:scale-90"
            title="Edit"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
          </button>
          <button
            onClick={() => openDialog({ type: 'delete', staffId: s.id })}
            className="p-2 rounded-full hover:bg-[color:var(--color-error-container)] text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-error)] transition-colors active:scale-90"
            title="Delete"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
