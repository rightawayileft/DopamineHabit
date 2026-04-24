import { differenceInSeconds } from 'date-fns';

import type { ISODate } from '@/store/types';

export interface ClockTamperResult {
  clockTamperDetected: boolean;
  driftSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  secondsRemaining: number;
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
