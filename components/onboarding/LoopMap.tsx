import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type LoopMapStep = 'pause' | 'token' | 'spin' | 'reward' | 'reset';

export interface LoopMapProps {
  activeStep: LoopMapStep;
  compact?: boolean;
  includeReset?: boolean;
}

const loopSteps: { id: LoopMapStep; label: string; detail: string }[] = [
  { id: 'pause', label: 'Pause', detail: 'Do one tiny rep' },
  { id: 'token', label: 'Token', detail: 'Proof appears' },
  { id: 'spin', label: 'Spin', detail: 'Reward is gated' },
  { id: 'reward', label: 'Reward', detail: 'Timer protects it' },
  { id: 'reset', label: 'Reset', detail: 'Check in gently' },
];

export function LoopMap({ activeStep, compact = false, includeReset = false }: LoopMapProps) {
  const visibleSteps = includeReset
    ? loopSteps
    : loopSteps.filter((step) => step.id !== 'reset');
  const activeIndex = visibleSteps.findIndex((step) => step.id === activeStep);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {visibleSteps.map((step, index) => {
          const active = step.id === activeStep;
          const complete = activeIndex > index;

          return (
            <View
              key={step.id}
              style={{
                backgroundColor: active
                  ? colors.primary
                  : complete
                    ? colors.success
                    : colors.surfaceElevated,
                borderColor: active || complete ? 'transparent' : colors.border,
                borderRadius: radius.sm,
                borderWidth: 1,
                flexBasis: compact ? 92 : 120,
                flexGrow: 1,
                gap: spacing.xs,
                minHeight: compact ? 64 : 82,
                padding: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: active || complete ? colors.background : colors.textPrimary,
                  fontSize: compact ? 14 : 16,
                }}
              >
                {index + 1}. {step.label}
              </Text>
              <Text
                style={{
                  color: active || complete ? colors.background : colors.textMuted,
                  fontSize: 12,
                }}
              >
                {step.detail}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
