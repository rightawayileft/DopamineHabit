import type { IntegrityDisplayInputs } from '@/game/integrity';

export interface ReminderTimeParts {
  hour: number;
  minute: number;
}

export type ReminderPermissionState =
  | 'unknown'
  | 'unsupported'
  | 'disabled'
  | 'needs-permission'
  | 'denied'
  | 'scheduled'
  | 'error';

export interface ReminderStatusCopyInput {
  enabled: boolean;
  time: string;
  permissionState: ReminderPermissionState;
  errorMessage?: string;
}

export interface ReminderStatusCopy {
  title: string;
  message: string;
  actionLabel: string;
}

export const parseReminderTime = (time: string): ReminderTimeParts | undefined => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) {
    return undefined;
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
};

export const formatReminderTime = ({ hour, minute }: ReminderTimeParts): string =>
  `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`;

export const buildReminderStatusCopy = ({
  enabled,
  errorMessage,
  permissionState,
  time,
}: ReminderStatusCopyInput): ReminderStatusCopy => {
  if (!enabled || permissionState === 'disabled') {
    return {
      title: 'Reminder off',
      message: 'Turn it on when you want a gentle daily nudge.',
      actionLabel: 'Enable daily reminder',
    };
  }

  if (permissionState === 'unsupported') {
    return {
      title: 'Reminders unavailable here',
      message: 'This platform cannot schedule local integrity reminders.',
      actionLabel: 'Unavailable',
    };
  }

  if (permissionState === 'needs-permission') {
    return {
      title: 'Permission needed',
      message: 'Allow notifications to schedule the daily integrity check-in.',
      actionLabel: 'Allow reminders',
    };
  }

  if (permissionState === 'denied') {
    return {
      title: 'Permission blocked',
      message: 'Notifications are blocked. You can still check in from Home or Integrity.',
      actionLabel: 'Disabled by system',
    };
  }

  if (permissionState === 'error') {
    return {
      title: 'Reminder needs attention',
      message: errorMessage ?? 'Scheduling failed. Try toggling reminders off and on.',
      actionLabel: 'Try again',
    };
  }

  if (permissionState === 'scheduled') {
    return {
      title: 'Reminder scheduled',
      message: `Daily check-in reminder is set for ${time}.`,
      actionLabel: 'Disable reminder',
    };
  }

  return {
    title: 'Checking reminder status',
    message: 'The app is checking notification support on this device.',
    actionLabel: 'Checking',
  };
};

export const buildIntegrityRecoveryCopy = (
  display: IntegrityDisplayInputs,
): { title: string; message: string } => {
  if (display.todayCheckIn?.answer === 'yes') {
    return {
      title: 'Boundary held',
      message: 'Nice. The reward gate did its job today, and the next loop can stay simple.',
    };
  }

  if (display.todayCheckIn?.answer === 'partially') {
    return {
      title: 'Partial slip logged',
      message: 'That is useful data, not a verdict. Tighten the boundary and keep the next rep tiny.',
    };
  }

  if (display.todayCheckIn?.answer === 'no') {
    return {
      title: 'Repair starts here',
      message: 'You logged the boundary break. The app trusts the signal and clears the way back.',
    };
  }

  if (display.missedYesterday) {
    return {
      title: 'Missed day, usable signal',
      message: 'No shame loop here. Answer today, then make the next reward boundary easier to protect.',
    };
  }

  return {
    title: 'A thirty-second repair ritual',
    message: 'Answer once today. The goal is a trustworthy boundary, not a perfect record.',
  };
};
