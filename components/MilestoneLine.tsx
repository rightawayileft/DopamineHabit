import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Milestone } from '@/store/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface MilestoneLineProps {
  milestone: Milestone;
}

export function MilestoneLine({ milestone }: MilestoneLineProps) {
  return (
    <View style={{ borderTopColor: colors.primary, borderTopWidth: 1, paddingTop: spacing.sm }}>
      <Text>{milestone.label}</Text>
      <Text muted>{milestone.tokenThreshold} tokens</Text>
    </View>
  );
}
