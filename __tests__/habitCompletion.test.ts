import { useAppStore } from '@/store';
import { resetPersistenceForTests } from '@/store/persistence';

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

describe('habit completion flow', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
  });

  it('logs a completion, draws one inventory token, and links them together', () => {
    const { habit, jar } = createOnboardedHabit();

    const completion = useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T13:10:00Z',
      tokenSeed: 'first-rep-token',
    });

    const state = useAppStore.getState();
    const token = state.tokens.find((candidate) => candidate.id === completion?.tokenDrawnId);

    expect(completion).toBeDefined();
    expect(state.currentState).toBe('INVENTORY_OPEN');
    expect(state.completions).toHaveLength(1);
    expect(state.tokens).toHaveLength(1);
    expect(token?.state).toBe('in_inventory');
    expect(token?.jarId).toBe(jar.id);
    expect(token?.sourceCompletionId).toBe(completion?.id);
    expect(state.lastCompletionFeedback?.status).toBe('completed');
    expect(state.lastCompletionFeedback?.tokenId).toBe(token?.id);
  });

  it('prevents repeat completions inside the habit rate limit', () => {
    const { habit } = createOnboardedHabit();

    const firstCompletion = useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T13:10:00Z',
      tokenSeed: 'first-rep-token',
    });
    const secondCompletion = useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T13:10:20Z',
      tokenSeed: 'second-rep-token',
    });

    const state = useAppStore.getState();

    expect(firstCompletion).toBeDefined();
    expect(secondCompletion).toBeUndefined();
    expect(state.completions).toHaveLength(1);
    expect(state.tokens).toHaveLength(1);
    expect(state.lastCompletionFeedback).toMatchObject({
      status: 'rate_limited',
      habitId: habit.id,
      secondsRemaining: 10,
    });
  });

  it('allows another completion after the configured rate limit window', () => {
    const { habit } = createOnboardedHabit();

    useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T13:10:00Z',
      tokenSeed: 'first-rep-token',
    });
    const secondCompletion = useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T13:10:30Z',
      tokenSeed: 'second-rep-token',
    });

    const state = useAppStore.getState();

    expect(secondCompletion).toBeDefined();
    expect(state.completions).toHaveLength(2);
    expect(state.tokens).toHaveLength(2);
  });
});
