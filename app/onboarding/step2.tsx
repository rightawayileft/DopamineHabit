import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { GatePreviewCard } from '@/components/onboarding/GatePreviewCard';
import { LoopMap } from '@/components/onboarding/LoopMap';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import {
  starterLoopBundles,
  type StarterLoopBundle,
} from '@/game/firstLoopGuidance';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const jarColors = ['#46D56E', '#3D9BFF', '#FF9933', '#FF4D5E'];
const durationPresets = [
  { label: 'Tiny', value: '3' },
  { label: 'Steady', value: '7' },
  { label: 'Long', value: '12' },
];

export default function OnboardingStepTwoScreen() {
  const defaultBundle = starterLoopBundles[0] as StarterLoopBundle;
  const [selectedBundleId, setSelectedBundleId] = useState(defaultBundle.id);
  const [jarName, setJarName] = useState(defaultBundle.jarName);
  const [jarColorHex, setJarColorHex] = useState(defaultBundle.jarColorHex);
  const [habitName, setHabitName] = useState(defaultBundle.habitName);
  const [habitCue, setHabitCue] = useState(defaultBundle.habitCue);
  const [rewardName, setRewardName] = useState(defaultBundle.rewardName);
  const [durationMinutes, setDurationMinutes] = useState(
    String(defaultBundle.rewardDurationMinutes),
  );
  const [rewardDescription, setRewardDescription] = useState(defaultBundle.rewardDescription);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const createInitialOnboardingSetup = useAppStore(
    (state) => state.createInitialOnboardingSetup,
  );

  const applyBundle = (bundle: StarterLoopBundle) => {
    setSelectedBundleId(bundle.id);
    setJarName(bundle.jarName);
    setJarColorHex(bundle.jarColorHex);
    setHabitName(bundle.habitName);
    setHabitCue(bundle.habitCue);
    setRewardName(bundle.rewardName);
    setDurationMinutes(String(bundle.rewardDurationMinutes));
    setRewardDescription(bundle.rewardDescription);
  };

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
      rewardDescription,
    });
    router.replace('/onboarding/next');
  };

  return (
    <Screen>
      <Card tone="hero">
        <Text variant="display">Make your first trade.</Text>
        <Text muted>
          Fill in one sentence: I want a reward after I do one tiny action.
        </Text>
        <LoopMap activeStep="pause" compact />
      </Card>
      <Card>
        <Text variant="title">Start with a ready-made loop</Text>
        <Text muted>One tap fills the form. You can edit every word below.</Text>
        <View style={{ gap: spacing.sm }}>
          {starterLoopBundles.map((bundle) => {
            const selected = selectedBundleId === bundle.id;

            return (
              <Button
                key={bundle.id}
                accessibilityState={{ selected }}
                label={`${selected ? 'Selected' : 'Use'}: ${bundle.label} - ${bundle.summary}`}
                onPress={() => applyBundle(bundle)}
                tone={selected ? 'primary' : 'secondary'}
              />
            );
          })}
        </View>
      </Card>
      <GatePreviewCard
        habitCue={habitCue}
        habitName={habitName}
        jarColorHex={jarColorHex}
        jarName={jarName}
        rewardDurationMinutes={durationMinutes}
        rewardName={rewardName}
      />
      <Card>
        <Text variant="title">First trade</Text>
        <Text muted>Keep it small. You can customize more after the first reward pays off.</Text>
        <FieldLabel>Reward</FieldLabel>
        <Input
          value={rewardName}
          onChangeText={(nextRewardName) => {
            setRewardName(nextRewardName);
            setSelectedBundleId('custom');
          }}
          placeholder="Short scroll break"
        />
        <FieldLabel>After I do</FieldLabel>
        <Input
          value={habitName}
          onChangeText={(nextHabitName) => {
            setHabitName(nextHabitName);
            setSelectedBundleId('custom');
          }}
          placeholder="Five slow breaths"
        />
        <FieldLabel>When</FieldLabel>
        <Input
          value={habitCue}
          onChangeText={(nextCue) => {
            setHabitCue(nextCue);
            setSelectedBundleId('custom');
          }}
          placeholder="When I reach for my phone"
        />
        <FieldLabel>Minutes</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {durationPresets.map((preset) => {
            const selected = durationMinutes === preset.value;

            return (
              <Button
                key={preset.value}
                accessibilityState={{ selected }}
                label={`${preset.label}: ${preset.value}`}
                onPress={() => {
                  setDurationMinutes(preset.value);
                  setSelectedBundleId('custom');
                }}
                tone={selected ? 'primary' : 'secondary'}
              />
            );
          })}
        </View>
        <Input
          keyboardType="number-pad"
          value={durationMinutes}
          onChangeText={(nextDuration) => {
            setDurationMinutes(nextDuration);
            setSelectedBundleId('custom');
          }}
          placeholder="3"
        />
        <Button disabled={!canContinue} label="Start this loop" size="large" onPress={continueToTimer} />
        <Button
          label={showAdvanced ? 'Hide token jar settings' : 'Change token jar settings'}
          tone="secondary"
          onPress={() => setShowAdvanced((current) => !current)}
        />
      </Card>
      {showAdvanced ? (
        <Card>
          <Text variant="title">Token jar</Text>
          <Text muted>Tokens from this starter loop collect here. The default is fine.</Text>
          <FieldLabel>Jar name</FieldLabel>
          <Input
            value={jarName}
            onChangeText={(nextJarName) => {
              setJarName(nextJarName);
              setSelectedBundleId('custom');
            }}
            placeholder="Fitness"
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {jarColors.map((colorHex) => (
              <Button
                key={colorHex}
                accessibilityLabel={`Use jar color ${colorHex}`}
                onPress={() => {
                  setJarColorHex(colorHex);
                  setSelectedBundleId('custom');
                }}
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
      ) : null}
    </Screen>
  );
}
