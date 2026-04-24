import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { Habit } from '@/store/types';
import { spacing } from '@/theme/spacing';

export interface HabitCardProps {
  habit: Habit;
  completionCount?: number;
  onDone?: () => void;
  onOpen?: () => void;
}

export function HabitCard({ habit, completionCount = 0, onDone, onOpen }: HabitCardProps) {
  return (
    <Card>
      <Text variant="title">{habit.name}</Text>
      {habit.cue ? <Text muted>{habit.cue}</Text> : null}
      <Text muted>{completionCount} completions logged</Text>
      <Button label="Done" onPress={onDone} />
      {onOpen ? <Button label="Details" onPress={onOpen} tone="secondary" style={{ marginTop: spacing.xs }} /> : null}
    </Card>
  );
}
