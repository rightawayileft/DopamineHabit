import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface ButtonProps extends PressableProps {
  label?: string;
  size?: 'default' | 'compact' | 'large';
  tone?: 'primary' | 'secondary';
}

export function Button({
  children,
  label,
  size = 'default',
  style,
  tone = 'primary',
  disabled,
  accessibilityState,
  ...rest
}: PropsWithChildren<ButtonProps>) {
  const backgroundColor = tone === 'primary' ? colors.primary : colors.surfaceElevated;
  const foregroundColor = tone === 'primary' ? colors.background : colors.textPrimary;
  const minHeight = size === 'large' ? 56 : size === 'compact' ? 36 : 44;
  const paddingVertical = size === 'large' ? spacing.md : size === 'compact' ? spacing.xs : spacing.sm;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          backgroundColor,
          borderColor: tone === 'primary' ? colors.primary : colors.border,
          borderRadius: radius.sm,
          borderWidth: 1,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          minHeight,
          paddingHorizontal: spacing.md,
          paddingVertical,
        },
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
    >
      {children ?? <Text style={{ color: foregroundColor }}>{label}</Text>}
    </Pressable>
  );
}
