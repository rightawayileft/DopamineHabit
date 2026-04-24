import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { buildWheelSlices } from '@/components/Wheel/wheelGeometry';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface WheelProps {
  activeTier: 1 | 2 | 3;
}

export function Wheel({ activeTier }: WheelProps) {
  const slices = buildWheelSlices();

  return (
    <View
      style={{
        alignItems: 'center',
        aspectRatio: 1,
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderRadius: radius.pill,
        borderWidth: 1,
        justifyContent: 'center',
        padding: spacing.lg,
        width: '100%',
      }}
    >
      <Text variant="title">Tier {activeTier}</Text>
      <Text muted>{slices.length} wheel slices</Text>
    </View>
  );
}
