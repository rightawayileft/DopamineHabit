import { useAppStore } from '@/store';
import { resetPersistenceForTests } from '@/store/persistence';

describe('onboarding setup', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
  });

  it('stores the Naked Rule acceptance timestamp', () => {
    useAppStore.getState().acceptNakedRule('2026-04-23T13:00:00Z');

    expect(useAppStore.getState().settings.nakedRuleAcceptedAt).toBe(
      '2026-04-23T13:00:00Z',
    );
  });

  it('creates a linked first jar, habit, and Tier 1 reward', () => {
    const { jar, habit, reward } = useAppStore.getState().createInitialOnboardingSetup({
      jarName: 'Fitness',
      jarColorHex: '#46D56E',
      habitName: '10 pushups',
      habitCue: 'Walking to the kitchen',
      rewardName: 'Clash Royale',
      rewardDurationMinutes: 3,
      rewardDescription: 'A contained game session.',
      createdAt: '2026-04-23T13:05:00Z',
    });

    const state = useAppStore.getState();

    expect(state.jars).toHaveLength(1);
    expect(state.habits).toHaveLength(1);
    expect(state.rewards).toHaveLength(1);
    expect(habit.jarId).toBe(jar.id);
    expect(reward.tier).toBe(1);
    expect(reward.durationMinutes).toBe(3);
    expect(reward.description).toBe('A contained game session.');
  });

  it('updates the integrity check-in time', () => {
    useAppStore.getState().updateSettings({ integrityCheckInTime: '20:30' });

    expect(useAppStore.getState().settings.integrityCheckInTime).toBe('20:30');
  });
});
