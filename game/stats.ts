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
  TokenColor,
} from '@/store/types';
import { toLocalDateKey } from '@/utils/date';

export type StatsRoute = '/' | '/checkin' | '/habits' | '/jars' | '/manage' | '/rewards' | '/spin';
export type StatsTimeframe = '7d' | '30d' | 'all';

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

export interface StatsFilters {
  timeframe: StatsTimeframe;
  habitId?: string;
  jarId?: string;
  todayKey?: string;
}

export interface TrendBucket {
  date: string;
  completionCount: number;
}

export interface CountBucket {
  label: string;
  count: number;
}

export interface CoachingCard {
  title: string;
  message: string;
  route: StatsRoute;
  label: string;
}

export interface ProgressDashboard {
  activeFilterLabel: string;
  filteredCompletionCount: number;
  filteredBonusCompletionCount: number;
  filteredTokenCount: number;
  filteredSpinCount: number;
  filteredRewardGrantCount: number;
  momentumScore: number;
  completionTrend: TrendBucket[];
  tokenColorCounts: CountBucket[];
  spinOutcomeCounts: CountBucket[];
  coachingCards: CoachingCard[];
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

export interface BuildProgressDashboardInput extends BuildStatsSummaryInput {
  filters: StatsFilters;
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

const dateKeyFromIso = (timestamp: string): string => toLocalDateKey(new Date(timestamp));

const subtractDays = (dateKey: string, days: number): string => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - days);

  return toLocalDateKey(date);
};

const timeframeLabel = (timeframe: StatsTimeframe): string => {
  if (timeframe === '7d') {
    return 'last 7 days';
  }

  if (timeframe === '30d') {
    return 'last 30 days';
  }

  return 'all time';
};

const inTimeframe = (timestamp: string, timeframe: StatsTimeframe, todayKey: string): boolean => {
  if (timeframe === 'all') {
    return true;
  }

  const startKey = subtractDays(todayKey, timeframe === '7d' ? 6 : 29);
  const dateKey = dateKeyFromIso(timestamp);

  return dateKey >= startKey && dateKey <= todayKey;
};

const buildTrend = (
  completions: HabitCompletion[],
  todayKey: string,
  dayCount: number,
): TrendBucket[] => {
  const buckets = Array.from({ length: dayCount }, (_, index) => {
    const date = subtractDays(todayKey, dayCount - index - 1);

    return {
      date,
      completionCount: 0,
    };
  });
  const bucketByDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));

  completions.forEach((completion) => {
    const bucket = bucketByDate.get(dateKeyFromIso(completion.completedAt));

    if (bucket) {
      bucket.completionCount += 1;
    }
  });

  return buckets;
};

const countByTokenColor = (tokens: Token[]): CountBucket[] => {
  const colorOrder: TokenColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gold'];
  const counts = tokens.reduce<Record<TokenColor, number>>(
    (accumulator, token) => ({
      ...accumulator,
      [token.color]: accumulator[token.color] + 1,
    }),
    {
      red: 0,
      orange: 0,
      yellow: 0,
      green: 0,
      blue: 0,
      purple: 0,
      gold: 0,
    },
  );

  return colorOrder
    .map((color) => ({ label: color, count: counts[color] }))
    .filter((bucket) => bucket.count > 0);
};

const countSpinOutcomes = (spinResults: SpinResult[]): CountBucket[] => {
  const counts = spinResults.reduce<Record<string, number>>((accumulator, result) => {
    const label =
      result.rawLandedSlice === 'bonus'
        ? 'bonus'
        : result.wasNearMiss
          ? 'near miss'
          : `${result.awardedTier}`;

    accumulator[label] = (accumulator[label] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count);
};

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
      message: 'A reward session is active. Complete it, stop clean, or log a slip before spinning.',
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

export const buildProgressDashboard = ({
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
  filters,
}: BuildProgressDashboardInput): ProgressDashboard => {
  const todayKey = filters.todayKey ?? toLocalDateKey();
  const habit = filters.habitId
    ? habits.find((candidate) => candidate.id === filters.habitId)
    : undefined;
  const jar = filters.jarId ? jars.find((candidate) => candidate.id === filters.jarId) : undefined;
  const activeJarIds = new Set(jars.filter((candidate) => !candidate.archivedAt).map((candidate) => candidate.id));
  const scopedHabitIds = new Set(
    habits
      .filter((candidate) => !candidate.archivedAt && activeJarIds.has(candidate.jarId))
      .filter((candidate) => !filters.habitId || candidate.id === filters.habitId)
      .filter((candidate) => !filters.jarId || candidate.jarId === filters.jarId)
      .map((candidate) => candidate.id),
  );
  const filteredCompletions = completions.filter(
    (completion) =>
      scopedHabitIds.has(completion.habitId) &&
      inTimeframe(completion.completedAt, filters.timeframe, todayKey),
  );
  const filteredCompletionIds = new Set(filteredCompletions.map((completion) => completion.id));
  const filteredTokens = tokens.filter(
    (token) =>
      (!filters.jarId || token.jarId === filters.jarId) &&
      inTimeframe(token.earnedAt, filters.timeframe, todayKey) &&
      (!filters.habitId ||
        (token.sourceCompletionId ? filteredCompletionIds.has(token.sourceCompletionId) : false)),
  );
  const filteredSpinResults = spinResults.filter(
    (spinResult) =>
      filteredCompletionIds.has(spinResult.habitCompletionId) &&
      inTimeframe(spinResult.spunAt, filters.timeframe, todayKey),
  );
  const filteredSpinIds = new Set(filteredSpinResults.map((spinResult) => spinResult.id));
  const filteredRewardGrants = rewardGrants.filter(
    (grant) =>
      inTimeframe(grant.grantedAt, filters.timeframe, todayKey) &&
      (!grant.spinResultId || filteredSpinIds.has(grant.spinResultId)),
  );
  const checkInCompletedToday = integrityCheckIns.some((checkIn) => checkIn.date === todayKey);
  const activeFilterLabel = [
    timeframeLabel(filters.timeframe),
    ...(jar ? [jar.name] : []),
    ...(habit ? [habit.name] : []),
  ].join(' / ');
  const momentumScore =
    filteredCompletions.length +
    filteredTokens.length +
    filteredRewardGrants.length * 2 +
    integrityRuntime.honestyStreak;
  const coachingCards: CoachingCard[] = [];

  if (filteredCompletions.length === 0) {
    coachingCards.push({
      title: 'Start the signal',
      message: 'Log one rep in this view and the trend line wakes up.',
      route: '/',
      label: 'Log a rep',
    });
  } else {
    const topHabitName = mostCompletedHabitName(habits, filteredCompletions);
    coachingCards.push({
      title: 'Momentum is real',
      message: topHabitName
        ? `${topHabitName} is carrying this slice. Consider adding a nearby cue.`
        : 'This slice has real reps behind it. Keep the next one small.',
      route: '/habits',
      label: 'Tune habits',
    });
  }

  if (tokens.filter((token) => token.state === 'in_inventory').length > 0 && !activeRewardSession) {
    coachingCards.push({
      title: 'Reward energy is stored',
      message: 'Inventory tokens are waiting. Spin now or save matching colors for a bigger tier.',
      route: '/spin',
      label: 'Open spin',
    });
  }

  if (!checkInCompletedToday) {
    coachingCards.push({
      title: 'Close the loop gently',
      message: 'One honest check-in turns today into usable data.',
      route: '/checkin',
      label: 'Check in',
    });
  }

  if (rewards.filter((reward) => !reward.archivedAt).length < 3) {
    coachingCards.push({
      title: 'Add reward variety',
      message: 'A few tiered rewards makes the wheel feel less repetitive.',
      route: '/rewards',
      label: 'Add reward',
    });
  }

  return {
    activeFilterLabel,
    filteredCompletionCount: filteredCompletions.length,
    filteredBonusCompletionCount: filteredCompletions.filter((completion) => completion.wasBonusRep).length,
    filteredTokenCount: filteredTokens.length,
    filteredSpinCount: filteredSpinResults.length,
    filteredRewardGrantCount: filteredRewardGrants.length,
    momentumScore,
    completionTrend: buildTrend(filteredCompletions, todayKey, filters.timeframe === '30d' ? 10 : 7),
    tokenColorCounts: countByTokenColor(filteredTokens),
    spinOutcomeCounts: countSpinOutcomes(filteredSpinResults),
    coachingCards: coachingCards.slice(0, 3),
  };
};
