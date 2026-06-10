import { create } from 'zustand';
import type { ViewType, DialogState, ToastItem, StaffMember, AttendanceEntry } from '../lib/types';
import { TODAY } from '../lib/utils';

interface Store {
  // ── Navigation ──────────────────────────────────────────────
  view: ViewType;
  year: number;
  month: number;
  monthDir: number; // 1 = forward, -1 = back, 0 = jump

  // ── Reactive Firestore data ──────────────────────────────────
  /** All staff members, kept in sync by onSnapshot listener */
  staff: StaffMember[];
  /** Attendance entries for the current month, keyed by "date__staffId" */
  attendance: Record<string, AttendanceEntry>;
  /** True while the first staff snapshot is loading */
  loadingStaff: boolean;
  /** True while the first attendance snapshot for the current month is loading */
  loadingAttendance: boolean;

  // ── Dialogs ──────────────────────────────────────────────────
  dialog: DialogState;

  // ── Toast queue ──────────────────────────────────────────────
  toasts: ToastItem[];

  // ── Actions ─────────────────────────────────────────────────
  setView(v: ViewType): void;
  changeMonth(dir: 1 | -1): void;
  goToToday(): void;
  openDialog(d: NonNullable<DialogState>): void;
  closeDialog(): void;
  addToast(message: string, variant?: ToastItem['variant'], icon?: string): void;
  removeToast(id: string): void;

  // Called by Firestore listeners (in FirestoreProvider)
  setStaff(staff: StaffMember[]): void;
  setAttendance(data: Record<string, AttendanceEntry>): void;
  setLoadingStaff(v: boolean): void;
  setLoadingAttendance(v: boolean): void;
}

export const useStore = create<Store>((set, get) => ({
  // Navigation
  view: 'grid',
  year: TODAY.getFullYear(),
  month: TODAY.getMonth(),
  monthDir: 1,

  // Reactive data (populated by FirestoreProvider)
  staff: [],
  attendance: {},
  loadingStaff: true,
  loadingAttendance: true,

  dialog: null,
  toasts: [],

  // ── Navigation actions ────────────────────────────────────
  setView(v) { set({ view: v }); },

  changeMonth(dir) {
    const { year, month } = get();
    let y = year, m = month + dir;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    set({ year: y, month: m, monthDir: dir });
  },

  goToToday() {
    set({ year: TODAY.getFullYear(), month: TODAY.getMonth(), monthDir: 0 });
  },

  // ── Dialog actions ────────────────────────────────────────
  openDialog(d)  { set({ dialog: d }); },
  closeDialog()  { set({ dialog: null }); },

  // ── Toast actions ─────────────────────────────────────────
  addToast(message, variant = 'success', icon) {
    const id = `t_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, message, variant, icon }] }));
    setTimeout(() => get().removeToast(id), 3200);
  },
  removeToast(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },

  // ── Firestore data setters ────────────────────────────────
  setStaff(staff)            { set({ staff, loadingStaff: false }); },
  setAttendance(attendance)  { set({ attendance, loadingAttendance: false }); },
  setLoadingStaff(v)         { set({ loadingStaff: v }); },
  setLoadingAttendance(v)    { set({ loadingAttendance: v }); },
}));
