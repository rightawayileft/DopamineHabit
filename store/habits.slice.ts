import type { Habit, HabitCompletion } from '@/store/types';

export interface HabitsSlice {
  habits: Habit[];
  completions: HabitCompletion[];
}

export const createInitialHabitsSlice = (): HabitsSlice => ({
  habits: [],
  completions: [],
});
