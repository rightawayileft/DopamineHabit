import { Redirect, router } from 'expo-router';
import { View } from 'react-native';

import { soundManager } from '@/audio/SoundManager';
import { HabitCard } from '@/components/HabitCard';
import { TokenInventory } from '@/components/TokenInventory';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { playHapticPattern } from '@/haptics/patterns';
import { useAppStore } from '@/store';
import { spacing } from '@/theme/spacing';

export default function HomeScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const habits = useAppStore((state) => state.habits);
  const jars = useAppStore((state) => state.jars);
  const rewards = useAppStore((state) => state.rewards);
  const completions = useAppStore((state) => state.completions);
  const tokens = useAppStore((state) => state.tokens);
  const lastCompletionFeedback = useAppStore((state) => state.lastCompletionFeedback);
  const integrityCheckInTime = useAppStore((state) => state.settings.integrityCheckInTime);
  const hapticsEnabled = useAppStore((state) => state.settings.hapticsEnabled);
  const soundEnabled = useAppStore((state) => state.settings.soundEnabled);
  const logHabitCompletion = useAppStore((state) => state.logHabitCompletion);

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  if (jars.length === 0 || habits.length === 0 || rewards.length === 0) {
    return <Redirect href="/onboarding/step2" />;
  }

  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const activeJarIds = new Set(activeJars.map((jar) => jar.id));
  const activeHabits = habits.filter(
    (habit) => !habit.archivedAt && activeJarIds.has(habit.jarId),
  );
  const activeRewards = rewards.filter((reward) => !reward.archivedAt);
  const firstHabit = activeHabits[0];
  const firstJar = activeJars[0];
  const firstReward = activeRewards[0];
  const inventoryTokens = tokens.filter((token) => token.state === 'in_inventory');

  const completeHabit = (habitId: string) => {
    const completion = logHabitCompletion({ habitId });

    if (!completion) {
      return;
    }

    soundManager.setEnabled(soundEnabled);
    void soundManager.play('habitDone');
    void soundManager.play('tokenDrawn');
    void playHapticPattern('habitDone', hapticsEnabled);
    void playHapticPattern('tokenDrawn', hapticsEnabled);
  };

  return (
    <Screen>
      <Card>
        <Text variant="title">DopamineHabit</Text>
        <Text muted>Complete a habit rep to draw a token.</Text>
      </Card>
      {lastCompletionFeedback ? (
        <Card>
          <Text variant="title">
            {lastCompletionFeedback.status === 'completed' ? 'Token drawn' : 'Not yet'}
          </Text>
          <Text muted>{lastCompletionFeedback.message}</Text>
        </Card>
      ) : null}
      <Card>
        <Text variant="title">Today</Text>
        <View style={{ gap: spacing.sm }}>
          <Text muted>Jar: {firstJar?.name ?? 'No active jar'}</Text>
          <Text muted>
            Tier 1 reward: {firstReward?.name ?? 'No active reward'}
            {firstReward?.durationMinutes ? `, ${firstReward.durationMinutes} min` : ''}
          </Text>
          <Text muted>Integrity check-in: {integrityCheckInTime}</Text>
        </View>
      </Card>
      <Card>
        <Text variant="title">Manage options</Text>
        <Button label="Habits" tone="secondary" onPress={() => router.push('/habits')} />
        <Button label="Rewards" tone="secondary" onPress={() => router.push('/rewards')} />
        <Button label="Jars" tone="secondary" onPress={() => router.push('/jars')} />
        <Button
          label="Integrity"
          tone="secondary"
          onPress={() => router.push('/checkin')}
        />
      </Card>
      <View style={{ gap: spacing.md }}>
        {activeHabits.length === 0 ? (
          <Card>
            <Text variant="title">No active habits</Text>
            <Text muted>Create or restore a habit from Manage options.</Text>
          </Card>
        ) : null}
        {activeHabits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            completionCount={
              completions.filter((completion) => completion.habitId === habit.id).length
            }
            onDone={() => completeHabit(habit.id)}
            onOpen={() =>
              router.push({
                pathname: '/habit/[id]',
                params: { id: habit.id },
              })
            }
          />
        ))}
      </View>
      <Card>
        <Text variant="title">Inventory</Text>
        <TokenInventory tokens={inventoryTokens} />
        {firstHabit ? <Button label="Open spin setup" onPress={() => router.push('/spin')} /> : null}
      </Card>
    </Screen>
  );
}
