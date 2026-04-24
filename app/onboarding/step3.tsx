import { router } from 'expo-router';
import { useState } from 'react';

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
    router.replace('/');
  };

  return (
    <Screen centered>
      <Card>
        <Text variant="display">Set the daily check-in.</Text>
        <Text muted>Default is 21:00 local time.</Text>
        <FieldLabel>Check-in time</FieldLabel>
        <Input
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          onChangeText={setCheckInTime}
          placeholder="21:00"
          value={checkInTime}
        />
        <Button disabled={!isValidTime} label="Finish setup" onPress={finishOnboarding} />
      </Card>
    </Screen>
  );
}
