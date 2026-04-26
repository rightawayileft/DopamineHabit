import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Milestone } from '@/store/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface MilestoneLineProps {
  milestone: Milestone;
  earnedTokenCount: number;
}

export function MilestoneLine({ milestone, earnedTokenCount }: MilestoneLineProps) {
  const remainingTokens = Math.max(milestone.tokenThreshold - earnedTokenCount, 0);
  const status = milestone.unlockedAt
    ? `Unlocked at ${milestone.unlockedAt}`
    : `${remainingTokens} tokens to go`;

  return (
    <View style={{ borderTopColor: colors.primary, borderTopWidth: 1, paddingTop: spacing.sm }}>
      <Text>{milestone.label}</Text>
      <Text muted>{milestone.tokenThreshold} tokens</Text>
      <Text muted>{status}</Text>
    </View>
  );
}
