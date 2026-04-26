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
  if (awardedTier === 'bonus') {
    return {
      reward: undefined,
      strategy: 'none_available',
    };
  }

  const exactTierRewards = rewards.filter((reward) => reward.tier === awardedTier);
  if (exactTierRewards.length > 0) {
    return {
      reward: exactTierRewards[0],
      strategy: 'exact_tier',
    };
  }

  if (rewards.length === 0) {
    return {
      reward: undefined,
      strategy: 'none_available',
    };
  }

  const sortedByTier = rewards
    .slice()
    .sort((left, right) => tierWeight(left.tier) - tierWeight(right.tier));

  return {
    reward: sortedByTier[0],
    strategy: 'fallback_lowest_tier',
  };
};
