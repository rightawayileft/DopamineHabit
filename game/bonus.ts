import { hashSeedToUint32, mulberry32 } from '@/game/probabilities';
import type { BonusSpin } from '@/store/types';
import { createUuid } from '@/utils/uuid';

export interface BonusAwardInputs {
  seed?: string;
}

export interface ResolvedBonusAward {
  seed: string;
  bonusAwardLanded: BonusSpin['bonusAwardLanded'];
}

export const bonusDiscountPercent = (
  award: BonusSpin['bonusAwardLanded'],
): number | undefined => {
  if (award === 'discount_75') {
    return 75;
  }

  if (award === 'discount_50') {
    return 50;
  }

  if (award === 'discount_25') {
    return 25;
  }

  return undefined;
};

export const bonusAwardLabel = (award: BonusSpin['bonusAwardLanded']): string => {
  if (award === 'discount_75') return '75% discount';
  if (award === 'discount_50') return '50% discount';
  if (award === 'discount_25') return '25% discount';
  if (award === 'free_token') return 'Free token';
  if (award === 'free_golden') return 'Free golden token';
  return 'Extra spin';
};

export const resolveBonusAward = ({ seed }: BonusAwardInputs = {}): ResolvedBonusAward => {
  const actualSeed = seed ?? createUuid();
  const roll = mulberry32(hashSeedToUint32(actualSeed))();

  let bonusAwardLanded: BonusSpin['bonusAwardLanded'];
  if (roll < 0.26) bonusAwardLanded = 'discount_25';
  else if (roll < 0.48) bonusAwardLanded = 'discount_50';
  else if (roll < 0.64) bonusAwardLanded = 'discount_75';
  else if (roll < 0.82) bonusAwardLanded = 'free_token';
  else if (roll < 0.92) bonusAwardLanded = 'extra_spin';
  else bonusAwardLanded = 'free_golden';

  return {
    seed: actualSeed,
    bonusAwardLanded,
  };
};
