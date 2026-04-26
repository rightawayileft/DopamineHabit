import type { Jar, Milestone, Token, UUID } from '@/store/types';

export interface MilestoneUnlock {
  milestoneId: string;
  unlockedMilestone: Milestone;
}

export interface JarProgress {
  earnedTokenCount: number;
  inventoryTokenCount: number;
  unlockedMilestoneCount: number;
  totalMilestoneCount: number;
  nextMilestone: Milestone | undefined;
  tokensUntilNextMilestone: number | undefined;
}

export const earnedTokenCountForJar = (tokens: Token[], jarId: UUID): number =>
  tokens.filter((token) => token.jarId === jarId).length;

export const inventoryTokenCountForJar = (tokens: Token[], jarId: UUID): number =>
  tokens.filter((token) => token.jarId === jarId && token.state === 'in_inventory').length;

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

export const buildJarProgress = (jar: Jar, tokens: Token[]): JarProgress => {
  const earnedTokenCount = earnedTokenCountForJar(tokens, jar.id);
  const inventoryTokenCount = inventoryTokenCountForJar(tokens, jar.id);
  const nextMilestone = jar.milestones
    .filter((milestone) => !milestone.unlockedAt)
    .slice()
    .sort((left, right) => left.tokenThreshold - right.tokenThreshold)[0];

  return {
    earnedTokenCount,
    inventoryTokenCount,
    unlockedMilestoneCount: jar.milestones.filter((milestone) => milestone.unlockedAt).length,
    totalMilestoneCount: jar.milestones.length,
    nextMilestone,
    tokensUntilNextMilestone: nextMilestone
      ? Math.max(nextMilestone.tokenThreshold - earnedTokenCount, 0)
      : undefined,
  };
};
