import type { PropsWithChildren } from 'react';
import { usePathname } from 'expo-router';
import { ScrollView, View, type ViewStyle } from 'react-native';

import { AppNav } from '@/components/AppNav';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface ScreenProps {
  centered?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, centered = false, style }: PropsWithChildren<ScreenProps>) {
  const pathname = usePathname();
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const showNav = Boolean(nakedRuleAcceptedAt) && !pathname.startsWith('/onboarding');

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
        {showNav ? <AppNav /> : null}
      </View>
    </ScrollView>
  );
}
