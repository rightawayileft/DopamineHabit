import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  const markAppSeen = useAppStore((state) => state.markAppSeen);

  useEffect(() => {
    markAppSeen();
  }, [markAppSeen]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.textPrimary,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
