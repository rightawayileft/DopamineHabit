import { resolveCashIn } from '@/game/cashIn';
import type { Token, TokenColor } from '@/store/types';

const token = (id: string, color: TokenColor): Token => ({
  id,
  color,
  earnedAt: '2026-04-23T12:00:00Z',
  state: 'in_inventory',
  jarId: 'jar-1',
});

describe('resolveCashIn', () => {
  it('allows no cash-in for Tier 1', () => {
    expect(resolveCashIn([])).toEqual({
      isValid: true,
      activatedMaxTier: 1,
      cashedInTokenIds: [],
    });
  });

  it('allows two matching regular tokens for Tier 2', () => {
    expect(resolveCashIn([token('a', 'blue'), token('b', 'blue')])).toMatchObject({
      isValid: true,
      activatedMaxTier: 2,
      cashedInTokenIds: ['a', 'b'],
    });
  });

  it('allows three matching regular tokens for Tier 3', () => {
    expect(resolveCashIn([token('a', 'red'), token('b', 'red'), token('c', 'red')])).toMatchObject({
      isValid: true,
      activatedMaxTier: 3,
      cashedInTokenIds: ['a', 'b', 'c'],
    });
  });

  it('allows one Gold token for Tier 3', () => {
    expect(resolveCashIn([token('gold-1', 'gold')])).toMatchObject({
      isValid: true,
      activatedMaxTier: 3,
      cashedInTokenIds: ['gold-1'],
    });
  });

  it('rejects one regular token', () => {
    expect(resolveCashIn([token('a', 'green')]).isValid).toBe(false);
  });

  it('rejects mismatched colors and invalid counts', () => {
    expect(resolveCashIn([token('a', 'green'), token('b', 'blue')]).isValid).toBe(false);
    expect(
      resolveCashIn([token('a', 'green'), token('b', 'green'), token('c', 'green'), token('d', 'green')])
        .isValid,
    ).toBe(false);
  });
});
