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
    const pendingSpin = useAppStore.getState().prepareSpin({
      habitCompletionId: 'completion-1',
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
});
