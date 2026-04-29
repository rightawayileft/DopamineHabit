import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { Habit, Reward } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface FirstRepHeroProps {
  habit: Habit;
  reward?: Reward | undefined;
  onDone: () => void;
}

export function FirstRepHero({ habit, onDone, reward }: FirstRepHeroProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Card
      style={{
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.primary,
      }}
    >
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: colors.primary,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        }}
      >
        <Text style={{ color: colors.background, fontSize: 13 }}>First rep ready</Text>
      </View>
      <Text variant="display">{habit.name}</Text>
      {habit.cue ? <Text muted>When: {habit.cue}</Text> : null}
      <Text muted>
        Do this once to draw a token. Then spin for{' '}
        {reward
          ? `${reward.durationMinutes ?? 3} minutes of ${reward.name}`
          : 'your first reward'}
        .
      </Text>
      <Button
        disabled={submitted}
        label={submitted ? 'Rep logged' : 'I did the rep'}
        onPress={() => {
          setSubmitted(true);
          onDone();
        }}
      />
    </Card>
  );
}
