import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';

import {
  parseReminderTime,
  type ReminderPermissionState,
} from '@/game/checkInReminder';

export interface CheckInReminderState {
  permissionState: ReminderPermissionState;
  errorMessage?: string;
}

export interface CheckInReminderControls extends CheckInReminderState {
  requestPermission: () => Promise<boolean>;
}

const REMINDER_NOTIFICATION_ID = 'dopaminehabit-integrity-checkin-reminder';

const isWebRuntime = (): boolean => process.env.EXPO_OS === 'web';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Reminder scheduling failed.';

const cancelDailyReminder = async (): Promise<void> => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const hasExistingReminder = scheduledNotifications.some(
    (notification) => notification.identifier === REMINDER_NOTIFICATION_ID,
  );

  if (hasExistingReminder) {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  }
};

const scheduleDailyReminder = async (time: string): Promise<void> => {
  const parsedTime = parseReminderTime(time);

  if (!parsedTime) {
    throw new Error('Use 24-hour time before enabling reminders.');
  }

  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Integrity check-in',
      body: 'A quick honest answer keeps the reward gate useful.',
      data: {
        route: '/checkin',
      },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsedTime.hour,
      minute: parsedTime.minute,
    },
  });
};

export const useCheckInReminder = (
  time: string,
  enabled: boolean,
): CheckInReminderControls => {
  const [state, setState] = useState<CheckInReminderState>({
    permissionState: isWebRuntime() ? 'unsupported' : enabled ? 'unknown' : 'disabled',
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isWebRuntime()) {
      setState({ permissionState: 'unsupported' });
      return false;
    }

    const permission = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: false,
      },
    });
    const nextState: ReminderPermissionState = permission.granted
      ? 'unknown'
      : permission.canAskAgain
        ? 'needs-permission'
        : 'denied';
    setState({ permissionState: nextState });

    return permission.granted;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncReminder = async (): Promise<void> => {
      if (isWebRuntime()) {
        setState({ permissionState: 'unsupported' });
        return;
      }

      if (!enabled) {
        try {
          await cancelDailyReminder();
        } finally {
          if (!cancelled) {
            setState({ permissionState: 'disabled' });
          }
        }
        return;
      }

      try {
        const permission = await Notifications.getPermissionsAsync();

        if (!permission.granted) {
          if (!cancelled) {
            setState({
              permissionState: permission.canAskAgain ? 'needs-permission' : 'denied',
            });
          }
          return;
        }

        await scheduleDailyReminder(time);

        if (!cancelled) {
          setState({ permissionState: 'scheduled' });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            permissionState: 'error',
            errorMessage: errorMessage(error),
          });
        }
      }
    };

    void syncReminder();

    return () => {
      cancelled = true;
    };
  }, [enabled, time]);

  return {
    ...state,
    requestPermission,
  };
};
