import { resolveSpin, type ResolvedSpin } from '@/game/probabilities';

const SPIN_COUNT = 100_000;
const CHI_SQUARED_CRITICAL_DF4_P05 = 9.488;

const expectedSpinRatios: Record<ResolvedSpin['rawLandedSlice'], number> = {
  tier1: 0.4,
  tier2: 0.3,
  tier3: 0.2,
  jackpot: 0.02,
  bonus: 0.08,
};

const findSeedForSlice = (slice: ResolvedSpin['rawLandedSlice']): string => {
  for (let index = 0; index < 100_000; index += 1) {
    const seed = `slice-${slice}-${index}`;
    if (resolveSpin({ activatedMaxTier: 3, seed }).rawLandedSlice === slice) {
      return seed;
    }
  }

  throw new Error(`Unable to find seed for slice ${slice}`);
};

const expectedAwardFor = (
  rawSlice: 'tier1' | 'tier2' | 'tier3',
  activatedMaxTier: 1 | 2 | 3,
): 1 | 2 | 3 => {
  if (rawSlice === 'tier1') {
    return 1;
  }

  if (rawSlice === 'tier2') {
    return activatedMaxTier >= 2 ? 2 : 1;
  }

  return activatedMaxTier >= 3 ? 3 : 1;
};

describe('resolveSpin', () => {
  it('matches the fixed 40/30/20/2/8 distribution', () => {
    const observed: Record<ResolvedSpin['rawLandedSlice'], number> = {
      tier1: 0,
      tier2: 0,
      tier3: 0,
      jackpot: 0,
      bonus: 0,
    };

    for (let index = 0; index < SPIN_COUNT; index += 1) {
      const result = resolveSpin({ activatedMaxTier: 3, seed: `spin-${index}` });
      observed[result.rawLandedSlice] += 1;
    }

    const chiSquared = Object.entries(observed).reduce((total, [slice, count]) => {
      const expected = expectedSpinRatios[slice as ResolvedSpin['rawLandedSlice']] * SPIN_COUNT;
      return total + (count - expected) ** 2 / expected;
    }, 0);

    expect(chiSquared).toBeLessThan(CHI_SQUARED_CRITICAL_DF4_P05);
  });

  it('marks near-misses only for locked Tier 2 and Tier 3 landings', () => {
    const slices = ['tier1', 'tier2', 'tier3'] as const;

    for (const rawSlice of slices) {
      const seed = findSeedForSlice(rawSlice);

      for (const activatedMaxTier of [1, 2, 3] as const) {
        const result = resolveSpin({ activatedMaxTier, seed });
        const shouldBeNearMiss =
          (rawSlice === 'tier2' && activatedMaxTier < 2) ||
          (rawSlice === 'tier3' && activatedMaxTier < 3);

        expect(result.rawLandedSlice).toBe(rawSlice);
        expect(result.wasNearMiss).toBe(shouldBeNearMiss);
        expect(result.awardedTier).toBe(expectedAwardFor(rawSlice, activatedMaxTier));
      }
    }
  });

  it('never converts jackpot or bonus outcomes into near-misses', () => {
    for (const rawSlice of ['jackpot', 'bonus'] as const) {
      const seed = findSeedForSlice(rawSlice);

      for (const activatedMaxTier of [1, 2, 3] as const) {
        const result = resolveSpin({ activatedMaxTier, seed });
        expect(result.rawLandedSlice).toBe(rawSlice);
        expect(result.wasNearMiss).toBe(false);
        expect(result.awardedTier).toBe(rawSlice);
      }
    }
  });
});
