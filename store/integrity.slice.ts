import type { IntegrityCheckIn, IntegrityRuntime } from '@/store/types';
import { nowIso } from '@/utils/date';

export interface IntegritySlice {
  integrityCheckIns: IntegrityCheckIn[];
  integrityRuntime: IntegrityRuntime;
}

export const createInitialIntegritySlice = (): IntegritySlice => ({
  integrityCheckIns: [],
  integrityRuntime: {
    honestyStreak: 0,
    honestAdmissionCount: 0,
    lastSeenTimestamp: nowIso(),
    clockTamperDetected: false,
    warnings: [],
  },
});
