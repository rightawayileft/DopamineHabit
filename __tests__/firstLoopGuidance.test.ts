import {
  buildFirstSpinChecklist,
  quickHabitTemplates,
  quickRewardTemplates,
} from '@/game/firstLoopGuidance';

describe('first loop guidance', () => {
  it('ships practical quick-add templates', () => {
    expect(quickHabitTemplates.length).toBeGreaterThanOrEqual(3);
    expect(quickRewardTemplates.map((reward) => reward.tier)).toEqual(
      expect.arrayContaining([1, 2, 3, 'jackpot']),
    );
  });

  it('locks spin setup until a habit rep is ready', () => {
    const checklist = buildFirstSpinChecklist({
      hasRepReady: false,
      hasPendingSpin: false,
      hasActiveReward: false,
      isCashInValid: true,
      selectedTokenCount: 0,
      inventoryTokenCount: 0,
      activatedMaxTier: 1,
    });

    expect(checklist.canStartSpin).toBe(false);
    expect(checklist.summary).toBe('Complete a habit rep to unlock spin setup.');
    expect(checklist.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'rep', status: 'available' }),
        expect.objectContaining({ id: 'cash-in', status: 'locked' }),
        expect.objectContaining({ id: 'spin', status: 'locked' }),
      ]),
    );
  });

  it('explains invalid token selections after a rep is ready', () => {
    const checklist = buildFirstSpinChecklist({
      hasRepReady: true,
      hasPendingSpin: false,
      hasActiveReward: false,
      isCashInValid: false,
      cashInReason: 'Cash-ins must use matching non-gold tokens.',
      selectedTokenCount: 2,
      inventoryTokenCount: 3,
      activatedMaxTier: 1,
    });

    expect(checklist.canStartSpin).toBe(false);
    expect(checklist.summary).toBe('Cash-ins must use matching non-gold tokens.');
    expect(checklist.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'rep', status: 'complete' }),
        expect.objectContaining({ id: 'cash-in', status: 'blocked' }),
        expect.objectContaining({ id: 'spin', status: 'blocked' }),
      ]),
    );
  });

  it('recognizes ready tier-one and higher-tier spins', () => {
    const tierOneChecklist = buildFirstSpinChecklist({
      hasRepReady: true,
      hasPendingSpin: false,
      hasActiveReward: false,
      isCashInValid: true,
      selectedTokenCount: 0,
      inventoryTokenCount: 1,
      activatedMaxTier: 1,
    });
    const tierThreeChecklist = buildFirstSpinChecklist({
      hasRepReady: true,
      hasPendingSpin: false,
      hasActiveReward: false,
      isCashInValid: true,
      selectedTokenCount: 3,
      inventoryTokenCount: 3,
      activatedMaxTier: 3,
    });

    expect(tierOneChecklist).toMatchObject({
      canStartSpin: true,
      summary: 'Ready for a Tier 1 spin with no cash-in.',
    });
    expect(tierThreeChecklist).toMatchObject({
      canStartSpin: true,
      summary: 'Ready for a Tier 3 spin.',
    });
  });

  it('prioritizes recovery and active reward blockers', () => {
    expect(
      buildFirstSpinChecklist({
        hasRepReady: false,
        hasPendingSpin: true,
        hasActiveReward: false,
        isCashInValid: true,
        selectedTokenCount: 0,
        inventoryTokenCount: 0,
        activatedMaxTier: 1,
      }).summary,
    ).toBe('An interrupted spin is saved and ready to finish.');

    expect(
      buildFirstSpinChecklist({
        hasRepReady: true,
        hasPendingSpin: false,
        hasActiveReward: true,
        isCashInValid: true,
        selectedTokenCount: 0,
        inventoryTokenCount: 1,
        activatedMaxTier: 1,
      }).items,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'reward', status: 'blocked' })]));
  });
});
