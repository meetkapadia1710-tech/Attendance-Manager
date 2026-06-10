import type { StaffMember, AttendanceEntry } from './types';

const STAFF_KEY = 'mbs_staff';
const ATT_KEY = 'mbs_attendance';

function parse<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const db = {
  // ── Staff ──────────────────────────────────────────
  getStaff(): StaffMember[] {
    return parse<StaffMember[]>(STAFF_KEY, []);
  },
  saveStaff(arr: StaffMember[]): void {
    localStorage.setItem(STAFF_KEY, JSON.stringify(arr));
  },

  // ── Attendance ─────────────────────────────────────
  getAll(): Record<string, AttendanceEntry> {
    return parse<Record<string, AttendanceEntry>>(ATT_KEY, {});
  },
  saveAll(obj: Record<string, AttendanceEntry>): void {
    localStorage.setItem(ATT_KEY, JSON.stringify(obj));
  },

  attKey(date: string, staffId: string): string {
    return `${date}__${staffId}`;
  },

  getEntry(date: string, staffId: string): AttendanceEntry | null {
    return this.getAll()[this.attKey(date, staffId)] ?? null;
  },

  setEntry(date: string, staffId: string, entry: AttendanceEntry): void {
    const all = this.getAll();
    all[this.attKey(date, staffId)] = entry;
    this.saveAll(all);
  },

  clearEntry(date: string, staffId: string): void {
    const all = this.getAll();
    delete all[this.attKey(date, staffId)];
    this.saveAll(all);
  },

  removeStaffEntries(staffId: string): void {
    const all = this.getAll();
    const suffix = `__${staffId}`;
    for (const k of Object.keys(all)) {
      if (k.endsWith(suffix)) delete all[k];
    }
    this.saveAll(all);
  },

  // ── Seed demo data on first run ───────────────────
  seedIfEmpty(): void {
    if (this.getStaff().length > 0) return;
    const demo: StaffMember[] = [
      { id: 's_demo_1', name: 'Sarah Jenkins',   role: 'Senior Stylist' },
      { id: 's_demo_2', name: 'Michael Kim',     role: 'Colorist' },
      { id: 's_demo_3', name: 'Elena Rodriguez', role: 'Beautician' },
      { id: 's_demo_4', name: 'David Ross',      role: 'Receptionist' },
    ];
    this.saveStaff(demo);

    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const today = now.getDate();
    const shifts = [
      ['08:45','17:15'], ['09:00','18:00'], ['09:15','17:45'],
      ['10:00','19:00'], ['08:30','16:30'], ['08:50','18:05'],
    ];
    for (let d = 1; d < today; d++) {
      const date = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dow = new Date(y, m, d).getDay();
      if (dow === 0) continue; // skip Sunday
      demo.forEach((s, idx) => {
        if (Math.random() < 0.85) {
          const [ti, to] = shifts[(d + idx) % shifts.length];
          this.setEntry(date, s.id, { timeIn: ti, timeOut: to });
        }
      });
    }
    // Today: only time-in for first 3
    const todayStr = `${y}-${String(m+1).padStart(2,'0')}-${String(today).padStart(2,'0')}`;
    demo.slice(0, 3).forEach((s, i) => {
      this.setEntry(todayStr, s.id, { timeIn: shifts[i][0], timeOut: '' });
    });
  },
};
