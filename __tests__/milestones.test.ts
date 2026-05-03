import { buildJarLedgers } from '@/game/jarLedgers';
import { buildJarProgress, detectMilestoneUnlocks } from '@/game/milestones';
import { useAppStore } from '@/store';
import { resetPersistenceForTests } from '@/store/persistence';
import type { Jar, Token } from '@/store/types';

const baseJar: Jar = {
  id: 'jar-1',
  name: 'Fitness',
  colorHex: '#46D56E',
  milestones: [
    {
      id: 'milestone-1',
      tokenThreshold: 10,
      label: 'First line',
    },
  ],
  funMoneyEnabled: false,
  funMoneyPerTokenCents: 50,
  funMoneyBalanceCents: 0,
  createdAt: '2026-04-23T12:00:00Z',
};

describe('detectMilestoneUnlocks', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
  });

  it('unlocks exactly once when a threshold is crossed', () => {
    const [unlock] = detectMilestoneUnlocks(
      baseJar,
      9,
      10,
      '2026-04-23T12:10:00Z',
    );

    expect(unlock?.milestoneId).toBe('milestone-1');
    expect(unlock?.unlockedMilestone.unlockedAt).toBe('2026-04-23T12:10:00Z');

    const firstMilestone = baseJar.milestones[0];
    if (!firstMilestone) {
      throw new Error('Expected fixture milestone.');
    }

    const jarAfterUnlock: Jar = {
      ...baseJar,
      milestones: [unlock?.unlockedMilestone ?? firstMilestone],
    };

    expect(
      detectMilestoneUnlocks(jarAfterUnlock, 10, 11, '2026-04-23T12:11:00Z'),
    ).toHaveLength(0);
  });

  it('does not unlock before the threshold is crossed', () => {
    expect(detectMilestoneUnlocks(baseJar, 8, 9, '2026-04-23T12:10:00Z')).toHaveLength(0);
  });

  it('summarizes jar progress using all earned tokens even after cash-in', () => {
    const tokens: Token[] = [
      {
        id: 'token-1',
        color: 'blue',
        earnedAt: '2026-04-23T12:00:00Z',
        state: 'cashed_in',
        jarId: 'jar-1',
      },
      {
        id: 'token-2',
        color: 'green',
        earnedAt: '2026-04-23T12:01:00Z',
        state: 'in_inventory',
        jarId: 'jar-1',
      },
    ];

    expect(buildJarProgress(baseJar, tokens)).toMatchObject({
      earnedTokenCount: 2,
      inventoryTokenCount: 1,
      tokensUntilNextMilestone: 8,
    });
  });

  it('builds milestone and fun-money ledgers from jar token history', () => {
    const jar: Jar = {
      ...baseJar,
      funMoneyEnabled: true,
      funMoneyPerTokenCents: 75,
      funMoneyBalanceCents: 150,
      milestones: [
        {
          id: 'milestone-unlocked',
          tokenThreshold: 1,
          label: 'First token',
          unlockedAt: '2026-04-23T12:01:00Z',
        },
        {
          id: 'milestone-pending',
          tokenThreshold: 3,
          label: 'Third token',
        },
      ],
    };
    const tokens: Token[] = [
      {
        id: 'token-1',
        color: 'blue',
        earnedAt: '2026-04-23T12:00:00Z',
        state: 'cashed_in',
        jarId: 'jar-1',
      },
      {
        id: 'token-2',
        color: 'green',
        earnedAt: '2026-04-23T12:02:00Z',
        state: 'in_inventory',
        jarId: 'jar-1',
      },
    ];

    expect(buildJarLedgers(jar, tokens)).toMatchObject({
      earnedTokenCount: 2,
      funMoneyBalanceCents: 150,
      funMoneyPerTokenCents: 75,
      totalFunMoneyEntryCount: 2,
      milestoneLedger: [
        expect.objectContaining({
          id: 'milestone-unlocked',
          status: 'unlocked',
          tokensRemaining: 0,
        }),
        expect.objectContaining({
          id: 'milestone-pending',
          status: 'pending',
          tokensRemaining: 1,
        }),
      ],
      recentFunMoneyEntries: [
        expect.objectContaining({
          id: 'token-2',
          amountCents: 75,
        }),
        expect.objectContaining({
          id: 'token-1',
          amountCents: 75,
        }),
      ],
    });
  });

  it('updates fun money and milestone unlocks when a normal token is earned', () => {
    const jar = useAppStore.getState().createJar({
      id: 'jar-managed',
      name: 'Fitness',
      colorHex: '#46D56E',
      funMoneyEnabled: true,
      funMoneyPerTokenCents: 75,
      createdAt: '2026-04-23T12:00:00Z',
    });

    if (!jar) {
      throw new Error('Expected jar fixture.');
    }

    useAppStore.getState().addJarMilestone({
      id: 'milestone-first',
      jarId: jar.id,
      tokenThreshold: 1,
      label: 'First rep',
    });
    const habit = useAppStore.getState().createHabit({
      id: 'habit-managed',
      name: 'Pushups',
      jarId: jar.id,
      createdAt: '2026-04-23T12:01:00Z',
    });

    if (!habit) {
      throw new Error('Expected habit fixture.');
    }

    useAppStore.getState().logHabitCompletion({
      habitId: habit.id,
      completedAt: '2026-04-23T12:02:00Z',
      tokenSeed: 'milestone-token',
    });

    const updatedJar = useAppStore.getState().jars.find((candidate) => candidate.id === jar.id);

    expect(updatedJar?.funMoneyBalanceCents).toBe(75);
    expect(
      updatedJar?.milestones.find((milestone) => milestone.id === 'milestone-first')?.unlockedAt,
    ).toBe('2026-04-23T12:02:00Z');
    expect(useAppStore.getState().lastCompletionFeedback).toMatchObject({
      milestoneUnlockLabels: expect.arrayContaining(['First rep']),
      funMoneyAwardedCents: 75,
    });
  });

  it('unlocks custom milestones immediately when threshold is already reached', () => {
    const jar = useAppStore.getState().createJar({
      id: 'retro-jar',
      name: 'Retro jar',
      colorHex: '#46D56E',
      createdAt: '2026-04-23T12:00:00Z',
    });

    if (!jar) {
      throw new Error('Expected retro jar fixture.');
    }

    useAppStore.setState((state) => ({
      tokens: [
        ...state.tokens,
        {
          id: 'retro-token',
          color: 'blue',
          earnedAt: '2026-04-23T12:01:00Z',
          state: 'in_inventory',
          jarId: jar.id,
        },
      ],
    }));

    const milestone = useAppStore.getState().addJarMilestone({
      id: 'retro-milestone',
      jarId: jar.id,
      tokenThreshold: 1,
      label: 'Already there',
    });

    expect(milestone?.unlockedAt).toBeDefined();
    expect(
      useAppStore
        .getState()
        .jars.find((candidate) => candidate.id === jar.id)
        ?.milestones.find((candidate) => candidate.id === 'retro-milestone')?.unlockedAt,
    ).toBeDefined();
  });

  it('counts bonus-awarded tokens toward progress and fun money', () => {
    const jar = useAppStore.getState().createJar({
      id: 'bonus-jar',
      name: 'Bonus jar',
      colorHex: '#3D9BFF',
      funMoneyEnabled: true,
      funMoneyPerTokenCents: 100,
      createdAt: '2026-04-23T12:00:00Z',
    });

    if (!jar) {
      throw new Error('Expected bonus jar fixture.');
    }

    useAppStore.getState().addJarMilestone({
      id: 'bonus-milestone-two',
      jarId: jar.id,
      tokenThreshold: 2,
      label: 'Two-token burst',
    });
    const habit = useAppStore.getState().createHabit({
      id: 'bonus-habit',
      name: 'Bonus rep',
      jarId: jar.id,
      createdAt: '2026-04-23T12:01:00Z',
    });

    if (!habit) {
      throw new Error('Expected bonus habit fixture.');
    }

    useAppStore.setState({
      bonusChains: [
        {
          id: 'bonus-chain',
          startedAt: '2026-04-23T12:05:00Z',
          outcome: 'in_progress',
          spins: [
            {
              id: 'bonus-spin',
              seed: 'bonus-seed',
              bonusAwardLanded: 'free_token',
              timerStartedAt: '2026-04-23T12:05:00Z',
              timerExpiresAt: '2026-04-23T12:15:00Z',
            },
          ],
        },
      ],
      activeBonusChainId: 'bonus-chain',
      currentState: 'BONUS_TIMER_ACTIVE',
    });

    useAppStore.getState().completeBonusTimer({
      habitId: habit.id,
      completedAt: '2026-04-23T12:06:00Z',
      tokenSeed: 'bonus-primary-token',
      bonusTokenSeed: 'bonus-extra-token',
      tokenId: 'bonus-primary-token-id',
      bonusTokenId: 'bonus-extra-token-id',
      completionId: 'bonus-completion',
      rewardGrantId: 'bonus-grant',
    });

    const updatedJar = useAppStore
      .getState()
      .jars.find((candidate) => candidate.id === jar.id);

    expect(updatedJar?.funMoneyBalanceCents).toBe(200);
    expect(
      updatedJar?.milestones.find((milestone) => milestone.id === 'bonus-milestone-two')
        ?.unlockedAt,
    ).toBe('2026-04-23T12:06:00Z');
    expect(buildJarProgress(updatedJar ?? jar, useAppStore.getState().tokens)).toMatchObject({
      earnedTokenCount: 2,
      inventoryTokenCount: 2,
    });
  });
});
