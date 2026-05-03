import type { ActiveRewardSession, HabitCompletion, IntegrityCheckIn, Token } from '@/store/types';
import { toLocalDateKey } from '@/utils/date';

export interface ReturnBrief {
  shouldShow: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  primaryRoute: '/' | '/checkin' | '/rewards' | '/spin';
  daysAway: number;
}

export interface BuildReturnBriefInput {
  activeRewardSession: ActiveRewardSession | undefined;
  completions: HabitCompletion[];
  integrityCheckIns: IntegrityCheckIn[];
  inventoryTokens: Token[];
  lastSeenTimestamp: string;
  now?: Date;
}

const daysBetween = (from: Date, to: Date): number => {
  const fromDateKey = toLocalDateKey(from);
  const toDateKey = toLocalDateKey(to);
  const fromMidnight = new Date(`${fromDateKey}T00:00:00`).getTime();
  const toMidnight = new Date(`${toDateKey}T00:00:00`).getTime();

  return Math.max(0, Math.floor((toMidnight - fromMidnight) / 86_400_000));
};

export const buildReturnBrief = ({
  activeRewardSession,
  completions,
  integrityCheckIns,
  inventoryTokens,
  lastSeenTimestamp,
  now = new Date(),
}: BuildReturnBriefInput): ReturnBrief => {
  const lastSeen = new Date(lastSeenTimestamp);
  const daysAway = Number.isNaN(lastSeen.getTime()) ? 0 : daysBetween(lastSeen, now);
  const todayKey = toLocalDateKey(now);
  const checkedInToday = integrityCheckIns.some((checkIn) => checkIn.date === todayKey);

  if (daysAway < 2) {
    return {
      shouldShow: false,
      title: 'Loop ready',
      message: 'Your next step is waiting.',
      primaryLabel: 'Go home',
      primaryRoute: '/',
      daysAway,
    };
  }

  if (activeRewardSession) {
    return {
      shouldShow: true,
      title: `Welcome back after ${daysAway} days`,
      message: 'A reward session needs closure before the next spin.',
      primaryLabel: 'Close reward',
      primaryRoute: '/rewards',
      daysAway,
    };
  }

  if (!checkedInToday) {
    return {
      shouldShow: true,
      title: `Welcome back after ${daysAway} days`,
      message: 'No need to reconstruct the whole gap. Answer today and restart clean.',
      primaryLabel: 'Check in today',
      primaryRoute: '/checkin',
      daysAway,
    };
  }

  if (inventoryTokens.length > 0) {
    return {
      shouldShow: true,
      title: `Welcome back after ${daysAway} days`,
      message: `${inventoryTokens.length} saved token${
        inventoryTokens.length === 1 ? '' : 's'
      } can become a spin when you are ready.`,
      primaryLabel: 'Open spin',
      primaryRoute: '/spin',
      daysAway,
    };
  }

  return {
    shouldShow: true,
    title: `Welcome back after ${daysAway} days`,
    message:
      completions.length > 0
        ? 'Restart with one tiny rep. The app will pick up from there.'
        : 'Start with one tiny rep. You do not need a perfect plan.',
    primaryLabel: 'Log one rep',
    primaryRoute: '/',
    daysAway,
  };
};
