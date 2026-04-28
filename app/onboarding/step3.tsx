import { router } from 'expo-router';
import { useState } from 'react';

import { LoopProgressRail } from '@/components/onboarding/LoopProgressRail';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppStore } from '@/store';

export default function OnboardingStepThreeScreen() {
  const savedTime = useAppStore((state) => state.settings.integrityCheckInTime);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [checkInTime, setCheckInTime] = useState(savedTime);
  const isValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(checkInTime);

  const finishOnboarding = () => {
    if (!isValidTime) {
      return;
    }

    updateSettings({ integrityCheckInTime: checkInTime });
    router.replace('/onboarding/next');
  };

  const useDefaultTime = () => {
    updateSettings({ integrityCheckInTime: '21:00' });
    router.replace('/onboarding/next');
  };

  return (
    <Screen>
      <Card>
        <LoopProgressRail activeStep="checkin" />
      </Card>
      <Card>
        <Text variant="display">Choose the repair check-in.</Text>
        <Text muted>
          Once a day, DopamineHabit asks whether the gate stayed honest. This is a reset ritual,
          not a grade.
        </Text>
        <Button label="Use 9:00 PM" onPress={useDefaultTime} />
      </Card>
      <Card>
        <Text variant="title">Customize check-in time</Text>
        <Text muted>Use 24-hour local time. You can change this later in Settings.</Text>
        <FieldLabel>Check-in time</FieldLabel>
        <Input
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          onChangeText={setCheckInTime}
          placeholder="21:00"
          value={checkInTime}
        />
        <Button
          disabled={!isValidTime}
          label="Use this time"
          onPress={finishOnboarding}
          tone="secondary"
        />
      </Card>
    </Screen>
  );
}
