import { Redirect, router } from 'expo-router';

import { HabitForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppStore } from '@/store';

export default function HabitsScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const habits = useAppStore((state) => state.habits);
  const jars = useAppStore((state) => state.jars);
  const completions = useAppStore((state) => state.completions);
  const createHabit = useAppStore((state) => state.createHabit);
  const archiveHabit = useAppStore((state) => state.archiveHabit);
  const restoreHabit = useAppStore((state) => state.restoreHabit);
  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const activeJarIds = new Set(activeJars.map((jar) => jar.id));
  const activeHabits = habits.filter(
    (habit) => !habit.archivedAt && activeJarIds.has(habit.jarId),
  );
  const unavailableHabits = habits.filter(
    (habit) => !habit.archivedAt && !activeJarIds.has(habit.jarId),
  );
  const archivedHabits = habits.filter((habit) => habit.archivedAt);

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Habits</Text>
        <Text muted>Add options for the daily loop without deleting history.</Text>
      </Card>

      <Card>
        <Text variant="title">Add habit</Text>
        <HabitForm
          activeJars={activeJars}
          submitLabel="Add habit"
          onSubmit={(input) => {
            createHabit(input);
          }}
        />
      </Card>

      {activeHabits.length === 0 ? (
        <Card>
          <Text variant="title">No active habits</Text>
          <Text muted>Create or restore a habit to make the loop playable.</Text>
        </Card>
      ) : null}

      {activeHabits.map((habit) => {
        const jar = jars.find((candidate) => candidate.id === habit.jarId);
        const completionCount = completions.filter(
          (completion) => completion.habitId === habit.id,
        ).length;

        return (
          <Card key={habit.id}>
            <Text variant="title">{habit.name}</Text>
            {habit.cue ? <Text muted>{habit.cue}</Text> : null}
            <Text muted>Jar: {jar?.name ?? 'Unknown jar'}</Text>
            <Text muted>{completionCount} completions logged</Text>
            <Button label="Details" onPress={() => router.push(`/habit/${habit.id}`)} />
            <Button
              label="Archive"
              tone="secondary"
              onPress={() => archiveHabit(habit.id)}
            />
          </Card>
        );
      })}

      {archivedHabits.length > 0 ? (
        <Card>
          <Text variant="title">Archived habits</Text>
          <Text muted>Archived habits stay in completion history.</Text>
        </Card>
      ) : null}

      {archivedHabits.map((habit) => (
        <Card key={habit.id}>
          <Text variant="title">{habit.name}</Text>
          <Text muted>Archived at {habit.archivedAt}</Text>
          <Button label="Restore" tone="secondary" onPress={() => restoreHabit(habit.id)} />
        </Card>
      ))}

      {unavailableHabits.length > 0 ? (
        <Card>
          <Text variant="title">Waiting on jars</Text>
          <Text muted>Restore a linked jar before these habits can be logged.</Text>
        </Card>
      ) : null}

      {unavailableHabits.map((habit) => (
        <Card key={habit.id}>
          <Text variant="title">{habit.name}</Text>
          <Text muted>Linked jar is archived.</Text>
          <Button label="Details" onPress={() => router.push(`/habit/${habit.id}`)} />
        </Card>
      ))}
    </Screen>
  );
}
