import type { BonusChain } from '@/store/types';

export interface BonusSlice {
  bonusChains: BonusChain[];
  activeBonusChainId: string | undefined;
}

export const createInitialBonusSlice = (): BonusSlice => ({
  bonusChains: [],
  activeBonusChainId: undefined,
});
