import type { PendingSpinContext, SpinResult } from '@/store/types';

export interface SpinsSlice {
  spinResults: SpinResult[];
  pendingSpin: PendingSpinContext | undefined;
}

export const createInitialSpinsSlice = (): SpinsSlice => ({
  spinResults: [],
  pendingSpin: undefined,
});
