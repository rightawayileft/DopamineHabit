import type { Token } from '@/store/types';

export interface CashInResult {
  isValid: boolean;
  activatedMaxTier: 1 | 2 | 3;
  cashedInTokenIds: string[];
  reason?: string;
}

export const resolveCashIn = (selectedTokens: Token[]): CashInResult => {
  if (selectedTokens.length === 0) {
    return {
      isValid: true,
      activatedMaxTier: 1,
      cashedInTokenIds: [],
    };
  }

  if (selectedTokens.length === 1) {
    const [token] = selectedTokens;
    if (token?.color === 'gold') {
      return {
        isValid: true,
        activatedMaxTier: 3,
        cashedInTokenIds: [token.id],
      };
    }

    return {
      isValid: false,
      activatedMaxTier: 1,
      cashedInTokenIds: [],
      reason: 'Single-token cash-ins are only valid for Gold tokens.',
    };
  }

  if (selectedTokens.length !== 2 && selectedTokens.length !== 3) {
    return {
      isValid: false,
      activatedMaxTier: 1,
      cashedInTokenIds: [],
      reason: 'Cash-ins must use 0, 2, or 3 tokens.',
    };
  }

  const distinctColors = new Set(selectedTokens.map((token) => token.color));
  if (distinctColors.size !== 1 || distinctColors.has('gold')) {
    return {
      isValid: false,
      activatedMaxTier: 1,
      cashedInTokenIds: [],
      reason: 'Cash-ins must use matching non-gold tokens.',
    };
  }

  return {
    isValid: true,
    activatedMaxTier: selectedTokens.length === 2 ? 2 : 3,
    cashedInTokenIds: selectedTokens.map((token) => token.id),
  };
};
