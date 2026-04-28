import {
  buildIntegrityRecoveryCopy,
  buildReminderStatusCopy,
  formatReminderTime,
  parseReminderTime,
} from '@/game/checkInReminder';

describe('check-in reminder guidance', () => {
  it('parses and formats 24-hour reminder times', () => {
    expect(parseReminderTime('21:05')).toEqual({ hour: 21, minute: 5 });
    expect(formatReminderTime({ hour: 7, minute: 3 })).toBe('07:03');
    expect(parseReminderTime('24:00')).toBeUndefined();
    expect(parseReminderTime('9:00')).toBeUndefined();
  });

  it('builds user-facing reminder status copy', () => {
    expect(
      buildReminderStatusCopy({
        enabled: false,
        time: '21:00',
        permissionState: 'disabled',
      }),
    ).toMatchObject({
      title: 'Reminder off',
      actionLabel: 'Enable daily reminder',
    });

    expect(
      buildReminderStatusCopy({
        enabled: true,
        time: '20:30',
        permissionState: 'scheduled',
      }),
    ).toMatchObject({
      title: 'Reminder scheduled',
      message: 'Daily check-in reminder is set for 20:30.',
      actionLabel: 'Disable reminder',
    });
  });

  it('keeps integrity recovery copy no-shame', () => {
    const copy = buildIntegrityRecoveryCopy({
      todayKey: '2026-04-27',
      yesterdayKey: '2026-04-26',
      todayCheckIn: undefined,
      latestCheckIn: undefined,
      missedYesterday: true,
      warningMessages: [],
    });

    expect(copy).toMatchObject({
      title: 'No shame, just signal',
      message: 'A missed check-in means the ritual needs help. Answer today and restart clean.',
    });

    expect(
      buildIntegrityRecoveryCopy({
        todayKey: '2026-04-27',
        yesterdayKey: '2026-04-26',
        todayCheckIn: {
          id: 'checkin-1',
          date: '2026-04-27',
          answer: 'partially',
          answeredAt: '2026-04-27T21:00:00Z',
        },
        latestCheckIn: undefined,
        missedYesterday: false,
        warningMessages: [],
      }).message,
    ).toContain('data, not a verdict');
  });
});
