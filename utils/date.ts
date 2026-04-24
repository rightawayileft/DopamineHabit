import { addMinutes, differenceInMilliseconds, formatISO } from 'date-fns';

import type { ISODate } from '@/store/types';

export const nowIso = (): ISODate => formatISO(new Date());

export const addMinutesToIso = (isoDate: ISODate, minutes: number): ISODate =>
  formatISO(addMinutes(new Date(isoDate), minutes));

export const differenceFromNowMs = (isoDate: ISODate, now: Date = new Date()): number =>
  differenceInMilliseconds(new Date(isoDate), now);

export const toLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};
