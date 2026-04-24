import type { Token } from '@/store/types';

export interface TokensSlice {
  tokens: Token[];
}

export const createInitialTokensSlice = (): TokensSlice => ({
  tokens: [],
});
