import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function OnboardingStepOneScreen() {
  const [accepted, setAccepted] = useState(false);
  const acceptNakedRule = useAppStore((state) => state.acceptNakedRule);

  const continueToSetup = () => {
    acceptNakedRule();
    router.replace('/onboarding/step2');
  };

  return (
    <Screen centered>
      <Card>
        <Text variant="display">Put one reward behind one tiny rep.</Text>
        <Text>
          I will let DopamineHabit decide when the reward starts. If I slip, I will come back and
          reset honestly.
        </Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={() => setAccepted((current) => !current)}
          style={{
            alignItems: 'center',
            borderColor: accepted ? colors.primary : colors.border,
            borderRadius: radius.sm,
            borderWidth: 1,
            flexDirection: 'row',
            gap: spacing.sm,
            padding: spacing.md,
          }}
        >
          <View
            style={{
              alignItems: 'center',
              backgroundColor: accepted ? colors.primary : 'transparent',
              borderColor: accepted ? colors.primary : colors.textMuted,
              borderRadius: radius.sm,
              borderWidth: 1,
              height: 24,
              justifyContent: 'center',
              width: 24,
            }}
          >
            <Text style={{ color: colors.background }}>{accepted ? 'X' : ''}</Text>
          </View>
          <Text>I am ready to try one loop.</Text>
        </Pressable>
        <Button disabled={!accepted} label="Continue" onPress={continueToSetup} />
      </Card>
    </Screen>
  );
}
