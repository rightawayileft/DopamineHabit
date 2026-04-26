import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { soundManager } from '@/audio/SoundManager';
import { HabitForm } from '@/components/management/ManagementForms';
import { TokenInventory } from '@/components/TokenInventory';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { playHapticPattern } from '@/haptics/patterns';
import { useAppStore } from '@/store';
import { spacing } from '@/theme/spacing';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const habits = useAppStore((state) => state.habits);
  const completions = useAppStore((state) => state.completions);
  const tokens = useAppStore((state) => state.tokens);
  const jars = useAppStore((state) => state.jars);
  const lastCompletionFeedback = useAppStore((state) => state.lastCompletionFeedback);
  const hapticsEnabled = useAppStore((state) => state.settings.hapticsEnabled);
  const soundEnabled = useAppStore((state) => state.settings.soundEnabled);
  const logHabitCompletion = useAppStore((state) => state.logHabitCompletion);
  const updateHabit = useAppStore((state) => state.updateHabit);
  const archiveHabit = useAppStore((state) => state.archiveHabit);
  const restoreHabit = useAppStore((state) => state.restoreHabit);

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  const habit = habits.find((candidate) => candidate.id === id);

  if (!habit) {
    return <Redirect href="/" />;
  }

  const jar = jars.find((candidate) => candidate.id === habit.jarId);
  const activeJars = jars.filter((candidate) => !candidate.archivedAt);
  const habitCompletions = completions.filter((completion) => completion.habitId === habit.id);
  const inventoryTokens = tokens.filter(
    (token) => token.jarId === habit.jarId && token.state === 'in_inventory',
  );
  const canCompleteHabit = !habit.archivedAt && !jar?.archivedAt;

  const completeHabit = () => {
    const completion = logHabitCompletion({ habitId: habit.id });

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
        <Text variant="display">{habit.name}</Text>
        {habit.cue ? <Text muted>{habit.cue}</Text> : null}
        <Text muted>Jar: {jar?.name ?? 'Unknown jar'}</Text>
        {habit.archivedAt ? <Text muted>Archived at {habit.archivedAt}</Text> : null}
        <Button disabled={!canCompleteHabit} label="Done" onPress={completeHabit} />
      </Card>
      {lastCompletionFeedback?.habitId === habit.id ? (
        <Card>
          <Text variant="title">
            {lastCompletionFeedback.status === 'completed' ? 'Rep logged' : 'Not yet'}
          </Text>
          <Text muted>{lastCompletionFeedback.message}</Text>
        </Card>
      ) : null}
      <Card>
        <Text variant="title">Edit habit</Text>
        <HabitForm
          activeJars={activeJars}
          initialHabit={habit}
          submitLabel="Save habit"
          onSubmit={(input) => {
            updateHabit({ ...input, id: habit.id });
          }}
        />
      </Card>
      <Card>
        <Text variant="title">Archive state</Text>
        {habit.archivedAt ? (
          <Button label="Restore habit" tone="secondary" onPress={() => restoreHabit(habit.id)} />
        ) : (
          <Button label="Archive habit" tone="secondary" onPress={() => archiveHabit(habit.id)} />
        )}
      </Card>
      <Card>
        <Text variant="title">Inventory for this jar</Text>
        <TokenInventory tokens={inventoryTokens} />
      </Card>
      <Card>
        <Text variant="title">History</Text>
        <View style={{ gap: spacing.sm }}>
          {habitCompletions.length === 0 ? <Text muted>No reps logged yet.</Text> : null}
          {habitCompletions.map((completion) => (
            <Text key={completion.id} muted>
              {new Date(completion.completedAt).toLocaleString()}
            </Text>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
