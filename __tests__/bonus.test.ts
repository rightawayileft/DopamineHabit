import { bonusDiscountPercent, resolveBonusAward } from '@/game/bonus';

describe('bonus awards', () => {
  it('resolves bonus awards deterministically from a seed', () => {
    expect(resolveBonusAward({ seed: 'bonus-award-seed' })).toEqual(
      resolveBonusAward({ seed: 'bonus-award-seed' }),
    );
  });

  it('maps discount awards to their discount percentages', () => {
    expect(bonusDiscountPercent('discount_75')).toBe(75);
    expect(bonusDiscountPercent('discount_50')).toBe(50);
    expect(bonusDiscountPercent('discount_25')).toBe(25);
    expect(bonusDiscountPercent('extra_spin')).toBeUndefined();
  });
});
