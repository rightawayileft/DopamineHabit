import { useAppStore } from '@/store';

export const useIntegrityStreak = (): number =>
  useAppStore((state) => state.integrityRuntime.honestyStreak);
