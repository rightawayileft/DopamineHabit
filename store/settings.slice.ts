import type { UserSettings } from '@/store/types';

export interface SettingsSlice {
  settings: UserSettings;
}

export const createInitialSettingsSlice = (): SettingsSlice => ({
  settings: {
    integrityCheckInTime: '21:00',
    hapticsEnabled: true,
    soundEnabled: true,
    reducedMotion: false,
    nakedRuleAcceptedAt: '',
    rateLimitSecondsPerHabit: {},
  },
});
