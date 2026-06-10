// Staff member data model
export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

// A single in/out time block
export interface TimeBlock {
  in: string;
  out: string;
}

// Per-day attendance for one staff member
export interface AttendanceEntry {
  timeIn: string;  // legacy HH:MM 24h, or ''
  timeOut: string; // legacy HH:MM 24h, or ''
  blocks?: TimeBlock[]; // multiple timings
}

// Derived cell status (never stored)
export type CellStatus = 'empty' | 'present' | 'inprogress' | 'error';

// App views
export type ViewType = 'grid' | 'staff' | 'summary';

// Dialog discriminated union
export type DialogState =
  | { type: 'time'; staffId: string; date: string }
  | { type: 'addStaff' }
  | { type: 'editStaff'; staffId: string }
  | { type: 'delete'; staffId: string }
  | null;

// Toast notification
export interface ToastItem {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
  icon?: string;
}
