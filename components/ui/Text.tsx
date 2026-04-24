import type { PropsWithChildren } from 'react';
import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export interface TextProps extends NativeTextProps {
  variant?: 'body' | 'title' | 'display';
  muted?: boolean;
}

export function Text({
  children,
  variant = 'body',
  muted = false,
  style,
  ...rest
}: PropsWithChildren<TextProps>) {
  const fontSize =
    variant === 'display'
      ? typography.sizes.display
      : variant === 'title'
        ? typography.sizes.xl
        : typography.sizes.base;
  const fontWeight =
    variant === 'body' ? typography.weights.regular : typography.weights.bold;

  return (
    <NativeText
      {...rest}
      style={[
        {
          color: muted ? colors.textMuted : colors.textPrimary,
          fontSize,
          fontWeight,
          lineHeight: Math.round(fontSize * 1.35),
        },
        style,
      ]}
    >
      {children}
    </NativeText>
  );
}
