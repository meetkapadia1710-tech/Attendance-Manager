import type { CellStatus, AttendanceEntry, TimeBlock } from './types';

// ── Constants ──────────────────────────────────────────────────
export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
export const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const DAY_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const ROLES = [
  'Senior Stylist','Stylist','Junior Stylist','Colorist',
  'Beautician','Receptionist','Apprentice','Salon Manager',
];

export const AVATAR_PALETTES = [
  { bg: '#ffd8ee', text: '#4a1235' },
  { bg: '#ffd9e1', text: '#4a2030' },
  { bg: '#ffdad4', text: '#4a1a14' },
  { bg: '#d4e8cc', text: '#1a5c2a' },
  { bg: '#cce4f0', text: '#1a3a5c' },
  { bg: '#e8d4f0', text: '#3a1a5c' },
];

export const TODAY = (() => {
  const d = new Date(); d.setHours(0,0,0,0); return d;
})();

// ── String helpers ─────────────────────────────────────────────
export function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').substring(0, 2).toUpperCase();
}

export function avatarPalette(idx: number) {
  return AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
}

export function genId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

// ── Date helpers ───────────────────────────────────────────────
export function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

export function isToday(y: number, m: number, d: number): boolean {
  return TODAY.getFullYear() === y && TODAY.getMonth() === m && TODAY.getDate() === d;
}

// ── Time math ──────────────────────────────────────────────────
export function timeToMins(t: string): number | null {
  if (!t) return null;
  const [h, min] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(min)) return null;
  return h * 60 + min;
}

/** Returns minutes (>0), -1 for error (out ≤ in), null if incomplete */
export function calcMins(timeIn: string, timeOut: string): number | null | -1 {
  const a = timeToMins(timeIn), b = timeToMins(timeOut);
  if (a === null || b === null) return null;
  if (b <= a) return -1;
  return b - a;
}

export function minsToHrStr(mins: number | null | undefined): string {
  if (mins === null || mins === undefined || mins < 0) return '—';
  const h = mins / 60;
  if (h % 1 === 0) return `${h.toFixed(0)}h`;
  if ((h * 2) % 1 === 0) return `${h.toFixed(1)}h`;
  return `${h.toFixed(2)}h`;
}

export function fmt12(t: string): string {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Block helpers ──────────────────────────────────────────────
export function normalizeBlocks(entry: AttendanceEntry | null | undefined): TimeBlock[] {
  if (!entry) return [];
  if (entry.blocks && entry.blocks.length > 0) return entry.blocks;
  if (entry.timeIn || entry.timeOut) {
    return [{ in: entry.timeIn || '', out: entry.timeOut || '' }];
  }
  return [];
}

export function calcTotalMins(entry: AttendanceEntry | null): number | null {
  const blocks = normalizeBlocks(entry);
  if (blocks.length === 0) return null;
  
  let total = 0;
  let hasValid = false;

  for (const b of blocks) {
    if (b.in && b.out) {
      const m = calcMins(b.in, b.out);
      if (m !== -1 && m !== null) {
        total += m;
        hasValid = true;
      }
    }
  }
  
  return hasValid ? total : null;
}

// ── Cell status ────────────────────────────────────────────────
export function getCellStatus(entry: AttendanceEntry | null): CellStatus {
  const blocks = normalizeBlocks(entry);
  if (blocks.length === 0) return 'empty';
  
  let hasError = false;
  let isInprogress = false;
  
  for (const b of blocks) {
    if (b.in && !b.out) {
      isInprogress = true;
    } else if (b.in && b.out) {
      if (calcMins(b.in, b.out) === -1) hasError = true;
    }
  }
  
  if (hasError) return 'error';
  if (isInprogress) return 'inprogress';
  return 'present';
}

// ── CSV export ─────────────────────────────────────────────────
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
