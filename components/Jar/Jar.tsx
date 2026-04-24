import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Jar as JarModel } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface JarProps {
  jar: JarModel;
  tokenCount: number;
}

export function Jar({ jar, tokenCount }: JarProps) {
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
    </View>
  );
}
