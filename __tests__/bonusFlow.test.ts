import { resolveBonusAward } from '@/game/bonus';
import { resolveSpin } from '@/game/probabilities';
import { useAppStore, type AppState } from '@/store';
import {
  APP_STORE_STORAGE_KEY,
  readPersistedJsonForTests,
  resetPersistenceForTests,
  writePersistedJsonForTests,
} from '@/store/persistence';
import type { BonusSpin } from '@/store/types';

interface PersistedEnvelope {
  state: Partial<AppState>;
  version: number;
}

const findBonusSeed = (): string => {
  for (let index = 0; index < 100_000; index += 1) {
    const seed = `bonus-${index}`;
    const spin = resolveSpin({ activatedMaxTier: 3, seed });

    if (spin.rawLandedSlice === 'bonus') {
      return seed;
    }
  }

  throw new Error('Unable to find bonus seed.');
};

const findBonusAwardSeed = (award: BonusSpin['bonusAwardLanded']): string => {
  for (let index = 0; index < 100_000; index += 1) {
    const seed = `${award}-${index}`;
    const resolved = resolveBonusAward({ seed });

    if (resolved.bonusAwardLanded === award) {
      return seed;
    }
  }

  throw new Error(`Unable to find ${award} seed.`);
};

const createOnboardedHabit = () => {
  useAppStore.getState().acceptNakedRule('2026-04-23T13:00:00Z');

  return useAppStore.getState().createInitialOnboardingSetup({
    jarName: 'Fitness',
    jarColorHex: '#46D56E',
    habitName: '10 pushups',
    habitCue: 'Walking to the kitchen',
    rewardName: 'Clash Royale',
    rewardDurationMinutes: 3,
    createdAt: '2026-04-23T13:05:00Z',
  });
};

const createActiveBonusChain = () => {
  useAppStore.setState({
    bonusChains: [
      {
        id: 'bonus-chain-1',
        startedAt: '2026-04-23T13:20:00Z',
        spins: [],
        outcome: 'in_progress',
      },
    ],
    activeBonusChainId: 'bonus-chain-1',
    currentState: 'BONUS_ROUND',
  });
};

describe('bonus flow', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
  });

  it('starts and persists a bonus chain from a bonus wheel landing', () => {
    const { habit } = createOnboardedHabit();
    const completion = useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T13:10:00Z',
      tokenSeed: 'bonus-flow-token',
    });

    if (!completion) {
      throw new Error('Expected completion fixture.');
    }

    useAppStore.getState().prepareSpin({
      habitCompletionId: completion.id,
      activatedMaxTier: 3,
      seed: findBonusSeed(),
    });
    const result = useAppStore.getState().resolvePreparedSpin('spin-bonus-1');

    expect(result?.rawLandedSlice).toBe('bonus');
    expect(useAppStore.getState().currentState).toBe('BONUS_ROUND');
    expect(useAppStore.getState().bonusChains).toHaveLength(1);
    expect(useAppStore.getState().activeBonusChainId).toBeDefined();

    const persistedBeforeRestart = readPersistedJsonForTests<PersistedEnvelope>(
      APP_STORE_STORAGE_KEY,
    );
    useAppStore.getState().resetForTests();

    if (!persistedBeforeRestart) {
      throw new Error('Expected persisted bonus chain state before restart.');
    }

    writePersistedJsonForTests(APP_STORE_STORAGE_KEY, persistedBeforeRestart);
    useAppStore.getState().rehydrateFromStorageForTests();

    expect(useAppStore.getState().currentState).toBe('BONUS_ROUND');
    expect(useAppStore.getState().activeBonusChainId).toBeDefined();
    expect(useAppStore.getState().bonusChains[0]?.originatingSpinResultId).toBe(
      'spin-bonus-1',
    );
  });

  it('times out an active bonus timer deterministically after reload sync', () => {
    createActiveBonusChain();
    const bonusSpin = useAppStore.getState().startBonusSpin({
      seed: findBonusAwardSeed('discount_25'),
      startedAt: '2026-04-23T13:20:00Z',
      bonusSpinId: 'bonus-spin-1',
    });

    expect(bonusSpin?.id).toBe('bonus-spin-1');
    expect(useAppStore.getState().currentState).toBe('BONUS_TIMER_ACTIVE');

    const persistedBeforeRestart = readPersistedJsonForTests<PersistedEnvelope>(
      APP_STORE_STORAGE_KEY,
    );
    useAppStore.getState().resetForTests();

    if (!persistedBeforeRestart) {
      throw new Error('Expected persisted bonus timer state before restart.');
    }

    writePersistedJsonForTests(APP_STORE_STORAGE_KEY, persistedBeforeRestart);
    useAppStore.getState().rehydrateFromStorageForTests();
    useAppStore.getState().syncBonusChainState('2026-04-23T13:31:00Z');

    expect(useAppStore.getState().activeBonusChainId).toBeUndefined();
    expect(useAppStore.getState().currentState).toBe('IDLE');
    expect(useAppStore.getState().bonusChains[0]?.outcome).toBe('timed_out');
  });

  it('claims a bonus rep into an append-only reward grant and active session', () => {
    const { habit } = createOnboardedHabit();
    createActiveBonusChain();
    useAppStore.getState().startBonusSpin({
      seed: findBonusAwardSeed('discount_50'),
      startedAt: '2026-04-23T13:20:00Z',
      bonusSpinId: 'bonus-spin-claim',
    });

    const completion = useAppStore.getState().completeBonusTimer({
      habitId: habit.id,
      completedAt: '2026-04-23T13:21:00Z',
      tokenSeed: 'bonus-claim-token',
      completionId: 'bonus-completion-1',
      tokenId: 'bonus-token-1',
      rewardGrantId: 'bonus-grant-1',
    });

    expect(completion).toMatchObject({
      id: 'bonus-completion-1',
      wasBonusRep: true,
      bonusDiscountApplied: 50,
    });
    expect(useAppStore.getState().bonusChains[0]?.outcome).toBe('completed');
    expect(useAppStore.getState().rewardGrants).toContainEqual(
      expect.objectContaining({
        id: 'bonus-grant-1',
        source: 'bonus',
        bonusChainId: 'bonus-chain-1',
      }),
    );
    expect(useAppStore.getState().activeRewardSession?.rewardGrantId).toBe('bonus-grant-1');
    expect(useAppStore.getState().currentState).toBe('REWARD_ACTIVE');
  });

  it('grants a bonus golden token when the bonus award lands on free golden', () => {
    const { habit } = createOnboardedHabit();
    createActiveBonusChain();
    useAppStore.getState().startBonusSpin({
      seed: findBonusAwardSeed('free_golden'),
      startedAt: '2026-04-23T13:20:00Z',
      bonusSpinId: 'bonus-spin-gold',
    });

    useAppStore.getState().completeBonusTimer({
      habitId: habit.id,
      completedAt: '2026-04-23T13:21:00Z',
      tokenSeed: 'bonus-primary-token',
      completionId: 'bonus-gold-completion',
      tokenId: 'bonus-primary-token-id',
      bonusTokenId: 'bonus-gold-token-id',
      rewardGrantId: 'bonus-gold-grant',
    });

    expect(useAppStore.getState().tokens).toContainEqual(
      expect.objectContaining({
        id: 'bonus-gold-token-id',
        color: 'gold',
        sourceCompletionId: 'bonus-gold-completion',
      }),
    );
    expect(useAppStore.getState().bonusChains[0]?.spins[0]?.grantedTokenId).toBe(
      'bonus-gold-token-id',
    );
  });

  it('enforces max-chain behavior for repeated extra spins', () => {
    const { habit } = createOnboardedHabit();
    createActiveBonusChain();
    const extraSpinSeed = findBonusAwardSeed('extra_spin');

    for (let index = 0; index < 3; index += 1) {
      useAppStore.getState().startBonusSpin({
        seed: extraSpinSeed,
        startedAt: `2026-04-23T13:2${index}:00Z`,
        bonusSpinId: `bonus-spin-extra-${index}`,
      });
      useAppStore.getState().completeBonusTimer({
        habitId: habit.id,
        completedAt: `2026-04-23T13:2${index}:30Z`,
        tokenSeed: `bonus-extra-token-${index}`,
        completionId: `bonus-extra-completion-${index}`,
        tokenId: `bonus-extra-token-id-${index}`,
        rewardGrantId: `bonus-extra-grant-${index}`,
      });
    }

    expect(useAppStore.getState().activeBonusChainId).toBeUndefined();
    expect(useAppStore.getState().bonusChains[0]?.outcome).toBe('max_chain');
    expect(useAppStore.getState().bonusChains[0]?.spins).toHaveLength(3);
  });
});
