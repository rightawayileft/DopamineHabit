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
      title: 'Today is sealed',
      message: 'Nice. The loop stays clean when the check-in is honest and simple.',
    };
  }

  if (display.todayCheckIn?.answer === 'partially') {
    return {
      title: 'Truth kept the streak useful',
      message: 'A partial slip is data, not a verdict. Reset the gate and keep going.',
    };
  }

  if (display.todayCheckIn?.answer === 'no') {
    return {
      title: 'Reset without drama',
      message: 'You logged the miss. That honesty is what keeps the app trustworthy.',
    };
  }

  if (display.missedYesterday) {
    return {
      title: 'No shame, just signal',
      message: 'A missed check-in means the ritual needs help. Answer today and restart clean.',
    };
  }

  return {
    title: 'A thirty-second audit',
    message: 'Answer once today. The goal is truth, not perfection.',
  };
};
