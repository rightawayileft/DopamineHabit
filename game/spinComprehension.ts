import type { Reward, RewardGrant, SpinResult } from '@/store/types';

export interface SpinDisabledReasonInput {
  hasRepReady: boolean;
  hasPendingSpin: boolean;
  hasActiveReward: boolean;
  isAnimating: boolean;
  isCashInValid: boolean;
  cashInReason?: string;
}

export interface SpinOutcomeDetailsInput {
  result: SpinResult;
  awardedReward?: Reward;
  cashedInTokenCount: number;
}

export interface SpinOutcomeDetails {
  title: string;
  lines: string[];
}

export interface ActiveRewardSessionDetailsInput {
  reward: Reward;
  grant: RewardGrant;
  expiresAt: string;
}

export interface ActiveRewardSessionDetails {
  title: string;
  lines: string[];
}

export const formatRewardTier = (tier: Reward['tier'] | SpinResult['awardedTier']): string => {
  if (tier === 'jackpot') {
    return 'Jackpot';
  }

  if (tier === 'bonus') {
    return 'Bonus';
  }

  return `Tier ${tier}`;
};

const formatLandedSlice = (slice: SpinResult['rawLandedSlice']): string => {
  if (slice === 'tier1') {
    return 'Tier 1';
  }

  if (slice === 'tier2') {
    return 'Tier 2';
  }

  if (slice === 'tier3') {
    return 'Tier 3';
  }

  return formatRewardTier(slice);
};

const formatCashIn = (tokenCount: number): string => {
  if (tokenCount === 0) {
    return 'No tokens cashed in. This was a Tier 1 attempt.';
  }

  return `${tokenCount} token${tokenCount === 1 ? '' : 's'} cashed in.`;
};

export const buildSpinDisabledReason = (
  input: SpinDisabledReasonInput,
): string | undefined => {
  if (input.isAnimating) {
    return 'The wheel is still spinning.';
  }

  if (input.hasPendingSpin) {
    return 'Finish the interrupted spin before starting a new one.';
  }

  if (input.hasActiveReward) {
    return 'Finish or end the active reward before spinning again.';
  }

  if (!input.hasRepReady) {
    return 'Complete a habit rep before spinning.';
  }

  if (!input.isCashInValid) {
    return input.cashInReason ?? 'Adjust the selected tokens before spinning.';
  }

  return undefined;
};

export const buildSpinOutcomeDetails = ({
  awardedReward,
  cashedInTokenCount,
  result,
}: SpinOutcomeDetailsInput): SpinOutcomeDetails => {
  const fallbackUsed =
    awardedReward !== undefined &&
    result.awardedTier !== 'bonus' &&
    awardedReward.tier !== result.awardedTier;
  const title =
    result.rawLandedSlice === 'bonus'
      ? 'Bonus round unlocked'
      : awardedReward
        ? `Awarded ${awardedReward.name}`
        : `Awarded ${formatRewardTier(result.awardedTier)}`;
  const rewardLine = awardedReward
    ? `Reward: ${awardedReward.name}${
        awardedReward.durationMinutes ? `, ${awardedReward.durationMinutes} min` : ''
      }.`
    : result.awardedTier === 'bonus'
      ? 'No reward session yet. Open Bonus to continue the chain.'
      : 'No configured reward was available for this outcome.';
  const explanation = result.wasNearMiss
    ? `Near miss: landed on locked ${formatLandedSlice(
        result.rawLandedSlice,
      )}, then fell through to Tier 1.`
    : fallbackUsed
      ? `No ${formatRewardTier(result.awardedTier)} reward was configured, so the app used ${formatRewardTier(
          awardedReward.tier,
        )}.`
      : result.rawLandedSlice === 'bonus'
        ? 'The wheel landed on Bonus instead of a reward tier.'
        : `The wheel awarded ${formatRewardTier(result.awardedTier)}.`;

  return {
    title,
    lines: [
      `Landed on: ${formatLandedSlice(result.rawLandedSlice)}.`,
      `Activated tier: ${formatRewardTier(result.activatedMaxTier)}.`,
      formatCashIn(cashedInTokenCount),
      explanation,
      rewardLine,
    ],
  };
};

export const buildActiveRewardSessionDetails = ({
  expiresAt,
  grant,
  reward,
}: ActiveRewardSessionDetailsInput): ActiveRewardSessionDetails => ({
  title: `Active reward: ${reward.name}`,
  lines: [
    `Granted from ${grant.source}.`,
    grant.durationMinutes
      ? `Session length: ${grant.durationMinutes} min.`
      : 'Session length follows the reward configuration.',
    `Closes around ${expiresAt}.`,
    'Protect this session: use only the granted reward, then mark it complete.',
    'End early if you stop before the timer is done.',
  ],
});
