import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function Card({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.sm,
          borderWidth: 1,
          gap: spacing.sm,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
