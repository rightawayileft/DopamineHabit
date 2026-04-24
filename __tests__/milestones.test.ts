import { detectMilestoneUnlocks } from '@/game/milestones';
import type { Jar } from '@/store/types';

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
});
