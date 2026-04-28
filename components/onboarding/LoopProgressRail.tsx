import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type LoopProgressStep = 'rule' | 'setup' | 'rep' | 'token' | 'spin' | 'reward' | 'checkin';

export interface LoopProgressRailProps {
  activeStep: LoopProgressStep;
}

const steps: { id: LoopProgressStep; label: string }[] = [
  { id: 'rule', label: 'Rule' },
  { id: 'setup', label: 'Setup' },
  { id: 'rep', label: 'Rep' },
  { id: 'token', label: 'Token' },
  { id: 'spin', label: 'Spin' },
  { id: 'reward', label: 'Reward' },
  { id: 'checkin', label: 'Reset' },
];

export function LoopProgressRail({ activeStep }: LoopProgressRailProps) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {steps.map((step, index) => {
          const complete = activeIndex > index;
          const active = activeIndex === index;

          return (
            <View
              key={step.id}
              style={{
                alignItems: 'center',
                backgroundColor: active
                  ? colors.primary
                  : complete
                    ? colors.success
                    : colors.surfaceElevated,
                borderColor: active || complete ? 'transparent' : colors.border,
                borderRadius: radius.pill,
                borderWidth: 1,
                minHeight: 36,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: active || complete ? colors.background : colors.textMuted,
                  fontSize: 13,
                }}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text muted>Build one small gate at a time.</Text>
    </View>
  );
}
