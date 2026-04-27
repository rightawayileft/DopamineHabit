import { Redirect, router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { buildStatsSummary, formatCents } from '@/game/stats';
import { useAppStore } from '@/store';

export default function StatsScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const summary = useAppStore((state) =>
    buildStatsSummary({
      habits: state.habits,
      jars: state.jars,
      rewards: state.rewards,
      completions: state.completions,
      tokens: state.tokens,
      spinResults: state.spinResults,
      rewardGrants: state.rewardGrants,
      activeRewardSession: state.activeRewardSession,
      integrityCheckIns: state.integrityCheckIns,
      integrityRuntime: state.integrityRuntime,
    }),
  );

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Stats</Text>
        <Text muted>
          A local-first snapshot of reps, tokens, rewards, milestones, and integrity.
        </Text>
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
        <Text variant="title">Loop setup</Text>
        <Text muted>Active habits: {summary.activeHabitCount}</Text>
        <Text muted>Active rewards: {summary.activeRewardCount}</Text>
        <Text muted>Active jars: {summary.activeJarCount}</Text>
        {summary.topHabitName ? <Text muted>Most logged: {summary.topHabitName}</Text> : null}
      </Card>

      <Card>
        <Text variant="title">Momentum</Text>
        <Text muted>Total reps: {summary.totalCompletions}</Text>
        <Text muted>Bonus reps: {summary.bonusCompletionCount}</Text>
        <Text muted>Total tokens: {summary.totalTokenCount}</Text>
        <Text muted>Inventory tokens: {summary.inventoryTokenCount}</Text>
        <Text muted>Cashed-in tokens: {summary.cashedInTokenCount}</Text>
      </Card>

      <Card>
        <Text variant="title">Rewards and milestones</Text>
        <Text muted>Spins resolved: {summary.spinCount}</Text>
        <Text muted>Reward grants: {summary.rewardGrantCount}</Text>
        <Text muted>Completed reward sessions: {summary.completedRewardGrantCount}</Text>
        <Text muted>Active reward sessions: {summary.activeRewardCountNow}</Text>
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
