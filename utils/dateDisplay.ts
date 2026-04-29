import type { ISODate } from '@/store/types';

export const formatLocalDateTime = (timestamp: ISODate | undefined): string => {
  if (!timestamp) {
    return 'Not recorded';
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
};
