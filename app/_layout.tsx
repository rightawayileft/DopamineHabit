import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useCheckInReminder } from '@/hooks/useCheckInReminder';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  const checkInReminderEnabled = useAppStore(
    (state) => state.settings.checkInReminderEnabled,
  );
  const integrityCheckInTime = useAppStore((state) => state.settings.integrityCheckInTime);
  const markAppSeen = useAppStore((state) => state.markAppSeen);
  useCheckInReminder(integrityCheckInTime, checkInReminderEnabled);

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
