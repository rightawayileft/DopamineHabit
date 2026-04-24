import { GOLDEN_TOKEN_RATE } from '@/game/constants';
import { hashSeedToUint32, mulberry32 } from '@/game/probabilities';
import type { TokenColor } from '@/store/types';
import { createUuid } from '@/utils/uuid';

export interface TokenDrawInputs {
  seed?: string;
  existingGoldenCount?: number;
}

export interface TokenDrawResult {
  color: TokenColor;
  seed: string;
  rolledGolden: boolean;
  convertedOverflowGolden: boolean;
}

const REGULAR_COLORS: TokenColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

export const drawToken = ({
  seed,
  existingGoldenCount = 0,
}: TokenDrawInputs = {}): TokenDrawResult => {
  const actualSeed = seed ?? createUuid();
  const random = mulberry32(hashSeedToUint32(actualSeed));
  const goldenRoll = random();

  if (goldenRoll < GOLDEN_TOKEN_RATE) {
    if (existingGoldenCount >= 3) {
      const colorIndex = Math.floor(random() * REGULAR_COLORS.length) % REGULAR_COLORS.length;
      return {
        color: REGULAR_COLORS[colorIndex] ?? 'red',
        seed: actualSeed,
        rolledGolden: true,
        convertedOverflowGolden: true,
      };
    }

    return {
      color: 'gold',
      seed: actualSeed,
      rolledGolden: true,
      convertedOverflowGolden: false,
    };
  }

  const colorIndex = Math.floor(random() * REGULAR_COLORS.length) % REGULAR_COLORS.length;
  return {
    color: REGULAR_COLORS[colorIndex] ?? 'red',
    seed: actualSeed,
    rolledGolden: false,
    convertedOverflowGolden: false,
  };
};
