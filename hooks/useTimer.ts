import { useEffect, useState } from 'react';

import { differenceFromNowMs } from '@/utils/date';

export const useTimer = (expiresAt: string | undefined): number => {
  const [remainingMs, setRemainingMs] = useState(() =>
    expiresAt ? Math.max(differenceFromNowMs(expiresAt), 0) : 0,
  );

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      return undefined;
    }

    const intervalId = setInterval(() => {
      setRemainingMs(Math.max(differenceFromNowMs(expiresAt), 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  return remainingMs;
};
