import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View, type DimensionValue } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips, type FilterChipOption } from '@/components/ui/FilterChips';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import {
  buildProgressDashboard,
  buildStatsSummary,
  formatCents,
  type RecentRewardStatus,
  type StatsTimeframe,
} from '@/game/stats';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatLocalDateTime } from '@/utils/dateDisplay';

const timeframes: { id: StatsTimeframe; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All' },
];
const visibleFilterLimit = 8;

const tokenColor = (label: string): string =>
  colors.tokenColors[label as keyof typeof colors.tokenColors] ?? colors.border;

const rewardStatusLabels: Record<RecentRewardStatus['status'], string> = {
  completed: 'Completed',
  stopped: 'Stopped clean',
  slipped: 'Boundary slip logged',
  expired: 'Expired',
  in_progress: 'In progress',
};

const rewardSourceLabels: Record<RecentRewardStatus['source'], string> = {
  bonus: 'Bonus chain',
  spin: 'Wheel spin',
};

const rewardTierLabel = (tier: RecentRewardStatus['tier']): string =>
  tier === 'unknown' ? 'Unknown tier' : `Tier ${tier}`;

export default function StatsScreen() {
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('7d');
  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>(undefined);
  const [selectedJarId, setSelectedJarId] = useState<string | undefined>(undefined);
  const [focusSearchQuery, setFocusSearchQuery] = useState('');
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const habits = useAppStore((state) => state.habits);
  const jars = useAppStore((state) => state.jars);
  const rewards = useAppStore((state) => state.rewards);
  const completions = useAppStore((state) => state.completions);
  const tokens = useAppStore((state) => state.tokens);
  const spinResults = useAppStore((state) => state.spinResults);
  const rewardGrants = useAppStore((state) => state.rewardGrants);
  const activeRewardSession = useAppStore((state) => state.activeRewardSession);
  const integrityCheckIns = useAppStore((state) => state.integrityCheckIns);
  const integrityRuntime = useAppStore((state) => state.integrityRuntime);
  const summary = buildStatsSummary({
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
  });
  const dashboard = buildProgressDashboard({
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
    filters: {
      timeframe,
      ...(selectedHabitId === undefined ? {} : { habitId: selectedHabitId }),
      ...(selectedJarId === undefined ? {} : { jarId: selectedJarId }),
    },
  });
  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const activeJarIds = new Set(activeJars.map((jar) => jar.id));
  const activeHabits = habits.filter(
    (habit) => !habit.archivedAt && activeJarIds.has(habit.jarId),
  );
  const normalizedFocusSearchQuery = focusSearchQuery.trim().toLowerCase();
  const matchesFocusSearch = (value: string): boolean =>
    normalizedFocusSearchQuery.length === 0 ||
    value.toLowerCase().includes(normalizedFocusSearchQuery);
  const visibleJars = activeJars
    .filter((jar) => matchesFocusSearch(jar.name) || jar.id === selectedJarId)
    .slice(0, visibleFilterLimit);
  const visibleHabits = activeHabits
    .filter((habit) => {
      const jar = jars.find((candidate) => candidate.id === habit.jarId);

      return (
        habit.id === selectedHabitId ||
        matchesFocusSearch(habit.name) ||
        matchesFocusSearch(jar?.name ?? '')
      );
    })
    .slice(0, visibleFilterLimit);
  const timeframeOptions: FilterChipOption<StatsTimeframe>[] = timeframes;
  const jarFilterOptions: FilterChipOption<string>[] = [
    { id: 'all', label: 'All jars', detail: `${activeJars.length}` },
    ...visibleJars.map((jar) => ({ id: jar.id, label: jar.name })),
  ];
  const habitFilterOptions: FilterChipOption<string>[] = [
    { id: 'all', label: 'All habits', detail: `${activeHabits.length}` },
    ...visibleHabits.map((habit) => ({ id: habit.id, label: habit.name })),
  ];
  const maxTrendCount = Math.max(
    1,
    ...dashboard.completionTrend.map((bucket) => bucket.completionCount),
  );

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Stats</Text>
        <Text muted>
          Momentum, reward energy, and the next gentle move. Filter it down when you want a
          clearer signal.
        </Text>
      </Card>

      <Card>
        <Text variant="title">Focus</Text>
        <Text muted>{dashboard.activeFilterLabel}</Text>
        <Input
          value={focusSearchQuery}
          onChangeText={setFocusSearchQuery}
          placeholder="Find jar or habit filters"
        />
        <Text muted>
          Showing {visibleJars.length} of {activeJars.length} jars and {visibleHabits.length} of{' '}
          {activeHabits.length} habits.
        </Text>
        <FilterChips
          label="Timeframe"
          options={timeframeOptions}
          selectedId={timeframe}
          onSelect={setTimeframe}
        />
        <FilterChips
          label="Jars"
          options={jarFilterOptions}
          selectedId={selectedJarId ?? 'all'}
          onSelect={(jarId) => {
            const nextJarId = jarId === 'all' ? undefined : jarId;
            const selectedHabit = selectedHabitId
              ? activeHabits.find((habit) => habit.id === selectedHabitId)
              : undefined;

            setSelectedJarId(nextJarId);
            if (nextJarId && selectedHabit && selectedHabit.jarId !== nextJarId) {
              setSelectedHabitId(undefined);
            }
          }}
        />
        <FilterChips
          label="Habits"
          options={habitFilterOptions}
          selectedId={selectedHabitId ?? 'all'}
          onSelect={(habitId) => setSelectedHabitId(habitId === 'all' ? undefined : habitId)}
        />
        {selectedJarId || selectedHabitId || focusSearchQuery ? (
          <Button
            label="Clear focus"
            tone="secondary"
            onPress={() => {
              setSelectedJarId(undefined);
              setSelectedHabitId(undefined);
              setFocusSearchQuery('');
            }}
          />
        ) : null}
      </Card>

      <Card>
        <Text variant="title">Next best action</Text>
        <Text>{summary.nextAction.title}</Text>
        <Text muted>{summary.nextAction.message}</Text>
        <Button
          label={summary.nextAction.label}
          onPress={() => router.push(summary.nextAction.route)}
        />
      </Card>

      <Card>
        <Text variant="title">Momentum score</Text>
        <Text variant="display" style={{ fontVariant: ['tabular-nums'] }}>
          {dashboard.momentumScore}
        </Text>
        <Text muted>
          Reps, tokens, rewards, and honesty streaks all add weight. It is not a grade; it is a
          pulse.
        </Text>
        <Text muted>Reps in focus: {dashboard.filteredCompletionCount}</Text>
        <Text muted>Bonus reps in focus: {dashboard.filteredBonusCompletionCount}</Text>
        <Text muted>Tokens earned in focus: {dashboard.filteredTokenCount}</Text>
      </Card>

      <Card>
        <Text variant="title">Coaching</Text>
        {dashboard.coachingCards.map((card) => (
          <View key={card.title} style={{ gap: spacing.xs }}>
            <Text>{card.title}</Text>
            <Text muted>{card.message}</Text>
            <Button label={card.label} tone="secondary" onPress={() => router.push(card.route)} />
          </View>
        ))}
      </Card>

      <Card>
        <Text variant="title">Rep rhythm</Text>
        <View style={{ gap: spacing.sm }}>
          {dashboard.completionTrend.map((bucket) => {
            const width = `${Math.max(
              8,
              Math.round((bucket.completionCount / maxTrendCount) * 100),
            )}%` as DimensionValue;

            return (
              <View key={bucket.date} style={{ gap: spacing.xs }}>
                <Text muted>
                  {bucket.date}: {bucket.completionCount}
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.pill,
                    height: 10,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: bucket.completionCount > 0 ? colors.success : colors.border,
                      borderRadius: radius.pill,
                      height: 10,
                      width,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="title">Reward energy</Text>
        <Text muted>Spins in focus: {dashboard.filteredSpinCount}</Text>
        <Text muted>Reward grants in focus: {dashboard.filteredRewardGrantCount}</Text>
        {dashboard.tokenColorCounts.length === 0 ? <Text muted>No tokens in this focus yet.</Text> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {dashboard.tokenColorCounts.map((bucket) => (
            <View
              key={bucket.label}
              style={{
                alignItems: 'center',
                backgroundColor: tokenColor(bucket.label),
                borderRadius: radius.sm,
                minWidth: 64,
                padding: spacing.sm,
              }}
            >
              <Text style={{ color: colors.background }}>{bucket.label}</Text>
              <Text style={{ color: colors.background, fontVariant: ['tabular-nums'] }}>
                {bucket.count}
              </Text>
            </View>
          ))}
        </View>
        {dashboard.spinOutcomeCounts.map((bucket) => (
          <Text key={bucket.label} muted>
            {bucket.label}: {bucket.count}
          </Text>
        ))}
      </Card>

      <Card>
        <Text variant="title">Recent rewards</Text>
        {summary.recentRewardStatuses.length === 0 ? (
          <Text muted>No reward grants yet.</Text>
        ) : null}
        {summary.recentRewardStatuses.map((rewardStatus) => (
          <View
            key={rewardStatus.id}
            style={{
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              borderRadius: radius.sm,
              borderWidth: 1,
              gap: spacing.xs,
              padding: spacing.sm,
            }}
          >
            <Text>{rewardStatus.name}</Text>
            <Text muted>
              {rewardStatusLabels[rewardStatus.status]} - granted{' '}
              {formatLocalDateTime(rewardStatus.grantedAt)}
            </Text>
            <Text muted>
              {rewardSourceLabels[rewardStatus.source]} - {rewardTierLabel(rewardStatus.tier)}
              {rewardStatus.durationMinutes ? ` - ${rewardStatus.durationMinutes} min` : ''}
            </Text>
            {rewardStatus.closedAt ? (
              <Text muted>Closed {formatLocalDateTime(rewardStatus.closedAt)}</Text>
            ) : null}
          </View>
        ))}
      </Card>

      <Card>
        <Text variant="title">Loop setup</Text>
        <Text muted>Active habits: {summary.activeHabitCount}</Text>
        <Text muted>Active rewards: {summary.activeRewardCount}</Text>
        <Text muted>Active jars: {summary.activeJarCount}</Text>
        {summary.topHabitName ? <Text muted>Most logged: {summary.topHabitName}</Text> : null}
      </Card>

      <Card>
        <Text variant="title">Totals</Text>
        <Text muted>Total reps: {summary.totalCompletions}</Text>
        <Text muted>Total tokens: {summary.totalTokenCount}</Text>
        <Text muted>Cashed-in tokens: {summary.cashedInTokenCount}</Text>
        <Text muted>Reward grants: {summary.rewardGrantCount}</Text>
        <Text muted>
          Milestones unlocked: {summary.unlockedMilestoneCount}/{summary.totalMilestoneCount}
        </Text>
        <Text muted>Fun money: {formatCents(summary.funMoneyBalanceCents)}</Text>
      </Card>

      <Card>
        <Text variant="title">Integrity</Text>
        <Text muted>Checked in today: {summary.checkInCompletedToday ? 'Yes' : 'No'}</Text>
        <Text muted>Honesty streak: {summary.honestyStreak}</Text>
        <Text muted>Honest admissions: {summary.honestAdmissionCount}</Text>
      </Card>
    </Screen>
  );
}
