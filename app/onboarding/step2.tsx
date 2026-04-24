import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const jarColors = ['#46D56E', '#3D9BFF', '#FF9933', '#FF4D5E'];

export default function OnboardingStepTwoScreen() {
  const [jarName, setJarName] = useState('Fitness');
  const [jarColorHex, setJarColorHex] = useState('#46D56E');
  const [habitName, setHabitName] = useState('10 pushups');
  const [habitCue, setHabitCue] = useState('Walking to the kitchen');
  const [rewardName, setRewardName] = useState('Favorite phone game');
  const [durationMinutes, setDurationMinutes] = useState('3');
  const createInitialOnboardingSetup = useAppStore(
    (state) => state.createInitialOnboardingSetup,
  );

  const durationAsNumber = Number(durationMinutes);
  const canContinue =
    jarName.trim().length > 0 &&
    habitName.trim().length > 0 &&
    rewardName.trim().length > 0 &&
    Number.isFinite(durationAsNumber) &&
    durationAsNumber > 0;

  const continueToTimer = () => {
    if (!canContinue) {
      return;
    }

    createInitialOnboardingSetup({
      jarName,
      jarColorHex,
      habitName,
      habitCue,
      rewardName,
      rewardDurationMinutes: durationAsNumber,
    });
    router.replace('/onboarding/step3');
  };

  return (
    <Screen>
      <Card>
        <Text variant="display">Build the first loop.</Text>
        <Text muted>Your first jar, habit, and Tier 1 reward are linked together.</Text>
      </Card>
      <Card>
        <FieldLabel>Jar</FieldLabel>
        <Input value={jarName} onChangeText={setJarName} placeholder="Fitness" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {jarColors.map((colorHex) => (
            <Button
              key={colorHex}
              accessibilityLabel={`Use jar color ${colorHex}`}
              onPress={() => setJarColorHex(colorHex)}
              style={{
                backgroundColor: colorHex,
                borderColor: jarColorHex === colorHex ? colors.textPrimary : colorHex,
                borderRadius: radius.pill,
                height: 40,
                width: 40,
              }}
            />
          ))}
        </View>
      </Card>
      <Card>
        <FieldLabel>Habit</FieldLabel>
        <Input value={habitName} onChangeText={setHabitName} placeholder="10 pushups" />
        <Input
          value={habitCue}
          onChangeText={setHabitCue}
          placeholder="Walking to the kitchen"
        />
      </Card>
      <Card>
        <FieldLabel>Tier 1 Reward</FieldLabel>
        <Input
          value={rewardName}
          onChangeText={setRewardName}
          placeholder="Favorite phone game"
        />
        <Input
          keyboardType="number-pad"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          placeholder="3"
        />
        <Button disabled={!canContinue} label="Continue" onPress={continueToTimer} />
      </Card>
    </Screen>
  );
}
