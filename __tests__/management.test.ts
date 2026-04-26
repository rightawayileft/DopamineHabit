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

const createFirstLoop = () => {
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

describe('management flows', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
  });

  it('creates, edits, archives, and restores habits without deleting completion history', () => {
    const { jar } = createFirstLoop();
    const habit = useAppStore.getState().createHabit({
      id: 'habit-managed',
      name: 'Walk outside',
      cue: 'After lunch',
      jarId: jar.id,
      createdAt: '2026-04-23T14:00:00Z',
    });

    expect(habit?.id).toBe('habit-managed');

    const completion = useAppStore.getState().logHabitCompletion({
      habitId: 'habit-managed',
      completedAt: '2026-04-23T14:05:00Z',
      tokenSeed: 'managed-habit-token',
    });

    expect(completion).toBeDefined();

    const updatedHabit = useAppStore.getState().updateHabit({
      id: 'habit-managed',
      name: 'Walk outside twice',
      cue: '',
    });

    expect(updatedHabit).toMatchObject({
      id: 'habit-managed',
      name: 'Walk outside twice',
    });
    expect(updatedHabit?.cue).toBeUndefined();

    useAppStore.getState().archiveHabit('habit-managed', '2026-04-23T14:10:00Z');
    const blockedCompletion = useAppStore.getState().logHabitCompletion({
      habitId: 'habit-managed',
      completedAt: '2026-04-23T14:11:00Z',
      tokenSeed: 'archived-habit-token',
    });

    expect(blockedCompletion).toBeUndefined();
    expect(useAppStore.getState().completions).toHaveLength(1);
    expect(useAppStore.getState().habits.find((item) => item.id === 'habit-managed')?.archivedAt).toBe(
      '2026-04-23T14:10:00Z',
    );

    useAppStore.getState().restoreHabit('habit-managed');

    expect(
      useAppStore.getState().habits.find((item) => item.id === 'habit-managed')?.archivedAt,
    ).toBeUndefined();
    expect(useAppStore.getState().completions[0]?.habitId).toBe('habit-managed');
  });

  it('updates and archives jars without changing historical token references', () => {
    const { habit, jar } = createFirstLoop();
    const completion = useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T13:10:00Z',
      tokenSeed: 'jar-reference-token',
    });

    expect(completion).toBeDefined();

    useAppStore.getState().updateJar({
      id: jar.id,
      name: 'Health',
      colorHex: '#3D9BFF',
      funMoneyPerTokenCents: 75,
    });
    useAppStore.getState().archiveJar(jar.id, '2026-04-23T13:12:00Z');

    const state = useAppStore.getState();
    const token = state.tokens.find((candidate) => candidate.id === completion?.tokenDrawnId);

    expect(state.jars[0]).toMatchObject({
      id: jar.id,
      name: 'Health',
      colorHex: '#3D9BFF',
      archivedAt: '2026-04-23T13:12:00Z',
    });
    expect(token?.jarId).toBe(jar.id);

    const blockedCompletion = useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T13:20:00Z',
      tokenSeed: 'archived-jar-token',
    });

    expect(blockedCompletion).toBeUndefined();
    expect(useAppStore.getState().completions).toHaveLength(1);
  });

  it('creates, edits, archives, restores, and persists rewards', () => {
    createFirstLoop();
    const reward = useAppStore.getState().createReward({
      id: 'reward-managed',
      name: 'Read comics',
      tier: 2,
      durationMinutes: 8,
      description: 'On the couch',
    });

    expect(reward?.id).toBe('reward-managed');

    useAppStore.getState().updateReward({
      id: 'reward-managed',
      name: 'Read one comic',
      tier: 3,
      durationMinutes: 10,
      description: '',
    });
    useAppStore.getState().archiveReward('reward-managed', '2026-04-23T15:00:00Z');

    const persistedBeforeRestart = readPersistedJsonForTests<PersistedEnvelope>(
      APP_STORE_STORAGE_KEY,
    );
    useAppStore.getState().resetForTests();

    if (!persistedBeforeRestart) {
      throw new Error('Expected persisted management state before restart.');
    }

    writePersistedJsonForTests(APP_STORE_STORAGE_KEY, persistedBeforeRestart);
    useAppStore.getState().rehydrateFromStorageForTests();

    const persistedReward = useAppStore
      .getState()
      .rewards.find((candidate) => candidate.id === 'reward-managed');

    expect(persistedReward).toMatchObject({
      id: 'reward-managed',
      name: 'Read one comic',
      tier: 3,
      durationMinutes: 10,
      archivedAt: '2026-04-23T15:00:00Z',
    });
    expect(persistedReward?.description).toBeUndefined();

    useAppStore.getState().restoreReward('reward-managed');

    expect(
      useAppStore.getState().rewards.find((candidate) => candidate.id === 'reward-managed')
        ?.archivedAt,
    ).toBeUndefined();
  });
});
