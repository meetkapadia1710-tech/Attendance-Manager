/**
 * migrateLs.ts — One-time migration from localStorage to Firestore.
 *
 * Runs once on first load. If localStorage has existing staff data
 * AND Firestore staff collection is empty, migrates everything.
 *
 * Marks completion in localStorage so it never runs again.
 */

import { getDocs, collection } from 'firebase/firestore';
import { firestore } from './firebase';
import { fsBatchWrite } from './firestore';
import type { StaffMember, AttendanceEntry } from './types';

const LS_MIGRATED_KEY = 'mbs_migrated_to_firebase';
const LS_STAFF_KEY    = 'mbs_staff';
const LS_ATT_KEY      = 'mbs_attendance';

function parseLs<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function migrateLocalStorageToFirestore(): Promise<{
  migrated: boolean;
  staffCount: number;
  attCount: number;
}> {
  // Already migrated
  if (localStorage.getItem(LS_MIGRATED_KEY) === 'true') {
    return { migrated: false, staffCount: 0, attCount: 0 };
  }

  const lsStaff = parseLs<StaffMember[]>(LS_STAFF_KEY, []);
  if (lsStaff.length === 0) {
    // Nothing to migrate
    localStorage.setItem(LS_MIGRATED_KEY, 'true');
    return { migrated: false, staffCount: 0, attCount: 0 };
  }

  // Check if Firestore already has data
  const fsSnap = await getDocs(collection(firestore, 'staff'));
  if (!fsSnap.empty) {
    // Firestore already has staff — skip migration to avoid overwriting
    localStorage.setItem(LS_MIGRATED_KEY, 'true');
    return { migrated: false, staffCount: 0, attCount: 0 };
  }

  // Build attendance map with required fields for Firestore queries
  const lsAtt = parseLs<Record<string, AttendanceEntry>>(LS_ATT_KEY, {});
  const fsAtt: Record<string, { date: string; staffId: string; timeIn: string; timeOut: string }> = {};

  for (const [key, entry] of Object.entries(lsAtt)) {
    const parts = key.split('__');
    if (parts.length < 2) continue;
    const date    = parts[0];
    const staffId = parts.slice(1).join('__'); // in case staffId contains __
    fsAtt[key] = {
      date,
      staffId,
      timeIn:  entry.timeIn  ?? '',
      timeOut: entry.timeOut ?? '',
    };
  }

  // Write everything
  await fsBatchWrite(lsStaff, fsAtt);

  // Mark done
  localStorage.setItem(LS_MIGRATED_KEY, 'true');

  console.info(
    `[Migration] ✅ Migrated ${lsStaff.length} staff and ${Object.keys(fsAtt).length} attendance records to Firestore.`
  );

  return {
    migrated:  true,
    staffCount: lsStaff.length,
    attCount:  Object.keys(fsAtt).length,
  };
}
