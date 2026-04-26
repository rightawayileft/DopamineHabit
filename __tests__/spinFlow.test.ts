import { resolveSpin } from '@/game/probabilities';
import { useAppStore } from '@/store';
import { resetPersistenceForTests } from '@/store/persistence';
import type { Token } from '@/store/types';

const findNearMissSeed = (): string => {
  for (let index = 0; index < 100_000; index += 1) {
    const seed = `near-miss-${index}`;
    const spin = resolveSpin({ activatedMaxTier: 1, seed });

    if (spin.rawLandedSlice === 'tier2' && spin.wasNearMiss) {
      return seed;
    }
  }

  throw new Error('Unable to find near-miss seed.');
};

const findTierTwoAwardSeed = (): string => {
  for (let index = 0; index < 100_000; index += 1) {
    const seed = `tier-two-${index}`;
    const spin = resolveSpin({ activatedMaxTier: 2, seed });

    if (spin.awardedTier === 2) {
      return seed;
    }
  }

  throw new Error('Unable to find tier-two seed.');
};

const createReadyCompletion = () => {
  useAppStore.getState().acceptNakedRule('2026-04-23T13:00:00Z');
  const { habit } = useAppStore.getState().createInitialOnboardingSetup({
    jarName: 'Fitness',
    jarColorHex: '#46D56E',
    habitName: '10 pushups',
    habitCue: 'Walking to the kitchen',
    rewardName: 'Clash Royale',
    rewardDurationMinutes: 3,
    createdAt: '2026-04-23T13:05:00Z',
  });

  const completion = useAppStore.getState().logHabitCompletion({
    habitId: habit.id,
    completedAt: '2026-04-23T13:10:00Z',
    tokenSeed: 'spin-token',
  });

  if (!completion) {
    throw new Error('Expected completion fixture.');
  }

  return { habit, completion };
};

describe('spin flow', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
  });

  it('persists a near-miss spin result and falls through to Tier 1', () => {
    const { completion } = createReadyCompletion();
    const seed = findNearMissSeed();

    const pendingSpin = useAppStore.getState().prepareSpin({
      habitCompletionId: completion.id,
      activatedMaxTier: 1,
      seed,
    });
    const result = useAppStore.getState().resolvePreparedSpin('spin-result-1');

    expect(pendingSpin?.resolvedSpin.wasNearMiss).toBe(true);
    expect(result).toMatchObject({
      id: 'spin-result-1',
      habitCompletionId: completion.id,
      rawLandedSlice: 'tier2',
      awardedTier: 1,
      wasNearMiss: true,
      seed,
    });
    expect(result?.awardedRewardId).toBeDefined();
    expect(useAppStore.getState().spinResults).toHaveLength(1);
    expect(useAppStore.getState().rewardGrants).toHaveLength(1);
    expect(useAppStore.getState().activeRewardSession).toBeDefined();
    expect(useAppStore.getState().currentState).toBe('REWARD_ACTIVE');
  });

  it('marks cashed-in tokens when preparing a spin', () => {
    const { completion, habit } = createReadyCompletion();
    const cashInTokens: Token[] = [
      {
        id: 'blue-1',
        color: 'blue',
        earnedAt: '2026-04-23T13:11:00Z',
        state: 'in_inventory',
        jarId: habit.jarId,
      },
      {
        id: 'blue-2',
        color: 'blue',
        earnedAt: '2026-04-23T13:12:00Z',
        state: 'in_inventory',
        jarId: habit.jarId,
      },
    ];

    useAppStore.setState((state) => ({
      tokens: [...state.tokens, ...cashInTokens],
    }));

    useAppStore.getState().prepareSpin({
      habitCompletionId: completion.id,
      activatedMaxTier: 2,
      cashedInTokenIds: ['blue-1', 'blue-2'],
      seed: 'tier-two-spin',
    });

    const cashedInTokens = useAppStore
      .getState()
      .tokens.filter((token) => token.id === 'blue-1' || token.id === 'blue-2');

    expect(cashedInTokens).toHaveLength(2);
    expect(cashedInTokens.every((token) => token.state === 'cashed_in')).toBe(true);
  });

  it('falls back to the lowest-tier reward when no matching tier reward exists', () => {
    const { completion } = createReadyCompletion();
    const seed = findTierTwoAwardSeed();
    useAppStore.setState((state) => ({
      rewards: state.rewards.map((reward) =>
        reward.tier === 1
          ? reward
          : {
              ...reward,
              tier: 3,
            },
      ),
    }));

    useAppStore.getState().prepareSpin({
      habitCompletionId: completion.id,
      activatedMaxTier: 2,
      seed,
    });
    const result = useAppStore.getState().resolvePreparedSpin('spin-result-fallback');

    expect(result?.awardedTier).toBe(2);
    expect(result?.awardedRewardId).toBe(useAppStore.getState().rewards[0]?.id);
    expect(useAppStore.getState().integrityRuntime.warnings).toContainEqual(
      expect.stringContaining('No reward configured for 2'),
    );
  });
});
