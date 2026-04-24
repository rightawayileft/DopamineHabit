import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme/spacing';

export function FieldLabel({ children }: PropsWithChildren) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text muted>{children}</Text>
    </View>
  );
}
