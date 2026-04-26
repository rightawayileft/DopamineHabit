import { selectRewardForSpinResult } from '@/game/rewardGrants';
import type { Reward } from '@/store/types';

const rewardsFixture: Reward[] = [
  { id: 'reward-tier-1', name: 'Tea break', tier: 1, durationMinutes: 5 },
  { id: 'reward-tier-2', name: 'Chess', tier: 2, durationMinutes: 10 },
  { id: 'reward-jackpot', name: 'Movie', tier: 'jackpot', durationMinutes: 60 },
];

describe('selectRewardForSpinResult', () => {
  it('selects the first exact-tier reward when available', () => {
    const selected = selectRewardForSpinResult(rewardsFixture, 2);

    expect(selected.strategy).toBe('exact_tier');
    expect(selected.reward?.id).toBe('reward-tier-2');
  });

  it('falls back to the lowest tier when the awarded tier is empty', () => {
    const selected = selectRewardForSpinResult(rewardsFixture, 3);

    expect(selected.strategy).toBe('fallback_lowest_tier');
    expect(selected.reward?.id).toBe('reward-tier-1');
  });

  it('does not select archived rewards', () => {
    const selected = selectRewardForSpinResult(
      rewardsFixture.map((reward) =>
        reward.id === 'reward-tier-1'
          ? {
              ...reward,
              archivedAt: '2026-04-23T15:00:00Z',
            }
          : reward,
      ),
      1,
    );

    expect(selected.strategy).toBe('fallback_lowest_tier');
    expect(selected.reward?.id).toBe('reward-tier-2');
  });

  it('returns none for bonus awards', () => {
    const selected = selectRewardForSpinResult(rewardsFixture, 'bonus');

    expect(selected.strategy).toBe('none_available');
    expect(selected.reward).toBeUndefined();
  });
});
