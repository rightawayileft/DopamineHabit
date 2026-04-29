import { useAppStore, type AppState } from '@/store';
import {
  APP_STORE_STORAGE_KEY,
  readPersistedJsonForTests,
  resetPersistenceForTests,
  writePersistedJsonForTests,
} from '@/store/persistence';

interface PersistedEnvelope {
  state: Partial<AppState>;
  version: number;
}

describe('app state machine', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows the main legal transition path', () => {
    const store = useAppStore.getState();

    expect(store.transitionTo('LOGGING_REP')).toBe(true);
    expect(useAppStore.getState().transitionTo('INVENTORY_OPEN')).toBe(true);
    expect(useAppStore.getState().transitionTo('READY_TO_SPIN')).toBe(true);
    expect(useAppStore.getState().transitionTo('SPINNING')).toBe(true);
    expect(useAppStore.getState().transitionTo('RESOLVING')).toBe(true);
    expect(useAppStore.getState().transitionTo('REWARD_GRANTED')).toBe(true);
    expect(useAppStore.getState().transitionTo('REWARD_ACTIVE')).toBe(true);
    expect(useAppStore.getState().transitionTo('IDLE')).toBe(true);
  });

  it('allows the bonus legal transition path', () => {
    useAppStore.setState({ currentState: 'RESOLVING' });

    expect(useAppStore.getState().transitionTo('BONUS_ROUND')).toBe(true);
    expect(useAppStore.getState().transitionTo('BONUS_AWARDING_TIER')).toBe(true);
    expect(useAppStore.getState().transitionTo('BONUS_SPINNING')).toBe(true);
    expect(useAppStore.getState().transitionTo('BONUS_TIMER_ACTIVE')).toBe(true);
    expect(useAppStore.getState().transitionTo('IDLE')).toBe(true);
  });

  it('ignores illegal transitions without changing state', () => {
    const illegalTransitions = [
      'SPINNING',
      'RESOLVING',
      'REWARD_GRANTED',
      'REWARD_ACTIVE',
      'BONUS_TIMER_ACTIVE',
    ] as const;

    for (const nextState of illegalTransitions) {
      useAppStore.getState().resetForTests();
      expect(useAppStore.getState().transitionTo(nextState)).toBe(false);
      expect(useAppStore.getState().currentState).toBe('IDLE');
    }
  });

  it('persists RESOLVING state through simulated restart', () => {
    useAppStore.getState().acceptNakedRule('2026-04-23T11:45:00Z');
    const { habit } = useAppStore.getState().createInitialOnboardingSetup({
      jarName: 'Fitness',
      jarColorHex: '#46D56E',
      habitName: '10 pushups',
      habitCue: 'Walking to the kitchen',
      rewardName: 'Clash Royale',
      rewardDurationMinutes: 3,
      createdAt: '2026-04-23T11:50:00Z',
    });
    const completion = useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T11:55:00Z',
      tokenSeed: 'restart-token-seed',
    });

    if (!completion) {
      throw new Error('Expected completion fixture.');
    }

    const pendingSpin = useAppStore.getState().prepareSpin({
      habitCompletionId: completion.id,
      activatedMaxTier: 1,
      seed: 'restart-seed',
      startedAt: '2026-04-23T12:00:00Z',
    });

    expect(pendingSpin?.resolvedSpin.seed).toBe('restart-seed');

    const persistedBeforeRestart = readPersistedJsonForTests<PersistedEnvelope>(
      APP_STORE_STORAGE_KEY,
    );
    expect(persistedBeforeRestart?.state.currentState).toBe('RESOLVING');

    useAppStore.getState().resetForTests();
    expect(useAppStore.getState().currentState).toBe('IDLE');

    if (!persistedBeforeRestart) {
      throw new Error('Expected persisted state before restart.');
    }
    writePersistedJsonForTests(APP_STORE_STORAGE_KEY, persistedBeforeRestart);
    useAppStore.getState().rehydrateFromStorageForTests();

    expect(useAppStore.getState().currentState).toBe('RESOLVING');
    expect(useAppStore.getState().pendingSpin?.resolvedSpin.seed).toBe('restart-seed');
  });

  it('persists active reward timer state through simulated restart', () => {
    useAppStore.setState({
      rewards: [
        {
          id: 'reward-1',
          name: 'Phone game',
          tier: 1,
          durationMinutes: 10,
        },
      ],
      rewardGrants: [
        {
          id: 'grant-1',
          rewardId: 'reward-1',
          grantedAt: '2026-04-23T12:00:00Z',
          source: 'spin',
          durationMinutes: 10,
        },
      ],
    });
    useAppStore.getState().setActiveRewardSession({
      rewardGrantId: 'grant-1',
      expiresAt: '2026-04-23T12:10:00Z',
    });
    const persistedBeforeRestart = readPersistedJsonForTests<PersistedEnvelope>(
      APP_STORE_STORAGE_KEY,
    );

    useAppStore.getState().resetForTests();
    if (!persistedBeforeRestart) {
      throw new Error('Expected persisted reward timer state before restart.');
    }
    writePersistedJsonForTests(APP_STORE_STORAGE_KEY, persistedBeforeRestart);
    useAppStore.getState().rehydrateFromStorageForTests();

    expect(useAppStore.getState().currentState).toBe('REWARD_ACTIVE');
    expect(useAppStore.getState().activeRewardSession?.expiresAt).toBe(
      '2026-04-23T12:10:00Z',
    );
  });

  it('deterministically ends expired reward sessions after reload sync', () => {
    useAppStore.setState({
      rewards: [
        {
          id: 'reward-1',
          name: 'Phone game',
          tier: 1,
          durationMinutes: 10,
        },
      ],
      rewardGrants: [
        {
          id: 'grant-1',
          rewardId: 'reward-1',
          grantedAt: '2026-04-23T12:00:00Z',
          source: 'spin',
          spinResultId: 'spin-1',
          durationMinutes: 10,
        },
      ],
      activeRewardSession: {
        rewardGrantId: 'grant-1',
        expiresAt: '2026-04-23T12:10:00Z',
      },
      currentState: 'REWARD_ACTIVE',
    });

    const persistedBeforeRestart = readPersistedJsonForTests<PersistedEnvelope>(
      APP_STORE_STORAGE_KEY,
    );
    useAppStore.getState().resetForTests();

    if (!persistedBeforeRestart) {
      throw new Error('Expected persisted reward timer state before restart.');
    }

    writePersistedJsonForTests(APP_STORE_STORAGE_KEY, persistedBeforeRestart);
    useAppStore.getState().rehydrateFromStorageForTests();
    useAppStore.getState().syncRewardSessionState('2026-04-23T12:10:01Z');

    expect(useAppStore.getState().activeRewardSession).toBeUndefined();
    expect(useAppStore.getState().currentState).toBe('IDLE');
    expect(useAppStore.getState().rewardGrants[0]?.endedAt).toBe('2026-04-23T12:10:01Z');
    expect(useAppStore.getState().rewardGrants[0]?.closedAt).toBe('2026-04-23T12:10:01Z');
    expect(useAppStore.getState().rewardGrants[0]?.outcome).toBe('expired');
  });

  it('expires reward sessions using actual time instead of ISO string order', () => {
    useAppStore.setState({
      rewards: [
        {
          id: 'reward-1',
          name: 'Phone game',
          tier: 1,
          durationMinutes: 10,
        },
      ],
      rewardGrants: [
        {
          id: 'grant-1',
          rewardId: 'reward-1',
          grantedAt: '2026-04-23T12:00:00Z',
          source: 'spin',
          durationMinutes: 10,
        },
      ],
      activeRewardSession: {
        rewardGrantId: 'grant-1',
        expiresAt: '2026-04-23T12:10:00Z',
      },
      currentState: 'REWARD_ACTIVE',
    });

    useAppStore.getState().syncRewardSessionState('2026-04-23T08:11:00-04:00');

    expect(useAppStore.getState().activeRewardSession).toBeUndefined();
    expect(useAppStore.getState().rewardGrants[0]).toMatchObject({
      outcome: 'expired',
      closedAt: '2026-04-23T08:11:00-04:00',
    });
  });

  it('clears orphan active reward sessions during sync', () => {
    useAppStore.setState({
      activeRewardSession: {
        rewardGrantId: 'missing-grant',
        expiresAt: '2026-04-23T12:10:00Z',
      },
      currentState: 'REWARD_ACTIVE',
      rewardGrants: [],
      rewards: [],
    });

    useAppStore.getState().syncRewardSessionState('2026-04-23T12:00:00Z');

    expect(useAppStore.getState().activeRewardSession).toBeUndefined();
    expect(useAppStore.getState().currentState).toBe('IDLE');
  });

  it('distinguishes completed, stopped, and slipped reward boundaries', () => {
    useAppStore.setState({
      rewardGrants: [
        {
          id: 'grant-complete',
          rewardId: 'reward-1',
          grantedAt: '2026-04-23T12:00:00Z',
          source: 'spin',
          durationMinutes: 10,
        },
        {
          id: 'grant-stop',
          rewardId: 'reward-1',
          grantedAt: '2026-04-23T13:00:00Z',
          source: 'spin',
          durationMinutes: 10,
        },
        {
          id: 'grant-slip',
          rewardId: 'reward-1',
          grantedAt: '2026-04-23T14:00:00Z',
          source: 'spin',
          durationMinutes: 10,
        },
      ],
    });

    useAppStore.getState().setActiveRewardSession({
      rewardGrantId: 'grant-complete',
      expiresAt: '2026-04-23T12:10:00Z',
    });
    useAppStore.getState().endActiveRewardSession('2026-04-23T12:05:00Z');

    useAppStore.getState().setActiveRewardSession({
      rewardGrantId: 'grant-stop',
      expiresAt: '2026-04-23T13:10:00Z',
    });
    useAppStore.getState().endRewardSessionEarly('2026-04-23T13:05:00Z');

    useAppStore.getState().setActiveRewardSession({
      rewardGrantId: 'grant-slip',
      expiresAt: '2026-04-23T14:10:00Z',
    });
    useAppStore.getState().recordRewardBoundarySlip('2026-04-23T14:05:00Z');

    expect(useAppStore.getState().rewardGrants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'grant-complete',
          outcome: 'completed',
          closedAt: '2026-04-23T12:05:00Z',
          endedAt: '2026-04-23T12:05:00Z',
        }),
        expect.objectContaining({
          id: 'grant-stop',
          outcome: 'stopped',
          closedAt: '2026-04-23T13:05:00Z',
          endedEarlyAt: '2026-04-23T13:05:00Z',
        }),
        expect.objectContaining({
          id: 'grant-slip',
          outcome: 'slipped',
          closedAt: '2026-04-23T14:05:00Z',
          endedEarlyAt: '2026-04-23T14:05:00Z',
        }),
      ]),
    );
    expect(useAppStore.getState().activeRewardSession).toBeUndefined();
  });
});
