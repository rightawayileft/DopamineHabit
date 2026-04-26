import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { bonusDiscountPercent, resolveBonusAward } from '@/game/bonus';
import { BONUS_CHAIN_MAX, BONUS_TIMER_MINUTES } from '@/game/constants';
import { detectClockTamper, evaluateRateLimit } from '@/game/integrity';
import { resolveSpin, type ResolvedSpin } from '@/game/probabilities';
import { selectRewardForSpinResult } from '@/game/rewardGrants';
import { drawToken } from '@/game/tokenDraw';
import { createInitialBonusSlice, type BonusSlice } from '@/store/bonus.slice';
import { createInitialHabitsSlice, type HabitsSlice } from '@/store/habits.slice';
import { createInitialIntegritySlice, type IntegritySlice } from '@/store/integrity.slice';
import { createInitialJarsSlice, type JarsSlice } from '@/store/jars.slice';
import {
  APP_STORE_STORAGE_KEY,
  appStorage,
  readPersistedJsonForTests,
} from '@/store/persistence';
import { createInitialRewardsSlice, type RewardsSlice } from '@/store/rewards.slice';
import { createInitialSettingsSlice, type SettingsSlice } from '@/store/settings.slice';
import { createInitialSpinsSlice, type SpinsSlice } from '@/store/spins.slice';
import { createInitialTokensSlice, type TokensSlice } from '@/store/tokens.slice';
import type {
  ActiveRewardSession,
  AppMachineState,
  BonusChain,
  BonusSpin,
  CompletionFeedback,
  Habit,
  HabitCompletion,
  ISODate,
  Jar,
  PendingSpinContext,
  Reward,
  RewardGrant,
  SpinResult,
  Token,
  UserSettings,
  UUID,
} from '@/store/types';
import { addMinutesToIso, nowIso } from '@/utils/date';
import { createUuid } from '@/utils/uuid';

export interface AppState
  extends HabitsSlice,
    TokensSlice,
    JarsSlice,
    RewardsSlice,
    SpinsSlice,
    BonusSlice,
    SettingsSlice,
    IntegritySlice {
  currentState: AppMachineState;
  activeRewardSession: ActiveRewardSession | undefined;
  lastCompletionFeedback: CompletionFeedback | undefined;
}

export interface AppActions {
  transitionTo: (nextState: AppMachineState) => boolean;
  addJar: (jar: Jar) => void;
  addHabit: (habit: Habit) => void;
  addReward: (reward: Reward) => void;
  createJar: (input: CreateJarInput) => Jar | undefined;
  updateJar: (input: UpdateJarInput) => Jar | undefined;
  archiveJar: (jarId: UUID, archivedAt?: ISODate) => void;
  restoreJar: (jarId: UUID) => void;
  createHabit: (input: CreateHabitInput) => Habit | undefined;
  updateHabit: (input: UpdateHabitInput) => Habit | undefined;
  archiveHabit: (habitId: UUID, archivedAt?: ISODate) => void;
  restoreHabit: (habitId: UUID) => void;
  createReward: (input: CreateRewardInput) => Reward | undefined;
  updateReward: (input: UpdateRewardInput) => Reward | undefined;
  archiveReward: (rewardId: UUID, archivedAt?: ISODate) => void;
  restoreReward: (rewardId: UUID) => void;
  acceptNakedRule: (acceptedAt?: ISODate) => void;
  createInitialOnboardingSetup: (input: InitialOnboardingSetupInput) => {
    jar: Jar;
    habit: Habit;
    reward: Reward;
  };
  logHabitCompletion: (input: LogHabitCompletionInput) => HabitCompletion | undefined;
  prepareSpin: (input: PrepareSpinInput) => PendingSpinContext | undefined;
  resolvePreparedSpin: (spinResultId?: UUID) => SpinResult | undefined;
  startBonusSpin: (input?: StartBonusSpinInput) => BonusSpin | undefined;
  completeBonusTimer: (input: CompleteBonusTimerInput) => HabitCompletion | undefined;
  syncBonusChainState: (timestamp?: ISODate) => void;
  grantReward: (grant: RewardGrant) => void;
  setActiveRewardSession: (session: ActiveRewardSession | undefined) => void;
  endActiveRewardSession: (endedAt?: ISODate) => void;
  endRewardSessionEarly: (endedEarlyAt?: ISODate) => void;
  syncRewardSessionState: (timestamp?: ISODate) => void;
  answerIntegrityCheckIn: (answer: 'yes' | 'no' | 'partially', answeredAt?: ISODate) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  markAppSeen: (timestamp?: ISODate) => void;
  clearCompletionFeedback: () => void;
  resetForTests: () => void;
  rehydrateFromStorageForTests: () => void;
}

export interface LogHabitCompletionInput {
  habitId: UUID;
  completedAt?: ISODate;
  wasBonusRep?: boolean;
  bonusDiscountApplied?: number;
  tokenSeed?: string;
}

export interface PrepareSpinInput {
  habitCompletionId: UUID;
  cashedInTokenIds?: UUID[];
  activatedMaxTier: 1 | 2 | 3;
  seed?: string;
  startedAt?: ISODate;
}

export interface StartBonusSpinInput {
  seed?: string;
  startedAt?: ISODate;
  bonusSpinId?: UUID;
}

export interface CompleteBonusTimerInput {
  habitId: UUID;
  completedAt?: ISODate;
  tokenSeed?: string;
  bonusTokenSeed?: string;
  completionId?: UUID;
  tokenId?: UUID;
  bonusTokenId?: UUID;
  rewardGrantId?: UUID;
}

export interface CreateJarInput {
  id?: UUID;
  name: string;
  colorHex: string;
  funMoneyEnabled?: boolean;
  funMoneyPerTokenCents?: number;
  createdAt?: ISODate;
}

export interface UpdateJarInput {
  id: UUID;
  name?: string;
  colorHex?: string;
  funMoneyEnabled?: boolean;
  funMoneyPerTokenCents?: number;
}

export interface CreateHabitInput {
  id?: UUID;
  name: string;
  cue?: string;
  jarId: UUID;
  createdAt?: ISODate;
}

export interface UpdateHabitInput {
  id: UUID;
  name?: string;
  cue?: string;
  jarId?: UUID;
}

export interface CreateRewardInput {
  id?: UUID;
  name: string;
  tier: Reward['tier'];
  durationMinutes?: number;
  description?: string;
}

export interface UpdateRewardInput {
  id: UUID;
  name?: string;
  tier?: Reward['tier'];
  durationMinutes?: number;
  description?: string;
}

export interface InitialOnboardingSetupInput {
  jarName: string;
  jarColorHex: string;
  habitName: string;
  habitCue?: string;
  rewardName: string;
  rewardDurationMinutes: number;
  createdAt?: ISODate;
}

export type AppStore = AppState & AppActions;

type PersistedAppState = AppState;

interface PersistedEnvelope {
  state: Partial<PersistedAppState>;
  version: number;
}

const legalTransitions: Record<AppMachineState, AppMachineState[]> = {
  IDLE: ['LOGGING_REP', 'BONUS_AWARDING_TIER'],
  LOGGING_REP: ['INVENTORY_OPEN'],
  INVENTORY_OPEN: ['READY_TO_SPIN'],
  READY_TO_SPIN: ['SPINNING'],
  SPINNING: ['RESOLVING'],
  RESOLVING: ['BONUS_ROUND', 'REWARD_GRANTED'],
  REWARD_GRANTED: ['REWARD_ACTIVE', 'IDLE'],
  REWARD_ACTIVE: ['IDLE'],
  BONUS_ROUND: ['IDLE', 'BONUS_AWARDING_TIER'],
  BONUS_AWARDING_TIER: ['BONUS_SPINNING'],
  BONUS_SPINNING: ['BONUS_TIMER_ACTIVE'],
  BONUS_TIMER_ACTIVE: ['BONUS_SPINNING', 'IDLE'],
};

export const createInitialAppState = (): AppState => ({
  currentState: 'IDLE',
  activeRewardSession: undefined,
  lastCompletionFeedback: undefined,
  ...createInitialHabitsSlice(),
  ...createInitialTokensSlice(),
  ...createInitialJarsSlice(),
  ...createInitialRewardsSlice(),
  ...createInitialSpinsSlice(),
  ...createInitialBonusSlice(),
  ...createInitialSettingsSlice(),
  ...createInitialIntegritySlice(),
});

const persistableState = (state: AppStore): PersistedAppState => ({
  currentState: state.currentState,
  activeRewardSession: state.activeRewardSession,
  lastCompletionFeedback: state.lastCompletionFeedback,
  habits: state.habits,
  completions: state.completions,
  tokens: state.tokens,
  jars: state.jars,
  rewards: state.rewards,
  rewardGrants: state.rewardGrants,
  spinResults: state.spinResults,
  pendingSpin: state.pendingSpin,
  bonusChains: state.bonusChains,
  activeBonusChainId: state.activeBonusChainId,
  settings: state.settings,
  integrityCheckIns: state.integrityCheckIns,
  integrityRuntime: state.integrityRuntime,
});

const warnInvalidTransition = (from: AppMachineState, to: AppMachineState): void => {
  console.warn(`Invalid state transition ignored: ${from} -> ${to}`);
};

const latestCompletionForHabit = (
  completions: HabitCompletion[],
  habitId: UUID,
): HabitCompletion | undefined =>
  completions
    .filter((completion) => completion.habitId === habitId)
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0];

const buildSpinResult = (
  pendingSpin: PendingSpinContext,
  id: UUID,
  spunAt: ISODate,
  awardedRewardId?: UUID,
): SpinResult => ({
  id,
  spunAt,
  habitCompletionId: pendingSpin.habitCompletionId,
  cashedInTokenIds: pendingSpin.cashedInTokenIds,
  activatedMaxTier: pendingSpin.activatedMaxTier,
  rawLandedSlice: pendingSpin.resolvedSpin.rawLandedSlice,
  awardedTier: pendingSpin.resolvedSpin.awardedTier,
  ...(awardedRewardId === undefined ? {} : { awardedRewardId }),
  wasNearMiss: pendingSpin.resolvedSpin.wasNearMiss,
  seed: pendingSpin.resolvedSpin.seed,
});

const findActiveBonusChain = (state: AppState): BonusChain | undefined =>
  state.activeBonusChainId
    ? state.bonusChains.find((chain) => chain.id === state.activeBonusChainId)
    : undefined;

const latestBonusSpin = (chain: BonusChain): BonusSpin | undefined =>
  chain.spins[chain.spins.length - 1];

const isAtOrAfter = (timestamp: ISODate, target: ISODate): boolean =>
  new Date(timestamp).getTime() >= new Date(target).getTime();

const optionalTrimmed = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const activeJarById = (jars: Jar[], jarId: UUID): Jar | undefined =>
  jars.find((jar) => jar.id === jarId && !jar.archivedAt);

const createBonusToken = ({
  award,
  bonusTokenId,
  bonusTokenSeed,
  completedAt,
  completionId,
  existingGoldenCount,
  jarId,
}: {
  award: BonusSpin['bonusAwardLanded'];
  bonusTokenId: UUID;
  bonusTokenSeed?: string;
  completedAt: ISODate;
  completionId: UUID;
  existingGoldenCount: number;
  jarId: UUID;
}): Token | undefined => {
  if (award === 'free_golden') {
    const fallbackToken = drawToken({
      ...(bonusTokenSeed === undefined ? {} : { seed: bonusTokenSeed }),
      existingGoldenCount,
    });
    const color = existingGoldenCount >= 3 ? fallbackToken.color : 'gold';

    return {
      id: bonusTokenId,
      color,
      earnedAt: completedAt,
      sourceCompletionId: completionId,
      state: 'in_inventory',
      jarId,
    };
  }

  if (award !== 'free_token') {
    return undefined;
  }

  const tokenDraw = drawToken({
    ...(bonusTokenSeed === undefined ? {} : { seed: bonusTokenSeed }),
    existingGoldenCount,
  });

  return {
    id: bonusTokenId,
    color: tokenDraw.color,
    earnedAt: completedAt,
    sourceCompletionId: completionId,
    state: 'in_inventory',
    jarId,
  };
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createInitialAppState(),

      transitionTo: (nextState) => {
        const currentState = get().currentState;
        if (!legalTransitions[currentState].includes(nextState)) {
          warnInvalidTransition(currentState, nextState);
          return false;
        }

        set({ currentState: nextState });
        return true;
      },

      addJar: (jar) => {
        set((state) => ({
          jars: [...state.jars, jar],
        }));
      },

      addHabit: (habit) => {
        set((state) => ({
          habits: [...state.habits, habit],
        }));
      },

      addReward: (reward) => {
        set((state) => ({
          rewards: [...state.rewards, reward],
        }));
      },

      createJar: ({
        id = createUuid(),
        name,
        colorHex,
        funMoneyEnabled = false,
        funMoneyPerTokenCents = 50,
        createdAt = nowIso(),
      }) => {
        const trimmedName = optionalTrimmed(name);

        if (!trimmedName) {
          return undefined;
        }

        const jar: Jar = {
          id,
          name: trimmedName,
          colorHex,
          milestones: [],
          funMoneyEnabled,
          funMoneyPerTokenCents,
          funMoneyBalanceCents: 0,
          createdAt,
        };

        set((state) => ({
          jars: [...state.jars, jar],
        }));

        return jar;
      },

      updateJar: ({ id, name, colorHex, funMoneyEnabled, funMoneyPerTokenCents }) => {
        const existingJar = get().jars.find((jar) => jar.id === id);

        if (!existingJar) {
          return undefined;
        }

        const trimmedName = name === undefined ? existingJar.name : optionalTrimmed(name);

        if (!trimmedName) {
          return undefined;
        }

        const updatedJar: Jar = {
          ...existingJar,
          name: trimmedName,
          colorHex: colorHex ?? existingJar.colorHex,
          funMoneyEnabled: funMoneyEnabled ?? existingJar.funMoneyEnabled,
          funMoneyPerTokenCents:
            funMoneyPerTokenCents ?? existingJar.funMoneyPerTokenCents,
        };

        set((state) => ({
          jars: state.jars.map((jar) => (jar.id === id ? updatedJar : jar)),
        }));

        return updatedJar;
      },

      archiveJar: (jarId, archivedAt = nowIso()) => {
        set((state) => ({
          jars: state.jars.map((jar) =>
            jar.id === jarId && !jar.archivedAt
              ? {
                  ...jar,
                  archivedAt,
                }
              : jar,
          ),
        }));
      },

      restoreJar: (jarId) => {
        set((state) => ({
          jars: state.jars.map((jar) => {
            if (jar.id !== jarId) {
              return jar;
            }

            const { archivedAt: _archivedAt, ...restoredJar } = jar;
            return restoredJar;
          }),
        }));
      },

      createHabit: ({ id = createUuid(), name, cue, jarId, createdAt = nowIso() }) => {
        const trimmedName = optionalTrimmed(name);
        const trimmedCue = optionalTrimmed(cue);

        if (!trimmedName || !activeJarById(get().jars, jarId)) {
          return undefined;
        }

        const habit: Habit = {
          id,
          name: trimmedName,
          ...(trimmedCue ? { cue: trimmedCue } : {}),
          jarId,
          createdAt,
        };

        set((state) => ({
          habits: [...state.habits, habit],
        }));

        return habit;
      },

      updateHabit: ({ id, name, cue, jarId }) => {
        const existingHabit = get().habits.find((habit) => habit.id === id);

        if (!existingHabit) {
          return undefined;
        }

        const nextJarId = jarId ?? existingHabit.jarId;
        const trimmedName = name === undefined ? existingHabit.name : optionalTrimmed(name);

        if (!trimmedName || !activeJarById(get().jars, nextJarId)) {
          return undefined;
        }

        const trimmedCue = cue === undefined ? existingHabit.cue : optionalTrimmed(cue);
        const updatedHabit: Habit = {
          ...existingHabit,
          name: trimmedName,
          jarId: nextJarId,
          ...(trimmedCue ? { cue: trimmedCue } : {}),
        };

        if (!trimmedCue && 'cue' in updatedHabit) {
          delete updatedHabit.cue;
        }

        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === id ? updatedHabit : habit)),
        }));

        return updatedHabit;
      },

      archiveHabit: (habitId, archivedAt = nowIso()) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === habitId && !habit.archivedAt
              ? {
                  ...habit,
                  archivedAt,
                }
              : habit,
          ),
        }));
      },

      restoreHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== habitId) {
              return habit;
            }

            const { archivedAt: _archivedAt, ...restoredHabit } = habit;
            return restoredHabit;
          }),
        }));
      },

      createReward: ({ id = createUuid(), name, tier, durationMinutes, description }) => {
        const trimmedName = optionalTrimmed(name);
        const trimmedDescription = optionalTrimmed(description);

        if (!trimmedName) {
          return undefined;
        }

        const reward: Reward = {
          id,
          name: trimmedName,
          tier,
          ...(durationMinutes === undefined ? {} : { durationMinutes }),
          ...(trimmedDescription ? { description: trimmedDescription } : {}),
        };

        set((state) => ({
          rewards: [...state.rewards, reward],
        }));

        return reward;
      },

      updateReward: ({ id, name, tier, durationMinutes, description }) => {
        const existingReward = get().rewards.find((reward) => reward.id === id);

        if (!existingReward) {
          return undefined;
        }

        const trimmedName = name === undefined ? existingReward.name : optionalTrimmed(name);

        if (!trimmedName) {
          return undefined;
        }

        const trimmedDescription =
          description === undefined ? existingReward.description : optionalTrimmed(description);
        const updatedReward: Reward = {
          ...existingReward,
          name: trimmedName,
          tier: tier ?? existingReward.tier,
          ...(durationMinutes === undefined
            ? existingReward.durationMinutes === undefined
              ? {}
              : { durationMinutes: existingReward.durationMinutes }
            : { durationMinutes }),
          ...(trimmedDescription ? { description: trimmedDescription } : {}),
        };

        if (!trimmedDescription && 'description' in updatedReward) {
          delete updatedReward.description;
        }

        set((state) => ({
          rewards: state.rewards.map((reward) =>
            reward.id === id ? updatedReward : reward,
          ),
        }));

        return updatedReward;
      },

      archiveReward: (rewardId, archivedAt = nowIso()) => {
        set((state) => ({
          rewards: state.rewards.map((reward) =>
            reward.id === rewardId && !reward.archivedAt
              ? {
                  ...reward,
                  archivedAt,
                }
              : reward,
          ),
        }));
      },

      restoreReward: (rewardId) => {
        set((state) => ({
          rewards: state.rewards.map((reward) => {
            if (reward.id !== rewardId) {
              return reward;
            }

            const { archivedAt: _archivedAt, ...restoredReward } = reward;
            return restoredReward;
          }),
        }));
      },

      acceptNakedRule: (acceptedAt = nowIso()) => {
        set((state) => ({
          settings: {
            ...state.settings,
            nakedRuleAcceptedAt: acceptedAt,
          },
        }));
      },

      createInitialOnboardingSetup: ({
        jarName,
        jarColorHex,
        habitName,
        habitCue,
        rewardName,
        rewardDurationMinutes,
        createdAt = nowIso(),
      }) => {
        const jar: Jar = {
          id: createUuid(),
          name: jarName.trim(),
          colorHex: jarColorHex,
          milestones: [],
          funMoneyEnabled: false,
          funMoneyPerTokenCents: 50,
          funMoneyBalanceCents: 0,
          createdAt,
        };
        const habit: Habit = {
          id: createUuid(),
          name: habitName.trim(),
          ...(habitCue?.trim() ? { cue: habitCue.trim() } : {}),
          jarId: jar.id,
          createdAt,
        };
        const reward: Reward = {
          id: createUuid(),
          name: rewardName.trim(),
          tier: 1,
          durationMinutes: rewardDurationMinutes,
        };

        set((state) => ({
          jars: [...state.jars, jar],
          habits: [...state.habits, habit],
          rewards: [...state.rewards, reward],
        }));

        return { jar, habit, reward };
      },

      logHabitCompletion: ({
        habitId,
        completedAt = nowIso(),
        wasBonusRep = false,
        bonusDiscountApplied,
        tokenSeed,
      }) => {
        const state = get();
        const habit = state.habits.find((candidate) => candidate.id === habitId);

        const habitJar = habit ? state.jars.find((jar) => jar.id === habit.jarId) : undefined;

        if (!habit || habit.archivedAt || habitJar?.archivedAt) {
          const occurredAt = completedAt;
          set((current) => ({
            lastCompletionFeedback: {
              status: 'unknown_habit',
              habitId,
              occurredAt,
              message: habit?.archivedAt ? 'That habit is archived.' : 'That habit could not be found.',
            },
            integrityRuntime: {
              ...current.integrityRuntime,
              warnings: [
                ...current.integrityRuntime.warnings,
                habit?.archivedAt
                  ? `Archived habit completion ignored: ${habitId}`
                  : `Unknown habit completion ignored: ${habitId}`,
              ],
            },
          }));
          return undefined;
        }

        const latestCompletion = latestCompletionForHabit(state.completions, habitId);
        const rateLimitSeconds = state.settings.rateLimitSecondsPerHabit[habitId] ?? 30;
        const rateLimit = evaluateRateLimit(
          latestCompletion?.completedAt,
          completedAt,
          rateLimitSeconds,
        );

        if (!rateLimit.allowed) {
          const occurredAt = completedAt;
          set((current) => ({
            lastCompletionFeedback: {
              status: 'rate_limited',
              habitId,
              occurredAt,
              secondsRemaining: rateLimit.secondsRemaining,
              message: `Wait ${rateLimit.secondsRemaining}s before logging this habit again.`,
            },
            integrityRuntime: {
              ...current.integrityRuntime,
              warnings: [
                ...current.integrityRuntime.warnings,
                `Habit ${habitId} rate-limited for ${rateLimit.secondsRemaining}s.`,
              ],
            },
          }));
          return undefined;
        }

        const existingGoldenCount = state.tokens.filter(
          (token) => token.color === 'gold' && token.state === 'in_inventory',
        ).length;
        const tokenDraw = drawToken({
          ...(tokenSeed === undefined ? {} : { seed: tokenSeed }),
          existingGoldenCount,
        });
        const token: Token = {
          id: createUuid(),
          color: tokenDraw.color,
          earnedAt: completedAt,
          state: 'in_inventory',
          jarId: habit.jarId,
        };
        const completion: HabitCompletion = {
          id: createUuid(),
          habitId,
          completedAt,
          tokenDrawnId: token.id,
          wasBonusRep,
          ...(bonusDiscountApplied === undefined ? {} : { bonusDiscountApplied }),
        };
        const tokenWithCompletion: Token = {
          ...token,
          sourceCompletionId: completion.id,
        };

        set((current) => ({
          currentState: 'INVENTORY_OPEN',
          completions: [...current.completions, completion],
          tokens: [...current.tokens, tokenWithCompletion],
          lastCompletionFeedback: {
            status: 'completed',
            habitId,
            occurredAt: completedAt,
            completionId: completion.id,
            tokenId: tokenWithCompletion.id,
            tokenColor: tokenWithCompletion.color,
            message: `Token drawn: ${tokenWithCompletion.color}.`,
          },
        }));

        return completion;
      },

      prepareSpin: ({
        habitCompletionId,
        cashedInTokenIds = [],
        activatedMaxTier,
        seed,
        startedAt = nowIso(),
      }) => {
        const resolvedSpin: ResolvedSpin = resolveSpin({
          activatedMaxTier,
          ...(seed === undefined ? {} : { seed }),
        });
        const pendingSpin: PendingSpinContext = {
          habitCompletionId,
          cashedInTokenIds,
          activatedMaxTier,
          resolvedSpin,
          startedAt,
        };

        set((state) => ({
          currentState: 'RESOLVING',
          pendingSpin,
          tokens: state.tokens.map((token) =>
            cashedInTokenIds.includes(token.id) ? { ...token, state: 'cashed_in' } : token,
          ),
        }));

        return pendingSpin;
      },

      resolvePreparedSpin: (spinResultId = createUuid()) => {
        const state = get();
        const pendingSpin = state.pendingSpin;

        if (!pendingSpin) {
          return undefined;
        }

        if (pendingSpin.resolvedSpin.rawLandedSlice === 'bonus') {
          const spunAt = nowIso();
          const bonusSpinResult = buildSpinResult(pendingSpin, spinResultId, spunAt);
          const bonusChain: BonusChain = {
            id: createUuid(),
            startedAt: spunAt,
            originatingSpinResultId: bonusSpinResult.id,
            spins: [],
            outcome: 'in_progress',
          };

          set((current) => ({
            currentState: 'BONUS_ROUND',
            spinResults: [...current.spinResults, bonusSpinResult],
            bonusChains: [...current.bonusChains, bonusChain],
            activeBonusChainId: bonusChain.id,
            pendingSpin: undefined,
          }));

          return bonusSpinResult;
        }

        const selection = selectRewardForSpinResult(state.rewards, pendingSpin.resolvedSpin.awardedTier);
        const grantId = selection.reward ? createUuid() : undefined;
        const spinResult = buildSpinResult(
          pendingSpin,
          spinResultId,
          nowIso(),
          selection.reward?.id,
        );
        const grant: RewardGrant | undefined =
          selection.reward && grantId
            ? {
                id: grantId,
                rewardId: selection.reward.id,
                grantedAt: spinResult.spunAt,
                source: 'spin',
                spinResultId: spinResult.id,
                ...(selection.reward.durationMinutes === undefined
                  ? {}
                  : { durationMinutes: selection.reward.durationMinutes }),
              }
            : undefined;
        const session: ActiveRewardSession | undefined =
          grant?.durationMinutes && grant.durationMinutes > 0
            ? {
                rewardGrantId: grant.id,
                expiresAt: addMinutesToIso(grant.grantedAt, grant.durationMinutes),
              }
            : undefined;
        const fallbackWarning =
          selection.strategy === 'fallback_lowest_tier' && selection.reward
            ? `No reward configured for ${pendingSpin.resolvedSpin.awardedTier}; fell back to ${selection.reward.name}.`
            : undefined;
        const noRewardWarning =
          selection.strategy === 'none_available'
            ? `No rewards configured for awarded tier ${pendingSpin.resolvedSpin.awardedTier}.`
            : undefined;
        const nextState = session ? 'REWARD_ACTIVE' : 'REWARD_GRANTED';

        set((state) => ({
          currentState: nextState,
          spinResults: [...state.spinResults, spinResult],
          rewardGrants: grant ? [...state.rewardGrants, grant] : state.rewardGrants,
          activeRewardSession: session,
          pendingSpin: undefined,
          integrityRuntime:
            fallbackWarning || noRewardWarning
              ? {
                  ...state.integrityRuntime,
                  warnings: [
                    ...state.integrityRuntime.warnings,
                    ...(fallbackWarning ? [fallbackWarning] : []),
                    ...(noRewardWarning ? [noRewardWarning] : []),
                  ],
                }
              : state.integrityRuntime,
        }));

        return spinResult;
      },

      startBonusSpin: ({
        seed,
        startedAt = nowIso(),
        bonusSpinId = createUuid(),
      } = {}) => {
        const state = get();
        const activeBonusChain = findActiveBonusChain(state);

        if (!activeBonusChain || activeBonusChain.outcome !== 'in_progress') {
          return undefined;
        }

        if (activeBonusChain.spins.length >= BONUS_CHAIN_MAX) {
          set((current) => ({
            activeBonusChainId: undefined,
            currentState: 'IDLE',
            bonusChains: current.bonusChains.map((chain) =>
              chain.id === activeBonusChain.id
                ? {
                    ...chain,
                    endedAt: startedAt,
                    outcome: 'max_chain',
                  }
                : chain,
            ),
          }));
          return undefined;
        }

        const resolvedAward = resolveBonusAward(seed === undefined ? {} : { seed });
        const bonusSpin: BonusSpin = {
          id: bonusSpinId,
          seed: resolvedAward.seed,
          bonusAwardLanded: resolvedAward.bonusAwardLanded,
          timerStartedAt: startedAt,
          timerExpiresAt: addMinutesToIso(startedAt, BONUS_TIMER_MINUTES),
        };

        set((current) => ({
          currentState: 'BONUS_TIMER_ACTIVE',
          bonusChains: current.bonusChains.map((chain) =>
            chain.id === activeBonusChain.id
              ? {
                  ...chain,
                  spins: [...chain.spins, bonusSpin],
                }
              : chain,
          ),
        }));

        return bonusSpin;
      },

      completeBonusTimer: ({
        habitId,
        completedAt = nowIso(),
        tokenSeed,
        bonusTokenSeed,
        completionId = createUuid(),
        tokenId = createUuid(),
        bonusTokenId = createUuid(),
        rewardGrantId = createUuid(),
      }) => {
        const state = get();
        const activeBonusChain = findActiveBonusChain(state);
        const activeBonusSpin = activeBonusChain ? latestBonusSpin(activeBonusChain) : undefined;

        if (
          !activeBonusChain ||
          activeBonusChain.outcome !== 'in_progress' ||
          !activeBonusSpin ||
          activeBonusSpin.completedCompletionId
        ) {
          return undefined;
        }

        if (isAtOrAfter(completedAt, activeBonusSpin.timerExpiresAt)) {
          get().syncBonusChainState(completedAt);
          return undefined;
        }

        const habit = state.habits.find((candidate) => candidate.id === habitId);

        const habitJar = habit ? state.jars.find((jar) => jar.id === habit.jarId) : undefined;

        if (!habit || habit.archivedAt || habitJar?.archivedAt) {
          set((current) => ({
            lastCompletionFeedback: {
              status: 'unknown_habit',
              habitId,
              occurredAt: completedAt,
              message: habit?.archivedAt ? 'That habit is archived.' : 'That habit could not be found.',
            },
            integrityRuntime: {
              ...current.integrityRuntime,
              warnings: [
                ...current.integrityRuntime.warnings,
                habit?.archivedAt
                  ? `Archived bonus habit completion ignored: ${habitId}`
                  : `Unknown bonus habit completion ignored: ${habitId}`,
              ],
            },
          }));
          return undefined;
        }

        const latestCompletion = latestCompletionForHabit(state.completions, habitId);
        const rateLimitSeconds = state.settings.rateLimitSecondsPerHabit[habitId] ?? 30;
        const rateLimit = evaluateRateLimit(
          latestCompletion?.completedAt,
          completedAt,
          rateLimitSeconds,
        );

        if (!rateLimit.allowed) {
          set((current) => ({
            lastCompletionFeedback: {
              status: 'rate_limited',
              habitId,
              occurredAt: completedAt,
              secondsRemaining: rateLimit.secondsRemaining,
              message: `Wait ${rateLimit.secondsRemaining}s before claiming this bonus.`,
            },
            integrityRuntime: {
              ...current.integrityRuntime,
              warnings: [
                ...current.integrityRuntime.warnings,
                `Bonus habit ${habitId} rate-limited for ${rateLimit.secondsRemaining}s.`,
              ],
            },
          }));
          return undefined;
        }

        const existingGoldenCount = state.tokens.filter(
          (token) => token.color === 'gold' && token.state === 'in_inventory',
        ).length;
        const tokenDraw = drawToken({
          ...(tokenSeed === undefined ? {} : { seed: tokenSeed }),
          existingGoldenCount,
        });
        const bonusDiscountApplied = bonusDiscountPercent(activeBonusSpin.bonusAwardLanded);
        const completion: HabitCompletion = {
          id: completionId,
          habitId,
          completedAt,
          tokenDrawnId: tokenId,
          wasBonusRep: true,
          ...(bonusDiscountApplied === undefined ? {} : { bonusDiscountApplied }),
        };
        const token: Token = {
          id: tokenId,
          color: tokenDraw.color,
          earnedAt: completedAt,
          sourceCompletionId: completion.id,
          state: 'in_inventory',
          jarId: habit.jarId,
        };
        const bonusToken = createBonusToken({
          award: activeBonusSpin.bonusAwardLanded,
          bonusTokenId,
          ...(bonusTokenSeed === undefined ? {} : { bonusTokenSeed }),
          completedAt,
          completionId: completion.id,
          existingGoldenCount: existingGoldenCount + (token.color === 'gold' ? 1 : 0),
          jarId: habit.jarId,
        });
        const shouldContinueChain =
          activeBonusSpin.bonusAwardLanded === 'extra_spin' &&
          activeBonusChain.spins.length < BONUS_CHAIN_MAX;
        const rewardSelection = shouldContinueChain
          ? undefined
          : selectRewardForSpinResult(state.rewards, 1);
        const bonusRewardGrant: RewardGrant | undefined = rewardSelection?.reward
          ? {
              id: rewardGrantId,
              rewardId: rewardSelection.reward.id,
              grantedAt: completedAt,
              source: 'bonus',
              bonusChainId: activeBonusChain.id,
              ...(rewardSelection.reward.durationMinutes === undefined
                ? {}
                : { durationMinutes: rewardSelection.reward.durationMinutes }),
            }
          : undefined;
        const activeRewardSession: ActiveRewardSession | undefined =
          bonusRewardGrant?.durationMinutes && bonusRewardGrant.durationMinutes > 0
            ? {
                rewardGrantId: bonusRewardGrant.id,
                expiresAt: addMinutesToIso(
                  bonusRewardGrant.grantedAt,
                  bonusRewardGrant.durationMinutes,
                ),
              }
            : undefined;
        const completedBonusSpin: BonusSpin = {
          ...activeBonusSpin,
          completedCompletionId: completion.id,
          ...(bonusRewardGrant ? { rewardGrantId: bonusRewardGrant.id } : {}),
          ...(bonusToken ? { grantedTokenId: bonusToken.id } : {}),
        };
        const completedSpins = activeBonusChain.spins.map((spin) =>
          spin.id === activeBonusSpin.id ? completedBonusSpin : spin,
        );
        const completedBonusChain: BonusChain = shouldContinueChain
          ? {
              ...activeBonusChain,
              spins: completedSpins,
            }
          : {
              ...activeBonusChain,
              endedAt: completedAt,
              spins: completedSpins,
              outcome:
                activeBonusSpin.bonusAwardLanded === 'extra_spin' ? 'max_chain' : 'completed',
            };
        const noRewardWarning =
          !shouldContinueChain && !bonusRewardGrant
            ? 'No Tier 1 reward configured for completed bonus chain.'
            : undefined;

        set((current) => ({
          currentState: shouldContinueChain
            ? 'BONUS_ROUND'
            : activeRewardSession
              ? 'REWARD_ACTIVE'
              : bonusRewardGrant
                ? 'REWARD_GRANTED'
                : 'IDLE',
          completions: [...current.completions, completion],
          tokens: [...current.tokens, token, ...(bonusToken ? [bonusToken] : [])],
          rewardGrants: bonusRewardGrant
            ? [...current.rewardGrants, bonusRewardGrant]
            : current.rewardGrants,
          activeRewardSession,
          activeBonusChainId: shouldContinueChain ? activeBonusChain.id : undefined,
          bonusChains: current.bonusChains.map((chain) =>
            chain.id === activeBonusChain.id ? completedBonusChain : chain,
          ),
          lastCompletionFeedback: {
            status: 'completed',
            habitId,
            occurredAt: completedAt,
            completionId: completion.id,
            tokenId: token.id,
            tokenColor: token.color,
            message: bonusToken
              ? `Bonus rep claimed: ${token.color} plus ${bonusToken.color}.`
              : `Bonus rep claimed: ${token.color}.`,
          },
          integrityRuntime: noRewardWarning
            ? {
                ...current.integrityRuntime,
                warnings: [...current.integrityRuntime.warnings, noRewardWarning],
              }
            : current.integrityRuntime,
        }));

        return completion;
      },

      syncBonusChainState: (timestamp = nowIso()) => {
        const activeBonusChain = findActiveBonusChain(get());
        const activeBonusSpin = activeBonusChain ? latestBonusSpin(activeBonusChain) : undefined;

        if (
          !activeBonusChain ||
          activeBonusChain.outcome !== 'in_progress' ||
          !activeBonusSpin ||
          activeBonusSpin.completedCompletionId ||
          !isAtOrAfter(timestamp, activeBonusSpin.timerExpiresAt)
        ) {
          return;
        }

        set((state) => ({
          activeBonusChainId: undefined,
          currentState: 'IDLE',
          bonusChains: state.bonusChains.map((chain) =>
            chain.id === activeBonusChain.id
              ? {
                  ...chain,
                  endedAt: timestamp,
                  outcome: 'timed_out',
                }
              : chain,
          ),
          integrityRuntime: {
            ...state.integrityRuntime,
            warnings: [...state.integrityRuntime.warnings, 'Bonus timer expired.'],
          },
        }));
      },

      grantReward: (grant) => {
        set((state) => ({
          rewardGrants: [...state.rewardGrants, grant],
        }));
      },

      setActiveRewardSession: (session) => {
        set({
          activeRewardSession: session,
          currentState: session ? 'REWARD_ACTIVE' : 'IDLE',
        });
      },

      endActiveRewardSession: (endedAt = nowIso()) => {
        const activeRewardSession = get().activeRewardSession;

        if (!activeRewardSession) {
          return;
        }

        set((state) => ({
          activeRewardSession: undefined,
          currentState: 'IDLE',
          rewardGrants: state.rewardGrants.map((grant) =>
            grant.id === activeRewardSession.rewardGrantId && grant.endedAt === undefined
              ? {
                  ...grant,
                  endedAt,
                }
              : grant,
          ),
        }));
      },

      endRewardSessionEarly: (endedEarlyAt = nowIso()) => {
        const activeRewardSession = get().activeRewardSession;

        if (!activeRewardSession) {
          return;
        }

        set((state) => ({
          activeRewardSession: undefined,
          currentState: 'IDLE',
          rewardGrants: state.rewardGrants.map((grant) =>
            grant.id === activeRewardSession.rewardGrantId && grant.endedEarlyAt === undefined
              ? {
                  ...grant,
                  endedEarlyAt,
                }
              : grant,
          ),
        }));
      },

      syncRewardSessionState: (timestamp = nowIso()) => {
        const activeRewardSession = get().activeRewardSession;

        if (!activeRewardSession) {
          return;
        }

        if (activeRewardSession.expiresAt.localeCompare(timestamp) <= 0) {
          get().endActiveRewardSession(timestamp);
        }
      },

      answerIntegrityCheckIn: (answer, answeredAt = nowIso()) => {
        const answeredYes = answer === 'yes';

        set((state) => ({
          integrityCheckIns: [
            ...state.integrityCheckIns,
            {
              id: createUuid(),
              date: answeredAt.slice(0, 10),
              answer,
              answeredAt,
            },
          ],
          integrityRuntime: {
            ...state.integrityRuntime,
            honestyStreak: answeredYes ? state.integrityRuntime.honestyStreak + 1 : 0,
            honestAdmissionCount: answeredYes
              ? state.integrityRuntime.honestAdmissionCount
              : state.integrityRuntime.honestAdmissionCount + 1,
          },
        }));
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
            rateLimitSecondsPerHabit: {
              ...state.settings.rateLimitSecondsPerHabit,
              ...(settings.rateLimitSecondsPerHabit ?? {}),
            },
          },
        }));
      },

      markAppSeen: (timestamp = nowIso()) => {
        const { clockTamperDetected } = detectClockTamper(
          get().integrityRuntime.lastSeenTimestamp,
          timestamp,
        );

        set((state) => ({
          integrityRuntime: {
            ...state.integrityRuntime,
            lastSeenTimestamp: timestamp,
            clockTamperDetected,
            warnings: clockTamperDetected
              ? [...state.integrityRuntime.warnings, 'Backward clock drift detected.']
              : state.integrityRuntime.warnings,
          },
        }));
      },

      clearCompletionFeedback: () => {
        set({
          lastCompletionFeedback: undefined,
        });
      },

      resetForTests: () => {
        set(createInitialAppState());
      },

      rehydrateFromStorageForTests: () => {
        const persisted = readPersistedJsonForTests<PersistedEnvelope>(APP_STORE_STORAGE_KEY);

        if (persisted?.state) {
          set({
            ...createInitialAppState(),
            ...persisted.state,
          });
        }
      },
    }),
    {
      name: APP_STORE_STORAGE_KEY,
      storage: createJSONStorage(() => appStorage),
      partialize: persistableState,
    },
  ),
);
