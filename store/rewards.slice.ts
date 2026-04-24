import type { Reward, RewardGrant } from '@/store/types';

export interface RewardsSlice {
  rewards: Reward[];
  rewardGrants: RewardGrant[];
}

export const createInitialRewardsSlice = (): RewardsSlice => ({
  rewards: [],
  rewardGrants: [],
});
