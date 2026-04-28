import {
  buildActiveRewardSessionDetails,
  buildSpinDisabledReason,
  buildSpinOutcomeDetails,
} from '@/game/spinComprehension';
import type { Reward, RewardGrant, SpinResult } from '@/store/types';

const tierOneReward: Reward = {
  id: 'reward-1',
  name: 'Phone game',
  tier: 1,
  durationMinutes: 3,
};

const tierTwoReward: Reward = {
  id: 'reward-2',
  name: 'Chess puzzle',
  tier: 2,
  durationMinutes: 10,
};

const baseSpinResult: SpinResult = {
  id: 'spin-1',
  spunAt: '2026-04-27T13:00:00Z',
  habitCompletionId: 'completion-1',
  cashedInTokenIds: [],
  activatedMaxTier: 1,
  rawLandedSlice: 'tier1',
  awardedTier: 1,
  awardedRewardId: 'reward-1',
  wasNearMiss: false,
  seed: 'seed-1',
};

describe('spin comprehension', () => {
  it('prioritizes direct disabled spin reasons', () => {
    expect(
      buildSpinDisabledReason({
        hasRepReady: true,
        hasPendingSpin: false,
        hasActiveReward: false,
        isAnimating: true,
        isCashInValid: true,
      }),
    ).toBe('The wheel is still spinning.');

    expect(
      buildSpinDisabledReason({
        hasRepReady: false,
        hasPendingSpin: false,
        hasActiveReward: false,
        isAnimating: false,
        isCashInValid: true,
      }),
    ).toBe('Complete a habit rep before spinning.');

    expect(
      buildSpinDisabledReason({
        hasRepReady: true,
        hasPendingSpin: false,
        hasActiveReward: false,
        isAnimating: false,
        isCashInValid: false,
        cashInReason: 'Cash-ins must use matching non-gold tokens.',
      }),
    ).toBe('Cash-ins must use matching non-gold tokens.');
  });

  it('explains an exact reward outcome', () => {
    const details = buildSpinOutcomeDetails({
      result: baseSpinResult,
      awardedReward: tierOneReward,
      cashedInTokenCount: 0,
    });

    expect(details).toMatchObject({
      title: 'Awarded Phone game',
      lines: expect.arrayContaining([
        'Landed on: Tier 1.',
        'Activated tier: Tier 1.',
        'No tokens cashed in. This was a Tier 1 attempt.',
        'The wheel awarded Tier 1.',
        'Reward: Phone game, 3 min.',
      ]),
    });
  });

  it('explains fallback rewards and near misses', () => {
    const fallback = buildSpinOutcomeDetails({
      result: {
        ...baseSpinResult,
        activatedMaxTier: 3,
        rawLandedSlice: 'tier3',
        awardedTier: 3,
      },
      awardedReward: tierOneReward,
      cashedInTokenCount: 3,
    });
    const nearMiss = buildSpinOutcomeDetails({
      result: {
        ...baseSpinResult,
        rawLandedSlice: 'tier2',
        awardedTier: 1,
        wasNearMiss: true,
      },
      awardedReward: tierOneReward,
      cashedInTokenCount: 0,
    });

    expect(fallback.lines).toEqual(
      expect.arrayContaining([
        'No Tier 3 reward was configured, so the app used Tier 1.',
      ]),
    );
    expect(nearMiss.lines).toEqual(
      expect.arrayContaining([
        'Near miss: landed on locked Tier 2, then fell through to Tier 1.',
      ]),
    );
  });

  it('builds active reward recovery context', () => {
    const grant: RewardGrant = {
      id: 'grant-1',
      rewardId: tierTwoReward.id,
      grantedAt: '2026-04-27T13:00:00Z',
      source: 'spin',
      spinResultId: 'spin-1',
      durationMinutes: 10,
    };
    const details = buildActiveRewardSessionDetails({
      reward: tierTwoReward,
      grant,
      expiresAt: '2026-04-27T13:10:00Z',
    });

    expect(details).toMatchObject({
      title: 'Active reward: Chess puzzle',
      lines: expect.arrayContaining([
        'Granted from spin.',
        'Session length: 10 min.',
        'Closes around 2026-04-27T13:10:00Z.',
        'Protect this session: use only the granted reward, then mark it complete.',
      ]),
    });
  });
});
