import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface CardProps extends ViewProps {
  tone?: 'default' | 'hero' | 'success' | 'warning' | 'quiet';
}

const cardToneStyle = (tone: CardProps['tone']) => {
  if (tone === 'hero') {
    return {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.primary,
    };
  }

  if (tone === 'success') {
    return {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.success,
    };
  }

  if (tone === 'warning') {
    return {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.warning,
    };
  }

  if (tone === 'quiet') {
    return {
      backgroundColor: colors.background,
      borderColor: colors.border,
    };
  }

  return {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  };
};

export function Card({
  children,
  style,
  tone = 'default',
  ...rest
}: PropsWithChildren<CardProps>) {
  return (
    <View
      {...rest}
      style={[
        {
          borderRadius: radius.sm,
          borderWidth: 1,
          gap: spacing.sm,
          padding: spacing.md,
        },
        cardToneStyle(tone),
        style,
      ]}
    >
      {children}
    </View>
  );
}
