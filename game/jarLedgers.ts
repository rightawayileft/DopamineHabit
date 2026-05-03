import type { Jar, Token } from '@/store/types';

export interface MilestoneLedgerItem {
  id: string;
  label: string;
  tokenThreshold: number;
  status: 'unlocked' | 'pending';
  unlockedAt?: string;
  tokensRemaining: number;
}

export interface FunMoneyLedgerEntry {
  id: string;
  tokenColor: Token['color'];
  tokenState: Token['state'];
  earnedAt: string;
  amountCents: number;
  sourceCompletionId?: string;
}

export interface JarLedgerSummary {
  earnedTokenCount: number;
  funMoneyBalanceCents: number;
  funMoneyPerTokenCents: number;
  milestoneLedger: MilestoneLedgerItem[];
  recentFunMoneyEntries: FunMoneyLedgerEntry[];
  totalFunMoneyEntryCount: number;
}

export const buildJarLedgers = (
  jar: Jar,
  tokens: Token[],
  maxFunMoneyEntries = 6,
): JarLedgerSummary => {
  const jarTokens = tokens.filter((token) => token.jarId === jar.id);
  const earnedTokenCount = jarTokens.length;
  const milestoneLedger = jar.milestones
    .slice()
    .sort((left, right) => left.tokenThreshold - right.tokenThreshold)
    .map((milestone) => ({
      id: milestone.id,
      label: milestone.label,
      tokenThreshold: milestone.tokenThreshold,
      status: milestone.unlockedAt ? ('unlocked' as const) : ('pending' as const),
      ...(milestone.unlockedAt ? { unlockedAt: milestone.unlockedAt } : {}),
      tokensRemaining: Math.max(milestone.tokenThreshold - earnedTokenCount, 0),
    }));
  const funMoneyTokens = jar.funMoneyEnabled ? jarTokens : [];
  const recentFunMoneyEntries = funMoneyTokens
    .slice()
    .sort((left, right) => right.earnedAt.localeCompare(left.earnedAt))
    .slice(0, maxFunMoneyEntries)
    .map((token) => ({
      id: token.id,
      tokenColor: token.color,
      tokenState: token.state,
      earnedAt: token.earnedAt,
      amountCents: jar.funMoneyPerTokenCents,
      ...(token.sourceCompletionId ? { sourceCompletionId: token.sourceCompletionId } : {}),
    }));

  return {
    earnedTokenCount,
    funMoneyBalanceCents: jar.funMoneyBalanceCents,
    funMoneyPerTokenCents: jar.funMoneyPerTokenCents,
    milestoneLedger,
    recentFunMoneyEntries,
    totalFunMoneyEntryCount: funMoneyTokens.length,
  };
};
