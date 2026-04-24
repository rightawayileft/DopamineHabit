import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Token } from '@/store/types';
import { spacing } from '@/theme/spacing';

export interface CashInPanelProps {
  selectedTokens: Token[];
  activatedMaxTier: 1 | 2 | 3;
}

export function CashInPanel({ selectedTokens, activatedMaxTier }: CashInPanelProps) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="title">Cash In</Text>
      <Text muted>
        {selectedTokens.length} selected, Tier {activatedMaxTier} active
      </Text>
    </View>
  );
}
