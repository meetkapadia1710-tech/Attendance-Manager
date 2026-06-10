/**
 * FirestoreProvider.tsx
 *
 * Manages Firestore real-time subscriptions and writes reactive data
 * into the Zustand store. Automatically resubscribes to the attendance
 * collection when the user navigates to a different month.
 *
 * Also runs the one-time localStorage migration on first mount.
 */

import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { onStaffSnapshot, onAttendanceSnapshot } from '../../lib/firestore';
import { migrateLocalStorageToFirestore } from '../../lib/migrateLs';

export function FirestoreProvider({ children }: { children: React.ReactNode }) {
  const {
    year, month,
    setStaff, setAttendance,
    setLoadingStaff, setLoadingAttendance,
    addToast,
  } = useStore();

  // ── One-time migration on first mount ──────────────────────
  const migrated = useRef(false);
  useEffect(() => {
    if (migrated.current) return;
    migrated.current = true;
    migrateLocalStorageToFirestore()
      .then(({ migrated, staffCount, attCount }) => {
        if (migrated) {
          addToast(
            `Migrated ${staffCount} staff & ${attCount} entries to Firebase`,
            'success',
            'cloud_done'
          );
        }
      })
      .catch(err => {
        console.error('[Migration] Failed:', err);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Staff listener (starts once, never resubscribes) ───────
  useEffect(() => {
    setLoadingStaff(true);
    const unsub = onStaffSnapshot(staff => {
      setStaff(staff);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Attendance listener (resubscribes on month change) ──────
  useEffect(() => {
    setLoadingAttendance(true);
    const unsub = onAttendanceSnapshot(year, month, data => {
      setAttendance(data);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  return <>{children}</>;
}
