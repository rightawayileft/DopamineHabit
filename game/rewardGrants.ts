import type { Reward, SpinResult } from '@/store/types';

export interface RewardSelectionResult {
  reward: Reward | undefined;
  strategy: 'exact_tier' | 'fallback_lowest_tier' | 'none_available';
}

const tierWeight = (tier: Reward['tier']): number => {
  if (tier === 'jackpot') {
    return 4;
  }

  return tier;
};

export const selectRewardForSpinResult = (
  rewards: Reward[],
  awardedTier: SpinResult['awardedTier'],
): RewardSelectionResult => {
  const availableRewards = rewards.filter((reward) => !reward.archivedAt);

  if (awardedTier === 'bonus') {
    return {
      reward: undefined,
      strategy: 'none_available',
    };
  }

  const exactTierRewards = availableRewards.filter((reward) => reward.tier === awardedTier);
  if (exactTierRewards.length > 0) {
    return {
      reward: exactTierRewards[0],
      strategy: 'exact_tier',
    };
  }

  if (availableRewards.length === 0) {
    return {
      reward: undefined,
      strategy: 'none_available',
    };
  }

  const sortedByTier = availableRewards
    .slice()
    .sort((left, right) => tierWeight(left.tier) - tierWeight(right.tier));

  return {
    reward: sortedByTier[0],
    strategy: 'fallback_lowest_tier',
  };
};
