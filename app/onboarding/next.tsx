import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { GatePreviewCard } from '@/components/onboarding/GatePreviewCard';
import { LoopProgressRail } from '@/components/onboarding/LoopProgressRail';
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
      <Card>
        <LoopProgressRail activeStep="rep" />
      </Card>
      <Card>
        <Text variant="display">Launch the first loop.</Text>
        <Text muted>
          Do the rep, earn the token, then spin. Extra setup can wait until the loop feels real.
        </Text>
        {message ? <Text style={{ color: colors.success }}>{message}</Text> : null}
        <Button label="Do first rep" onPress={() => router.replace('/')} />
        <Button
          label={showMoreOptions ? 'Hide extra setup' : 'Customize more first'}
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
        <Text variant="title">What is about to happen</Text>
        <Text muted>The rep is the pause.</Text>
        <Text muted>The token is proof that you paused.</Text>
        <Text muted>The spin keeps the reward from being instant.</Text>
      </Card>
    </Screen>
  );
}
