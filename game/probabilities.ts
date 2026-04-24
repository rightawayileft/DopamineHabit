import { createUuid } from '@/utils/uuid';

export interface SpinInputs {
  activatedMaxTier: 1 | 2 | 3;
  seed?: string;
}

export interface ResolvedSpin {
  seed: string;
  rawLandedSlice: 'tier1' | 'tier2' | 'tier3' | 'jackpot' | 'bonus';
  awardedTier: 1 | 2 | 3 | 'jackpot' | 'bonus';
  wasNearMiss: boolean;
}

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

export const hashSeedToUint32 = (seed: string): number => {
  let hash = FNV_OFFSET;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
};

export const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

export const seededRandom01 = (seed: string): number => mulberry32(hashSeedToUint32(seed))();

export function resolveSpin({ activatedMaxTier, seed }: SpinInputs): ResolvedSpin {
  const actualSeed = seed ?? createUuid();
  const roll = seededRandom01(actualSeed);

  let rawLandedSlice: ResolvedSpin['rawLandedSlice'];
  if (roll < 0.4) rawLandedSlice = 'tier1';
  else if (roll < 0.7) rawLandedSlice = 'tier2';
  else if (roll < 0.9) rawLandedSlice = 'tier3';
  else if (roll < 0.92) rawLandedSlice = 'jackpot';
  else rawLandedSlice = 'bonus';

  let awardedTier: ResolvedSpin['awardedTier'];
  let wasNearMiss = false;

  if (rawLandedSlice === 'tier2' && activatedMaxTier < 2) {
    awardedTier = 1;
    wasNearMiss = true;
  } else if (rawLandedSlice === 'tier3' && activatedMaxTier < 3) {
    awardedTier = 1;
    wasNearMiss = true;
  } else if (rawLandedSlice === 'tier1') {
    awardedTier = 1;
  } else if (rawLandedSlice === 'tier2') {
    awardedTier = 2;
  } else if (rawLandedSlice === 'tier3') {
    awardedTier = 3;
  } else {
    awardedTier = rawLandedSlice;
  }

  return {
    seed: actualSeed,
    rawLandedSlice,
    awardedTier,
    wasNearMiss,
  };
}
