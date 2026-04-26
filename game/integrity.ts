import { differenceInSeconds } from 'date-fns';

import type { IntegrityCheckIn, IntegrityRuntime, ISODate } from '@/store/types';

export interface ClockTamperResult {
  clockTamperDetected: boolean;
  driftSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  secondsRemaining: number;
}

export interface IntegrityDisplayInputs {
  todayKey: string;
  yesterdayKey: string;
  todayCheckIn: IntegrityCheckIn | undefined;
  latestCheckIn: IntegrityCheckIn | undefined;
  missedYesterday: boolean;
  warningMessages: string[];
}

export const detectClockTamper = (
  lastSeenTimestamp: ISODate,
  nowTimestamp: ISODate,
  thresholdMinutes = 5,
): ClockTamperResult => {
  const driftSeconds = differenceInSeconds(new Date(nowTimestamp), new Date(lastSeenTimestamp));
  const allowedBackwardDriftSeconds = thresholdMinutes * 60;

  return {
    clockTamperDetected: driftSeconds < -allowedBackwardDriftSeconds,
    driftSeconds,
  };
};

export const evaluateRateLimit = (
  lastCompletionAt: ISODate | undefined,
  nextAttemptAt: ISODate,
  rateLimitSeconds: number,
): RateLimitResult => {
  if (!lastCompletionAt) {
    return {
      allowed: true,
      secondsRemaining: 0,
    };
  }

  const elapsedSeconds = differenceInSeconds(new Date(nextAttemptAt), new Date(lastCompletionAt));
  const secondsRemaining = Math.max(rateLimitSeconds - elapsedSeconds, 0);

  return {
    allowed: secondsRemaining === 0,
    secondsRemaining,
  };
};

export const findCheckInForDate = (
  checkIns: IntegrityCheckIn[],
  dateKey: string,
): IntegrityCheckIn | undefined =>
  checkIns
    .slice()
    .reverse()
    .find((checkIn) => checkIn.date === dateKey);

export const latestIntegrityCheckIn = (
  checkIns: IntegrityCheckIn[],
): IntegrityCheckIn | undefined =>
  checkIns
    .slice()
    .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))[0];

export const buildIntegrityDisplayInputs = ({
  checkIns,
  runtime,
  todayKey,
  yesterdayKey,
}: {
  checkIns: IntegrityCheckIn[];
  runtime: IntegrityRuntime;
  todayKey: string;
  yesterdayKey: string;
}): IntegrityDisplayInputs => {
  const todayCheckIn = findCheckInForDate(checkIns, todayKey);
  const latestCheckIn = latestIntegrityCheckIn(checkIns);
  const hasCheckInBeforeYesterday = checkIns.some((checkIn) => checkIn.date < yesterdayKey);
  const missedYesterday =
    checkIns.length > 0 &&
    !findCheckInForDate(checkIns, yesterdayKey) &&
    hasCheckInBeforeYesterday;

  const warningMessages = [
    ...runtime.warnings,
    ...(runtime.clockTamperDetected ? ['Backward clock drift detected.'] : []),
    ...(missedYesterday ? [`No integrity check-in recorded for ${yesterdayKey}.`] : []),
  ];

  return {
    todayKey,
    yesterdayKey,
    todayCheckIn,
    latestCheckIn,
    missedYesterday,
    warningMessages: Array.from(new Set(warningMessages)),
  };
};
