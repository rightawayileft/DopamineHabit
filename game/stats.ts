import type {
  ActiveRewardSession,
  Habit,
  HabitCompletion,
  IntegrityCheckIn,
  IntegrityRuntime,
  Jar,
  Reward,
  RewardGrant,
  SpinResult,
  Token,
} from '@/store/types';
import { toLocalDateKey } from '@/utils/date';

export type StatsRoute = '/' | '/checkin' | '/habits' | '/jars' | '/manage' | '/rewards' | '/spin';

export interface NextAction {
  title: string;
  message: string;
  route: StatsRoute;
  label: string;
}

export interface StatsSummary {
  activeHabitCount: number;
  activeRewardCount: number;
  activeJarCount: number;
  totalCompletions: number;
  bonusCompletionCount: number;
  inventoryTokenCount: number;
  cashedInTokenCount: number;
  totalTokenCount: number;
  spinCount: number;
  rewardGrantCount: number;
  completedRewardGrantCount: number;
  activeRewardCountNow: number;
  unlockedMilestoneCount: number;
  totalMilestoneCount: number;
  funMoneyBalanceCents: number;
  topHabitName: string | undefined;
  checkInCompletedToday: boolean;
  honestyStreak: number;
  honestAdmissionCount: number;
  nextAction: NextAction;
}

export interface BuildStatsSummaryInput {
  habits: Habit[];
  jars: Jar[];
  rewards: Reward[];
  completions: HabitCompletion[];
  tokens: Token[];
  spinResults: SpinResult[];
  rewardGrants: RewardGrant[];
  activeRewardSession: ActiveRewardSession | undefined;
  integrityCheckIns: IntegrityCheckIn[];
  integrityRuntime: IntegrityRuntime;
  todayKey?: string;
}

const mostCompletedHabitName = (
  habits: Habit[],
  completions: HabitCompletion[],
): string | undefined => {
  const counts = completions.reduce<Record<string, number>>((accumulator, completion) => {
    accumulator[completion.habitId] = (accumulator[completion.habitId] ?? 0) + 1;
    return accumulator;
  }, {});
  const topHabitId = Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0];

  return topHabitId ? habits.find((habit) => habit.id === topHabitId)?.name : undefined;
};

export const formatCents = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

export const buildStatsSummary = ({
  habits,
  jars,
  rewards,
  completions,
  tokens,
  spinResults,
  rewardGrants,
  activeRewardSession,
  integrityCheckIns,
  integrityRuntime,
  todayKey = toLocalDateKey(),
}: BuildStatsSummaryInput): StatsSummary => {
  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const activeJarIds = new Set(activeJars.map((jar) => jar.id));
  const activeHabits = habits.filter(
    (habit) => !habit.archivedAt && activeJarIds.has(habit.jarId),
  );
  const activeRewards = rewards.filter((reward) => !reward.archivedAt);
  const inventoryTokenCount = tokens.filter((token) => token.state === 'in_inventory').length;
  const cashedInTokenCount = tokens.filter((token) => token.state === 'cashed_in').length;
  const completedRewardGrantCount = rewardGrants.filter(
    (grant) => grant.endedAt || grant.endedEarlyAt,
  ).length;
  const unlockedMilestoneCount = jars.reduce(
    (total, jar) => total + jar.milestones.filter((milestone) => milestone.unlockedAt).length,
    0,
  );
  const totalMilestoneCount = jars.reduce((total, jar) => total + jar.milestones.length, 0);
  const checkInCompletedToday = integrityCheckIns.some((checkIn) => checkIn.date === todayKey);

  let nextAction: NextAction;
  if (activeJars.length === 0) {
    nextAction = {
      title: 'Create a jar',
      message: 'Add a jar before habits can earn tokens.',
      route: '/jars',
      label: 'Add jar',
    };
  } else if (activeHabits.length === 0) {
    nextAction = {
      title: 'Add a habit',
      message: 'Create a habit cue to make the loop playable.',
      route: '/habits',
      label: 'Add habit',
    };
  } else if (activeRewards.length === 0) {
    nextAction = {
      title: 'Add a reward',
      message: 'Create at least one active reward before spinning.',
      route: '/rewards',
      label: 'Add reward',
    };
  } else if (activeRewardSession) {
    nextAction = {
      title: 'Use the active reward',
      message: 'A reward session is already active. Finish or end it before spinning again.',
      route: '/rewards',
      label: 'Open rewards',
    };
  } else if (inventoryTokenCount > 0) {
    nextAction = {
      title: 'Set up a spin',
      message: 'You have inventory tokens. Spin now, or cash in matching tokens for higher tiers.',
      route: '/spin',
      label: 'Open spin',
    };
  } else if (completions.length === 0) {
    nextAction = {
      title: 'Complete the first rep',
      message: 'Log one habit rep to draw the first token.',
      route: '/',
      label: 'Go home',
    };
  } else if (!checkInCompletedToday) {
    nextAction = {
      title: 'Answer today’s check-in',
      message: 'Close the integrity loop once per local day.',
      route: '/checkin',
      label: 'Check in',
    };
  } else {
    nextAction = {
      title: 'Expand the loop',
      message: 'Add another habit, reward, jar, or milestone when the current loop feels stable.',
      route: '/manage',
      label: 'Open manage',
    };
  }

  return {
    activeHabitCount: activeHabits.length,
    activeRewardCount: activeRewards.length,
    activeJarCount: activeJars.length,
    totalCompletions: completions.length,
    bonusCompletionCount: completions.filter((completion) => completion.wasBonusRep).length,
    inventoryTokenCount,
    cashedInTokenCount,
    totalTokenCount: tokens.length,
    spinCount: spinResults.length,
    rewardGrantCount: rewardGrants.length,
    completedRewardGrantCount,
    activeRewardCountNow: activeRewardSession ? 1 : 0,
    unlockedMilestoneCount,
    totalMilestoneCount,
    funMoneyBalanceCents: jars.reduce((total, jar) => total + jar.funMoneyBalanceCents, 0),
    topHabitName: mostCompletedHabitName(habits, completions),
    checkInCompletedToday,
    honestyStreak: integrityRuntime.honestyStreak,
    honestAdmissionCount: integrityRuntime.honestAdmissionCount,
    nextAction,
  };
};
