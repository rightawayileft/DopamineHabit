import { buildProgressDashboard, buildStatsSummary, formatCents } from '@/game/stats';
import type { IntegrityRuntime } from '@/store/types';

const integrityRuntime: IntegrityRuntime = {
  honestyStreak: 0,
  honestAdmissionCount: 0,
  lastSeenTimestamp: '2026-04-27T12:00:00Z',
  clockTamperDetected: false,
  warnings: [],
};

describe('stats summary', () => {
  it('directs empty setup users to create a jar first', () => {
    const summary = buildStatsSummary({
      habits: [],
      jars: [],
      rewards: [],
      completions: [],
      tokens: [],
      spinResults: [],
      rewardGrants: [],
      activeRewardSession: undefined,
      integrityCheckIns: [],
      integrityRuntime,
      todayKey: '2026-04-27',
    });

    expect(summary.nextAction).toMatchObject({
      title: 'Create a jar',
      route: '/jars',
      label: 'Add jar',
    });
  });

  it('summarizes mature local state and prioritizes ready spins', () => {
    const summary = buildStatsSummary({
      habits: [
        {
          id: 'habit-1',
          jarId: 'jar-1',
          name: 'Pushups',
          createdAt: '2026-04-23T12:00:00Z',
        },
      ],
      jars: [
        {
          id: 'jar-1',
          name: 'Fitness',
          colorHex: '#46D56E',
          milestones: [
            {
              id: 'milestone-1',
              tokenThreshold: 1,
              label: 'First token',
              unlockedAt: '2026-04-23T12:10:00Z',
            },
          ],
          funMoneyEnabled: true,
          funMoneyPerTokenCents: 50,
          funMoneyBalanceCents: 150,
          createdAt: '2026-04-23T12:00:00Z',
        },
      ],
      rewards: [
        {
          id: 'reward-1',
          name: 'Phone game',
          tier: 1,
          durationMinutes: 3,
        },
      ],
      completions: [
        {
          id: 'completion-1',
          habitId: 'habit-1',
          completedAt: '2026-04-23T12:05:00Z',
          tokenDrawnId: 'token-1',
          wasBonusRep: false,
        },
        {
          id: 'completion-2',
          habitId: 'habit-1',
          completedAt: '2026-04-24T12:05:00Z',
          tokenDrawnId: 'token-2',
          wasBonusRep: true,
        },
      ],
      tokens: [
        {
          id: 'token-1',
          color: 'blue',
          earnedAt: '2026-04-23T12:05:00Z',
          state: 'in_inventory',
          jarId: 'jar-1',
        },
        {
          id: 'token-2',
          color: 'green',
          earnedAt: '2026-04-24T12:05:00Z',
          state: 'cashed_in',
          jarId: 'jar-1',
        },
      ],
      spinResults: [
        {
          id: 'spin-1',
          spunAt: '2026-04-24T12:07:00Z',
          habitCompletionId: 'completion-2',
          cashedInTokenIds: ['token-2'],
          activatedMaxTier: 3,
          rawLandedSlice: 'tier1',
          awardedTier: 1,
          awardedRewardId: 'reward-1',
          wasNearMiss: false,
          seed: 'seed-1',
        },
      ],
      rewardGrants: [
        {
          id: 'grant-1',
          rewardId: 'reward-1',
          grantedAt: '2026-04-24T12:07:00Z',
          source: 'spin',
          spinResultId: 'spin-1',
          durationMinutes: 3,
          endedAt: '2026-04-24T12:10:00Z',
        },
      ],
      activeRewardSession: undefined,
      integrityCheckIns: [
        {
          id: 'checkin-1',
          date: '2026-04-27',
          answer: 'yes',
          answeredAt: '2026-04-27T21:00:00Z',
        },
      ],
      integrityRuntime: {
        honestyStreak: 1,
        honestAdmissionCount: 0,
        lastSeenTimestamp: '2026-04-27T12:00:00Z',
        clockTamperDetected: false,
        warnings: [],
      },
      todayKey: '2026-04-27',
    });

    expect(summary).toMatchObject({
      activeHabitCount: 1,
      activeRewardCount: 1,
      activeJarCount: 1,
      totalCompletions: 2,
      bonusCompletionCount: 1,
      inventoryTokenCount: 1,
      cashedInTokenCount: 1,
      spinCount: 1,
      rewardGrantCount: 1,
      completedRewardGrantCount: 1,
      recentRewardStatuses: [
        expect.objectContaining({
          id: 'grant-1',
          name: 'Phone game',
          status: 'completed',
          source: 'spin',
          tier: 1,
          durationMinutes: 3,
        }),
      ],
      unlockedMilestoneCount: 1,
      totalMilestoneCount: 1,
      funMoneyBalanceCents: 150,
      topHabitName: 'Pushups',
      checkInCompletedToday: true,
      nextAction: expect.objectContaining({
        title: 'Set up a spin',
        route: '/spin',
      }),
    });
  });

  it('formats fun money balances', () => {
    expect(formatCents(150)).toBe('$1.50');
  });

  it('uses reward grant snapshots for recent reward history', () => {
    const summary = buildStatsSummary({
      habits: [],
      jars: [],
      rewards: [
        {
          id: 'reward-1',
          name: 'Renamed reward',
          tier: 3,
          durationMinutes: 30,
        },
      ],
      completions: [],
      tokens: [],
      spinResults: [],
      rewardGrants: [
        {
          id: 'grant-1',
          rewardId: 'reward-1',
          rewardSnapshot: {
            name: 'Original reward',
            tier: 2,
            durationMinutes: 15,
          },
          grantedAt: '2026-04-27T12:00:00Z',
          source: 'bonus',
          outcome: 'slipped',
          closedAt: '2026-04-27T12:12:00Z',
        },
      ],
      activeRewardSession: undefined,
      integrityCheckIns: [],
      integrityRuntime,
      todayKey: '2026-04-27',
    });

    expect(summary.recentRewardStatuses).toEqual([
      expect.objectContaining({
        name: 'Original reward',
        status: 'slipped',
        source: 'bonus',
        tier: 2,
        durationMinutes: 15,
        closedAt: '2026-04-27T12:12:00Z',
      }),
    ]);
  });

  it('builds a filtered progress dashboard with coaching cards', () => {
    const dashboard = buildProgressDashboard({
      habits: [
        {
          id: 'habit-1',
          jarId: 'jar-1',
          name: 'Pushups',
          createdAt: '2026-04-23T12:00:00Z',
        },
        {
          id: 'habit-2',
          jarId: 'jar-2',
          name: 'Reading',
          createdAt: '2026-04-23T12:00:00Z',
        },
      ],
      jars: [
        {
          id: 'jar-1',
          name: 'Fitness',
          colorHex: '#46D56E',
          milestones: [],
          funMoneyEnabled: false,
          funMoneyPerTokenCents: 50,
          funMoneyBalanceCents: 0,
          createdAt: '2026-04-23T12:00:00Z',
        },
        {
          id: 'jar-2',
          name: 'Mind',
          colorHex: '#3D9BFF',
          milestones: [],
          funMoneyEnabled: false,
          funMoneyPerTokenCents: 50,
          funMoneyBalanceCents: 0,
          createdAt: '2026-04-23T12:00:00Z',
        },
      ],
      rewards: [
        {
          id: 'reward-1',
          name: 'Phone game',
          tier: 1,
          durationMinutes: 3,
        },
      ],
      completions: [
        {
          id: 'completion-1',
          habitId: 'habit-1',
          completedAt: '2026-04-27T12:05:00Z',
          tokenDrawnId: 'token-1',
          wasBonusRep: false,
        },
        {
          id: 'completion-2',
          habitId: 'habit-2',
          completedAt: '2026-03-01T12:05:00Z',
          tokenDrawnId: 'token-2',
          wasBonusRep: false,
        },
      ],
      tokens: [
        {
          id: 'token-1',
          color: 'blue',
          earnedAt: '2026-04-27T12:05:00Z',
          state: 'in_inventory',
          sourceCompletionId: 'completion-1',
          jarId: 'jar-1',
        },
        {
          id: 'token-2',
          color: 'green',
          earnedAt: '2026-03-01T12:05:00Z',
          state: 'in_inventory',
          sourceCompletionId: 'completion-2',
          jarId: 'jar-2',
        },
      ],
      spinResults: [
        {
          id: 'spin-1',
          spunAt: '2026-04-27T12:07:00Z',
          habitCompletionId: 'completion-1',
          cashedInTokenIds: [],
          activatedMaxTier: 1,
          rawLandedSlice: 'tier1',
          awardedTier: 1,
          awardedRewardId: 'reward-1',
          wasNearMiss: false,
          seed: 'seed-1',
        },
      ],
      rewardGrants: [],
      activeRewardSession: undefined,
      integrityCheckIns: [],
      integrityRuntime,
      filters: {
        timeframe: '7d',
        jarId: 'jar-1',
        habitId: 'habit-1',
        todayKey: '2026-04-27',
      },
    });

    expect(dashboard).toMatchObject({
      activeFilterLabel: 'last 7 days / Fitness / Pushups',
      filteredCompletionCount: 1,
      filteredTokenCount: 1,
      filteredSpinCount: 1,
    });
    expect(dashboard.tokenColorCounts).toEqual([{ label: 'blue', count: 1 }]);
    expect(dashboard.coachingCards).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Momentum is real' })]),
    );
  });
});
