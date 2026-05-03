import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { LoopMap } from '@/components/onboarding/LoopMap';
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
      <Card tone="hero">
        <Text variant="display">Earn the reward first.</Text>
        <Text>
          Pick a tempting reward. Do one tiny pause before it. Then spin to start a short,
          guilt-free reward timer.
        </Text>
        <Text muted>
          It is a self-honesty tool. It will not physically block you; it gives you a clear ritual
          to return to when autopilot takes over.
        </Text>
        <LoopMap activeStep="pause" />
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
          <Text>I understand: this is a self-honesty gate, not a blocker.</Text>
        </Pressable>
        <Button disabled={!accepted} label="Build my first reward loop" size="large" onPress={continueToSetup} />
      </Card>
    </Screen>
  );
}
