import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { detectClockTamper, evaluateRateLimit } from '@/game/integrity';
import { resolveSpin, type ResolvedSpin } from '@/game/probabilities';
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
import { nowIso } from '@/utils/date';
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
  acceptNakedRule: (acceptedAt?: ISODate) => void;
  createInitialOnboardingSetup: (input: InitialOnboardingSetupInput) => {
    jar: Jar;
    habit: Habit;
    reward: Reward;
  };
  logHabitCompletion: (input: LogHabitCompletionInput) => HabitCompletion | undefined;
  prepareSpin: (input: PrepareSpinInput) => PendingSpinContext | undefined;
  resolvePreparedSpin: (spinResultId?: UUID) => SpinResult | undefined;
  grantReward: (grant: RewardGrant) => void;
  setActiveRewardSession: (session: ActiveRewardSession | undefined) => void;
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
): SpinResult => ({
  id,
  spunAt,
  habitCompletionId: pendingSpin.habitCompletionId,
  cashedInTokenIds: pendingSpin.cashedInTokenIds,
  activatedMaxTier: pendingSpin.activatedMaxTier,
  rawLandedSlice: pendingSpin.resolvedSpin.rawLandedSlice,
  awardedTier: pendingSpin.resolvedSpin.awardedTier,
  wasNearMiss: pendingSpin.resolvedSpin.wasNearMiss,
  seed: pendingSpin.resolvedSpin.seed,
});

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

        if (!habit) {
          const occurredAt = completedAt;
          set((current) => ({
            lastCompletionFeedback: {
              status: 'unknown_habit',
              habitId,
              occurredAt,
              message: 'That habit could not be found.',
            },
            integrityRuntime: {
              ...current.integrityRuntime,
              warnings: [
                ...current.integrityRuntime.warnings,
                `Unknown habit completion ignored: ${habitId}`,
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
        const pendingSpin = get().pendingSpin;

        if (!pendingSpin) {
          return undefined;
        }

        const spinResult = buildSpinResult(pendingSpin, spinResultId, nowIso());
        const nextState = spinResult.rawLandedSlice === 'bonus' ? 'BONUS_ROUND' : 'REWARD_GRANTED';

        set((state) => ({
          currentState: nextState,
          spinResults: [...state.spinResults, spinResult],
          pendingSpin: undefined,
        }));

        return spinResult;
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
