/**
 * firestore.ts — All Firestore read/write operations.
 *
 * Collections:
 *   /staff/{staffId}               → StaffMember (name, role)
 *   /attendance/{date__staffId}    → AttendanceEntry (timeIn, timeOut)
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  onSnapshot,
  query,
  where,
  orderBy,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { StaffMember, AttendanceEntry } from './types';

// ── Collection refs ────────────────────────────────────────────
const staffCol  = () => collection(firestore, 'staff');
const attCol    = () => collection(firestore, 'attendance');

// ── Key helpers ────────────────────────────────────────────────
export function attDocId(date: string, staffId: string) {
  return `${date}__${staffId}`;
}

// ── Staff CRUD ─────────────────────────────────────────────────

export async function fsAddStaff(s: StaffMember): Promise<void> {
  await setDoc(doc(staffCol(), s.id), { name: s.name, role: s.role });
}

export async function fsUpdateStaff(s: StaffMember): Promise<void> {
  await updateDoc(doc(staffCol(), s.id), { name: s.name, role: s.role });
}

/**
 * Delete a staff member AND all their attendance records in one batch.
 */
export async function fsDeleteStaff(staffId: string): Promise<void> {
  const batch = writeBatch(firestore);

  // Delete staff doc
  batch.delete(doc(staffCol(), staffId));

  // Delete all attendance docs for this staff member
  const attSnap = await getDocs(
    query(attCol(), where('staffId', '==', staffId))
  );
  attSnap.forEach(d => batch.delete(d.ref));

  await batch.commit();
}

// ── Attendance CRUD ────────────────────────────────────────────

export async function fsSetEntry(
  date: string,
  staffId: string,
  entry: AttendanceEntry
): Promise<void> {
  const id = attDocId(date, staffId);
  await setDoc(doc(attCol(), id), {
    date,
    staffId,
    timeIn:  entry.timeIn  ?? '',
    timeOut: entry.timeOut ?? '',
  });
}

export async function fsClearEntry(date: string, staffId: string): Promise<void> {
  await deleteDoc(doc(attCol(), attDocId(date, staffId)));
}

// ── Real-time listeners ────────────────────────────────────────

/**
 * Subscribe to all staff documents.
 * Returns an unsubscribe function.
 */
export function onStaffSnapshot(
  cb: (staff: StaffMember[]) => void
): Unsubscribe {
  return onSnapshot(staffCol(), snap => {
    const staff: StaffMember[] = snap.docs.map(d => ({
      id:   d.id,
      name: d.data().name ?? '',
      role: d.data().role ?? '',
    }));
    cb(staff);
  });
}

/**
 * Subscribe to all attendance documents for a given year+month.
 * Returns an unsubscribe function.
 */
export function onAttendanceSnapshot(
  year: number,
  month: number,
  cb: (data: Record<string, AttendanceEntry>) => void
): Unsubscribe {
  // Date range for the month  e.g. "2026-06-01" .. "2026-06-30"
  const padded = String(month + 1).padStart(2, '0');
  const prefix = `${year}-${padded}`;

  const q = query(
    attCol(),
    where('date', '>=', `${prefix}-01`),
    where('date', '<=', `${prefix}-31`)
  );

  return onSnapshot(q, snap => {
    const data: Record<string, AttendanceEntry> = {};
    snap.docs.forEach(d => {
      const fd = d.data() as DocumentData;
      data[d.id] = { timeIn: fd.timeIn ?? '', timeOut: fd.timeOut ?? '' };
    });
    cb(data);
  });
}

// ── Bulk batch write (used by migration) ───────────────────────

export async function fsBatchWrite(
  staff: StaffMember[],
  attendance: Record<string, { date: string; staffId: string; timeIn: string; timeOut: string }>
): Promise<void> {
  const CHUNK = 490; // Firestore batch limit is 500
  const allOps: (() => void)[] = [];

  // Build ops list
  staff.forEach(s => {
    allOps.push(() => {
      const b = writeBatch(firestore);
      b.set(doc(staffCol(), s.id), { name: s.name, role: s.role });
      return b.commit();
    });
  });

  // Write staff in one batch
  if (staff.length > 0) {
    const sb = writeBatch(firestore);
    staff.forEach(s => sb.set(doc(staffCol(), s.id), { name: s.name, role: s.role }));
    await sb.commit();
  }

  // Write attendance in chunks
  const attEntries = Object.entries(attendance);
  for (let i = 0; i < attEntries.length; i += CHUNK) {
    const chunk = attEntries.slice(i, i + CHUNK);
    const b = writeBatch(firestore);
    chunk.forEach(([id, data]) => {
      b.set(doc(attCol(), id), data);
    });
    await b.commit();
  }
}
