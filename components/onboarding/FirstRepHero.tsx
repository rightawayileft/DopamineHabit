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
      tone="hero"
      style={{
        gap: spacing.md,
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
        This is the whole first move. Do it once, get a token, then spin for{' '}
        {reward
          ? `${reward.durationMinutes ?? 3} minutes of ${reward.name}`
          : 'your first reward'}
        .
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {['Do rep', 'Reveal token', 'Spin'].map((label, index) => (
          <View
            key={label}
            style={{
              backgroundColor: index === 0 ? colors.primary : colors.surface,
              borderColor: index === 0 ? colors.primary : colors.border,
              borderRadius: radius.sm,
              borderWidth: 1,
              flexGrow: 1,
              padding: spacing.sm,
            }}
          >
            <Text style={{ color: index === 0 ? colors.background : colors.textMuted }}>
              {index + 1}. {label}
            </Text>
          </View>
        ))}
      </View>
      <Button
        disabled={submitted}
        label={submitted ? 'Rep logged' : 'I did the rep'}
        size="large"
        onPress={() => {
          setSubmitted(true);
          onDone();
        }}
      />
    </Card>
  );
}
