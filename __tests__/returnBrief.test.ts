import { buildReturnBrief } from '@/game/returnBrief';

describe('return brief', () => {
  it('prioritizes a clean check-in restart after several days away', () => {
    const brief = buildReturnBrief({
      activeRewardSession: undefined,
      completions: [],
      integrityCheckIns: [],
      inventoryTokens: [],
      lastSeenTimestamp: '2026-04-25T12:00:00Z',
      now: new Date('2026-05-02T12:00:00Z'),
    });

    expect(brief).toMatchObject({
      shouldShow: true,
      daysAway: 7,
      primaryLabel: 'Check in today',
      primaryRoute: '/checkin',
    });
  });

  it('points returning users with a waiting reward back to reward closure', () => {
    const brief = buildReturnBrief({
      activeRewardSession: {
        rewardGrantId: 'grant-1',
        expiresAt: '2026-05-02T12:10:00Z',
      },
      completions: [],
      integrityCheckIns: [],
      inventoryTokens: [],
      lastSeenTimestamp: '2026-04-29T12:00:00Z',
      now: new Date('2026-05-02T12:00:00Z'),
    });

    expect(brief).toMatchObject({
      shouldShow: true,
      primaryLabel: 'Close reward',
      primaryRoute: '/rewards',
    });
  });
});
