import type { PropsWithChildren } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface ScreenProps {
  centered?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, centered = false, style }: PropsWithChildren<ScreenProps>) {
  return (
    <ScrollView
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={[
        {
          flexGrow: 1,
          gap: spacing.lg,
          justifyContent: centered ? 'center' : 'flex-start',
          padding: spacing.lg,
        },
        style,
      ]}
    >
      <View style={{ gap: spacing.lg, width: '100%', maxWidth: 680, alignSelf: 'center' }}>
        {children}
      </View>
    </ScrollView>
  );
}
