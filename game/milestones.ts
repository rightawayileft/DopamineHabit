import type { Jar, Milestone } from '@/store/types';

export interface MilestoneUnlock {
  milestoneId: string;
  unlockedMilestone: Milestone;
}

export const detectMilestoneUnlocks = (
  jar: Jar,
  previousEarnedCount: number,
  nextEarnedCount: number,
  unlockedAt: string,
): MilestoneUnlock[] =>
  jar.milestones
    .filter(
      (milestone) =>
        !milestone.unlockedAt &&
        milestone.tokenThreshold > previousEarnedCount &&
        milestone.tokenThreshold <= nextEarnedCount,
    )
    .map((milestone) => ({
      milestoneId: milestone.id,
      unlockedMilestone: {
        ...milestone,
        unlockedAt,
      },
    }));
