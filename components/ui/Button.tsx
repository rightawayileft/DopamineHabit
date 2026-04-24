import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface ButtonProps extends PressableProps {
  label?: string;
  tone?: 'primary' | 'secondary';
}

export function Button({
  children,
  label,
  style,
  tone = 'primary',
  disabled,
  ...rest
}: PropsWithChildren<ButtonProps>) {
  const backgroundColor = tone === 'primary' ? colors.primary : colors.surfaceElevated;
  const foregroundColor = tone === 'primary' ? colors.background : colors.textPrimary;

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          backgroundColor,
          borderColor: tone === 'primary' ? colors.primary : colors.border,
          borderRadius: radius.sm,
          borderWidth: 1,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
    >
      {children ?? <Text style={{ color: foregroundColor }}>{label}</Text>}
    </Pressable>
  );
}
