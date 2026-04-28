import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { LoopProgressRail } from '@/components/onboarding/LoopProgressRail';
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
    <Screen>
      <Card>
        <LoopProgressRail activeStep="rule" />
      </Card>
      <Card>
        <Text variant="display">Try one gated reward loop.</Text>
        <Text>
          DopamineHabit is a self-honesty gate. It helps you pause, do one small effort, and earn
          a timed reward without pretending the app can physically block you.
        </Text>
        <Text muted>
          If the boundary breaks, you come back and reset without shame. The goal is a clean loop,
          not perfect behavior.
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
          <Text>I want to try one loop.</Text>
        </Pressable>
        <Button disabled={!accepted} label="Build my first gate" onPress={continueToSetup} />
      </Card>
    </Screen>
  );
}
