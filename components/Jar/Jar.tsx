import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Jar as JarModel } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface JarProps {
  jar: JarModel;
  tokenCount: number;
  inventoryTokenCount?: number;
}

export function Jar({ jar, tokenCount, inventoryTokenCount }: JarProps) {
  const unlockedCount = jar.milestones.filter((milestone) => milestone.unlockedAt).length;

  return (
    <View
      style={{
        borderColor: jar.colorHex || colors.primary,
        borderRadius: radius.sm,
        borderWidth: 2,
        gap: spacing.sm,
        padding: spacing.md,
      }}
    >
      <Text variant="title">{jar.name}</Text>
      <Text muted>{tokenCount} tokens earned</Text>
      {inventoryTokenCount === undefined ? null : (
        <Text muted>{inventoryTokenCount} tokens in inventory</Text>
      )}
      <Text muted>
        Milestones: {unlockedCount}/{jar.milestones.length}
      </Text>
      {jar.funMoneyEnabled ? (
        <Text muted>Fun money: ${(jar.funMoneyBalanceCents / 100).toFixed(2)}</Text>
      ) : null}
    </View>
  );
}
