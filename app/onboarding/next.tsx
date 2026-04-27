import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { quickHabitTemplates, quickRewardTemplates } from '@/game/firstLoopGuidance';
import { useAppStore } from '@/store';
import type { Reward } from '@/store/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const formatTier = (tier: Reward['tier']): string =>
  tier === 'jackpot' ? 'Jackpot' : `Tier ${tier}`;

export default function OnboardingNextScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const habits = useAppStore((state) => state.habits);
  const jars = useAppStore((state) => state.jars);
  const rewards = useAppStore((state) => state.rewards);
  const createHabit = useAppStore((state) => state.createHabit);
  const createReward = useAppStore((state) => state.createReward);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const activeHabits = habits.filter((habit) => !habit.archivedAt);
  const activeRewards = rewards.filter((reward) => !reward.archivedAt);
  const defaultJarId = activeJars[0]?.id;

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  if (!defaultJarId || activeHabits.length === 0 || activeRewards.length === 0) {
    return <Redirect href="/onboarding/step2" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Your first loop is ready.</Text>
        <Text muted>
          Start the first rep now, or add another habit or reward while setup is still fresh.
        </Text>
        {message ? <Text style={{ color: colors.success }}>{message}</Text> : null}
        <Button label="Start first rep" onPress={() => router.replace('/')} />
        <Button label="Add another habit" tone="secondary" onPress={() => router.push('/habits')} />
        <Button
          label="Add another reward"
          tone="secondary"
          onPress={() => router.push('/rewards')}
        />
        <Button label="Open Manage" tone="secondary" onPress={() => router.push('/manage')} />
      </Card>

      <Card>
        <Text variant="title">Quick add</Text>
        <Text muted>
          Optional templates give the wheel more variety. They are normal options you can edit
          or archive later.
        </Text>
        <View style={{ gap: spacing.sm }}>
          {quickHabitTemplates.slice(0, 2).map((template) => {
            const alreadyAdded = habits.some(
              (habit) => habit.name.toLowerCase() === template.name.toLowerCase(),
            );

            return (
              <Button
                key={template.id}
                disabled={alreadyAdded}
                label={alreadyAdded ? `Added habit: ${template.name}` : `Add habit: ${template.name}`}
                tone="secondary"
                onPress={() => {
                  const habit = createHabit({
                    name: template.name,
                    cue: template.cue,
                    jarId: defaultJarId,
                  });

                  if (habit) {
                    setMessage(`Added habit: ${habit.name}.`);
                  }
                }}
              />
            );
          })}
          {quickRewardTemplates.slice(0, 2).map((template) => {
            const alreadyAdded = rewards.some(
              (reward) => reward.name.toLowerCase() === template.name.toLowerCase(),
            );

            return (
              <Button
                key={template.id}
                disabled={alreadyAdded}
                label={
                  alreadyAdded
                    ? `Added reward: ${template.name}`
                    : `Add ${formatTier(template.tier)} reward: ${template.name}`
                }
                tone="secondary"
                onPress={() => {
                  const reward = createReward({
                    name: template.name,
                    tier: template.tier,
                    durationMinutes: template.durationMinutes,
                    description: template.description,
                  });

                  if (reward) {
                    setMessage(`Added reward: ${reward.name}.`);
                  }
                }}
              />
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="title">What each piece does</Text>
        <Text muted>Jar: the bucket where tokens from related habits collect.</Text>
        <Text muted>Habit: the small rep that earns a token.</Text>
        <Text muted>Reward: the timed session a spin can grant.</Text>
        <Text muted>Token: the earned piece you can save or cash in for better tiers.</Text>
        <Text muted>Spin: the wheel result that turns a rep into a reward or bonus.</Text>
        <Text muted>Bonus: a follow-up challenge that can extend the chain.</Text>
        <Text muted>Integrity: the daily no-shame check-in that keeps the gate honest.</Text>
      </Card>
    </Screen>
  );
}
