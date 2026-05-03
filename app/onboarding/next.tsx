import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { GatePreviewCard } from '@/components/onboarding/GatePreviewCard';
import { LoopMap } from '@/components/onboarding/LoopMap';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { quickHabitTemplates, quickRewardTemplates } from '@/game/firstLoopGuidance';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function OnboardingNextScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const habits = useAppStore((state) => state.habits);
  const jars = useAppStore((state) => state.jars);
  const rewards = useAppStore((state) => state.rewards);
  const createHabit = useAppStore((state) => state.createHabit);
  const createReward = useAppStore((state) => state.createReward);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const activeHabits = habits.filter((habit) => !habit.archivedAt);
  const activeRewards = rewards.filter((reward) => !reward.archivedAt);
  const defaultJarId = activeJars[0]?.id;
  const firstJar = activeJars[0];
  const firstHabit = activeHabits[0];
  const firstReward = activeRewards[0];

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  if (!defaultJarId || activeHabits.length === 0 || activeRewards.length === 0) {
    return <Redirect href="/onboarding/step2" />;
  }

  return (
    <Screen>
      <Card tone="hero">
        <Text variant="display">Start with the rep.</Text>
        <Text muted>
          Your setup is ready. The only thing to do now is the tiny rep. The app will reveal the
          token and send you to the spin next.
        </Text>
        <LoopMap activeStep="pause" compact />
        {message ? <Text style={{ color: colors.success }}>{message}</Text> : null}
        <Button label="Go to my first rep" size="large" onPress={() => router.replace('/')} />
        <Button
          label={showMoreOptions ? 'Hide setup changes' : 'Change this setup'}
          tone="secondary"
          onPress={() => setShowMoreOptions((current) => !current)}
        />
      </Card>
      {firstJar && firstHabit && firstReward ? (
        <GatePreviewCard
          habitCue={firstHabit.cue ?? 'the pull starts'}
          habitName={firstHabit.name}
          jarColorHex={firstJar.colorHex}
          jarName={firstJar.name}
          rewardDurationMinutes={firstReward.durationMinutes ?? 3}
          rewardName={firstReward.name}
        />
      ) : null}

      {showMoreOptions ? (
        <Card>
          <Text variant="title">Quick add</Text>
          <Text muted>
            Add one only if it makes the first day easier. These are normal options you can edit
            later.
          </Text>
          <View style={{ gap: spacing.sm }}>
            {quickHabitTemplates.map((template) => {
              const alreadyAdded = habits.some(
                (habit) => habit.name.toLowerCase() === template.name.toLowerCase(),
              );

              return (
                <Button
                  key={template.id}
                  disabled={alreadyAdded}
                  label={
                    alreadyAdded ? `Added habit: ${template.name}` : `Add habit: ${template.name}`
                  }
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
            {quickRewardTemplates.map((template) => {
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
                      : `Add reward: ${template.name}`
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
          <Button label="Open Manage" tone="secondary" onPress={() => router.push('/manage')} />
        </Card>
      ) : null}
      <Card>
        <Text variant="title">What happens next</Text>
        <Text muted>1. Tap the rep only after you do it.</Text>
        <Text muted>2. A token appears as proof.</Text>
        <Text muted>3. Spin once for the first timed reward.</Text>
      </Card>
    </Screen>
  );
}
