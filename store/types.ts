export type UUID = string;
export type ISODate = string;
export type TokenColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'gold';

export interface Habit {
  id: UUID;
  name: string;
  cue?: string;
  jarId: UUID;
  createdAt: ISODate;
  archivedAt?: ISODate;
}

export interface HabitCompletion {
  id: UUID;
  habitId: UUID;
  completedAt: ISODate;
  tokenDrawnId: UUID;
  wasBonusRep: boolean;
  bonusDiscountApplied?: number;
}

export interface Reward {
  id: UUID;
  name: string;
  tier: 1 | 2 | 3 | 'jackpot';
  durationMinutes?: number;
  description?: string;
  archivedAt?: ISODate;
}

export interface Token {
  id: UUID;
  color: TokenColor;
  earnedAt: ISODate;
  sourceCompletionId?: UUID;
  state: 'in_inventory' | 'cashed_in' | 'in_jar';
  jarId: UUID;
}

export interface Jar {
  id: UUID;
  name: string;
  colorHex: string;
  milestones: Milestone[];
  funMoneyEnabled: boolean;
  funMoneyPerTokenCents: number;
  funMoneyBalanceCents: number;
  createdAt: ISODate;
  archivedAt?: ISODate;
}

export interface Milestone {
  id: UUID;
  tokenThreshold: number;
  label: string;
  imageUri?: string;
  unlockedAt?: ISODate;
}

export interface SpinResult {
  id: UUID;
  spunAt: ISODate;
  habitCompletionId: UUID;
  cashedInTokenIds: UUID[];
  activatedMaxTier: 1 | 2 | 3;
  rawLandedSlice: 'tier1' | 'tier2' | 'tier3' | 'jackpot' | 'bonus';
  awardedTier: 1 | 2 | 3 | 'jackpot' | 'bonus';
  awardedRewardId?: UUID;
  wasNearMiss: boolean;
  seed: string;
}

export interface RewardGrant {
  id: UUID;
  rewardId: UUID;
  grantedAt: ISODate;
  source: 'spin' | 'bonus';
  spinResultId?: UUID;
  bonusChainId?: UUID;
  durationMinutes?: number;
  endedAt?: ISODate;
  endedEarlyAt?: ISODate;
}

export interface BonusChain {
  id: UUID;
  startedAt: ISODate;
  endedAt?: ISODate;
  originatingSpinResultId?: UUID;
  spins: BonusSpin[];
  outcome: 'in_progress' | 'completed' | 'timed_out' | 'max_chain';
}

export interface BonusSpin {
  id: UUID;
  seed: string;
  bonusAwardLanded:
    | 'discount_75'
    | 'discount_50'
    | 'discount_25'
    | 'free_token'
    | 'free_golden'
    | 'extra_spin';
  timerStartedAt: ISODate;
  timerExpiresAt: ISODate;
  completedCompletionId?: UUID;
  rewardGrantId?: UUID;
  grantedTokenId?: UUID;
}

export interface IntegrityCheckIn {
  id: UUID;
  date: string;
  answer: 'yes' | 'no' | 'partially';
  answeredAt: ISODate;
}

export interface UserSettings {
  integrityCheckInTime: string;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
  nakedRuleAcceptedAt: ISODate;
  rateLimitSecondsPerHabit: Record<UUID, number>;
}

export type AppMachineState =
  | 'IDLE'
  | 'LOGGING_REP'
  | 'INVENTORY_OPEN'
  | 'READY_TO_SPIN'
  | 'SPINNING'
  | 'RESOLVING'
  | 'REWARD_GRANTED'
  | 'REWARD_ACTIVE'
  | 'BONUS_ROUND'
  | 'BONUS_AWARDING_TIER'
  | 'BONUS_SPINNING'
  | 'BONUS_TIMER_ACTIVE';

export interface PendingSpinContext {
  habitCompletionId: UUID;
  cashedInTokenIds: UUID[];
  activatedMaxTier: 1 | 2 | 3;
  resolvedSpin: {
    seed: string;
    rawLandedSlice: 'tier1' | 'tier2' | 'tier3' | 'jackpot' | 'bonus';
    awardedTier: 1 | 2 | 3 | 'jackpot' | 'bonus';
    wasNearMiss: boolean;
  };
  startedAt: ISODate;
}

export interface ActiveRewardSession {
  rewardGrantId: UUID;
  expiresAt: ISODate;
}

export interface IntegrityRuntime {
  honestyStreak: number;
  honestAdmissionCount: number;
  lastSeenTimestamp: ISODate;
  clockTamperDetected: boolean;
  warnings: string[];
}

export interface CompletionFeedback {
  status: 'completed' | 'rate_limited' | 'unknown_habit';
  habitId: UUID;
  occurredAt: ISODate;
  message: string;
  completionId?: UUID;
  tokenId?: UUID;
  tokenColor?: TokenColor;
  secondsRemaining?: number;
}
