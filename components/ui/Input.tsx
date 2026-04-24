import { TextInput, type TextInputProps } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function Input({ style, placeholderTextColor = colors.textMuted, ...rest }: TextInputProps) {
  return (
    <TextInput
      {...rest}
      placeholderTextColor={placeholderTextColor}
      style={[
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderRadius: radius.sm,
          borderWidth: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        style,
      ]}
    />
  );
}
