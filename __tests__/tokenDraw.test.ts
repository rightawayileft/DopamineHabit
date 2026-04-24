import { drawToken } from '@/game/tokenDraw';
import type { TokenColor } from '@/store/types';

const DRAW_COUNT = 100_000;
const CHI_SQUARED_CRITICAL_DF5_P05 = 11.07;
const REGULAR_COLORS: Exclude<TokenColor, 'gold'>[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
];

describe('drawToken', () => {
  it('keeps Golden drops rare and regular colors uniform', () => {
    const observedColors: Record<Exclude<TokenColor, 'gold'>, number> = {
      red: 0,
      orange: 0,
      yellow: 0,
      green: 0,
      blue: 0,
      purple: 0,
    };
    let goldenCount = 0;
    let regularCount = 0;

    for (let index = 0; index < DRAW_COUNT; index += 1) {
      const result = drawToken({ seed: `token-${index}` });

      if (result.color === 'gold') {
        goldenCount += 1;
      } else {
        observedColors[result.color] += 1;
        regularCount += 1;
      }
    }

    const goldenRate = goldenCount / DRAW_COUNT;
    expect(goldenRate).toBeGreaterThanOrEqual(0.005);
    expect(goldenRate).toBeLessThanOrEqual(0.009);

    const expectedPerColor = regularCount / REGULAR_COLORS.length;
    const chiSquared = REGULAR_COLORS.reduce((total, color) => {
      const observed = observedColors[color];
      return total + (observed - expectedPerColor) ** 2 / expectedPerColor;
    }, 0);

    expect(chiSquared).toBeLessThan(CHI_SQUARED_CRITICAL_DF5_P05);
  });

  it('converts overflow Golden drops into regular random colors', () => {
    for (let index = 0; index < DRAW_COUNT; index += 1) {
      const seed = `overflow-gold-${index}`;
      const candidate = drawToken({ seed });

      if (candidate.rolledGolden) {
        const overflow = drawToken({ seed, existingGoldenCount: 3 });
        expect(overflow.color).not.toBe('gold');
        expect(overflow.convertedOverflowGolden).toBe(true);
        return;
      }
    }

    throw new Error('Unable to find a deterministic Golden token seed.');
  });
});
