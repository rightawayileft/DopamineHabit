import type { Jar } from '@/store/types';

export interface JarsSlice {
  jars: Jar[];
}

export const createInitialJarsSlice = (): JarsSlice => ({
  jars: [],
});
