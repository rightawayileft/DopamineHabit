import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { HabitForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmActionButton } from '@/components/ui/ConfirmActionButton';
import { FilterChips, type FilterChipOption } from '@/components/ui/FilterChips';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { quickHabitTemplates } from '@/game/firstLoopGuidance';
import { useAppStore } from '@/store';
import type { Habit } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatLocalDateTime } from '@/utils/dateDisplay';

type HabitView = 'active' | 'waiting' | 'archived' | 'all';

const habitViewOptions: FilterChipOption<HabitView>[] = [
  { id: 'active', label: 'Active' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
];

export default function HabitsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [habitView, setHabitView] = useState<HabitView>('active');
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
  const defaultJarId = activeJars[0]?.id;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (habit: Habit): boolean => {
    const jar = jars.find((candidate) => candidate.id === habit.jarId);
    const searchable = [habit.name, habit.cue ?? '', jar?.name ?? ''].join(' ').toLowerCase();

    return normalizedSearchQuery.length === 0 || searchable.includes(normalizedSearchQuery);
  };
  const visibleActiveHabits = activeHabits.filter(matchesSearch);
  const visibleUnavailableHabits = unavailableHabits.filter(matchesSearch);
  const visibleArchivedHabits = archivedHabits.filter(matchesSearch);
  const shouldShowActive = habitView === 'active' || habitView === 'all';
  const shouldShowWaiting = habitView === 'waiting' || habitView === 'all';
  const shouldShowArchived = habitView === 'archived' || habitView === 'all';
  const habitRow = (habit: Habit, status: 'active' | 'waiting' | 'archived') => {
    const jar = jars.find((candidate) => candidate.id === habit.jarId);
    const completionCount = completions.filter((completion) => completion.habitId === habit.id)
      .length;

    return (
      <View
        key={`${status}-${habit.id}`}
        style={{
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderRadius: radius.sm,
          borderWidth: 1,
          gap: spacing.xs,
          padding: spacing.sm,
        }}
      >
        <Text>{habit.name}</Text>
        {habit.cue ? <Text muted>{habit.cue}</Text> : null}
        <Text muted>Jar: {jar?.name ?? 'Unknown jar'}</Text>
        <Text muted>{completionCount} completions logged</Text>
        {status === 'archived' ? (
          <Text muted>Archived {formatLocalDateTime(habit.archivedAt)}</Text>
        ) : null}
        {status === 'waiting' ? <Text muted>Linked jar is archived.</Text> : null}
        <Button label="Details" tone="secondary" onPress={() => router.push(`/habit/${habit.id}`)} />
        {status === 'active' ? (
          <ConfirmActionButton
            label="Archive"
            confirmLabel="Confirm archive habit"
            message="This pauses new reps for the habit but keeps its history."
            onConfirm={() => archiveHabit(habit.id)}
          />
        ) : null}
        {status === 'archived' ? (
          <Button label="Restore" tone="secondary" onPress={() => restoreHabit(habit.id)} />
        ) : null}
      </View>
    );
  };

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
        <Text variant="title">Find habits</Text>
        <Input value={searchQuery} onChangeText={setSearchQuery} placeholder="Search name, cue, or jar" />
        <FilterChips
          options={habitViewOptions}
          selectedId={habitView}
          onSelect={setHabitView}
        />
        <Text muted>
          Showing {visibleActiveHabits.length} active, {visibleUnavailableHabits.length} waiting,{' '}
          {visibleArchivedHabits.length} archived.
        </Text>
      </Card>

      <Card>
        <Text variant="title">Add habit</Text>
        <Text muted>
          A habit is the small rep that earns a token. Connect it to a jar so the token has
          somewhere to land.
        </Text>
        <HabitForm
          activeJars={activeJars}
          submitLabel="Add habit"
          onSubmit={(input) => {
            createHabit(input);
          }}
        />
      </Card>
      {defaultJarId ? (
        <Card>
          <Text variant="title">Quick habit templates</Text>
          <Text muted>Use a starter cue now, then edit the wording whenever it fits better.</Text>
          <View style={{ gap: spacing.sm }}>
            {quickHabitTemplates.map((template) => {
              const alreadyAdded = habits.some(
                (habit) => habit.name.toLowerCase() === template.name.toLowerCase(),
              );

              return (
                <Button
                  key={template.id}
                  disabled={alreadyAdded}
                  label={alreadyAdded ? `Added: ${template.name}` : `Add: ${template.name}`}
                  tone="secondary"
                  onPress={() =>
                    createHabit({
                      name: template.name,
                      cue: template.cue,
                      jarId: defaultJarId,
                    })
                  }
                />
              );
            })}
          </View>
        </Card>
      ) : null}

      {shouldShowActive && visibleActiveHabits.length === 0 ? (
        <Card>
          <Text variant="title">No active matches</Text>
          <Text muted>Create, restore, or clear search to see active habits.</Text>
        </Card>
      ) : null}

      {shouldShowActive && visibleActiveHabits.length > 0 ? (
        <Card>
          <Text variant="title">Active habits</Text>
          {visibleActiveHabits.map((habit) => habitRow(habit, 'active'))}
        </Card>
      ) : null}

      {shouldShowArchived && visibleArchivedHabits.length > 0 ? (
        <Card>
          <Text variant="title">Archived habits</Text>
          <Text muted>Archived habits stay in completion history.</Text>
          {visibleArchivedHabits.map((habit) => habitRow(habit, 'archived'))}
        </Card>
      ) : null}

      {shouldShowWaiting && visibleUnavailableHabits.length > 0 ? (
        <Card>
          <Text variant="title">Waiting on jars</Text>
          <Text muted>Restore a linked jar before these habits can be logged.</Text>
          {visibleUnavailableHabits.map((habit) => habitRow(habit, 'waiting'))}
        </Card>
      ) : null}
    </Screen>
  );
}
