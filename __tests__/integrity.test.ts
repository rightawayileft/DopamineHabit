import {
  buildIntegrityDisplayInputs,
  detectClockTamper,
  evaluateRateLimit,
} from '@/game/integrity';
import { useAppStore, type AppState } from '@/store';
import {
  APP_STORE_STORAGE_KEY,
  readPersistedJsonForTests,
  resetPersistenceForTests,
  writePersistedJsonForTests,
} from '@/store/persistence';

interface PersistedEnvelope {
  state: Partial<AppState>;
  version: number;
}

describe('integrity rules', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
  });

  it('flags backward clock drift beyond five minutes', () => {
    const result = detectClockTamper('2026-04-23T12:10:00Z', '2026-04-23T12:04:59Z');

    expect(result.clockTamperDetected).toBe(true);
    expect(result.driftSeconds).toBeLessThan(-300);
  });

  it('allows small backward clock drift inside the threshold', () => {
    expect(
      detectClockTamper('2026-04-23T12:10:00Z', '2026-04-23T12:05:01Z')
        .clockTamperDetected,
    ).toBe(false);
  });

  it('rejects a second completion inside the per-habit rate limit', () => {
    const result = evaluateRateLimit(
      '2026-04-23T12:00:00Z',
      '2026-04-23T12:00:20Z',
      30,
    );

    expect(result.allowed).toBe(false);
    expect(result.secondsRemaining).toBe(10);
  });

  it('allows completion after the rate limit window', () => {
    expect(
      evaluateRateLimit('2026-04-23T12:00:00Z', '2026-04-23T12:00:30Z', 30).allowed,
    ).toBe(true);
  });

  it('builds display inputs for today and missed check-ins', () => {
    const display = buildIntegrityDisplayInputs({
      todayKey: '2026-04-25',
      yesterdayKey: '2026-04-24',
      runtime: {
        honestyStreak: 1,
        honestAdmissionCount: 0,
        lastSeenTimestamp: '2026-04-25T12:00:00Z',
        clockTamperDetected: false,
        warnings: [],
      },
      checkIns: [
        {
          id: 'checkin-1',
          date: '2026-04-23',
          answer: 'yes',
          answeredAt: '2026-04-23T21:00:00Z',
        },
      ],
    });

    expect(display.todayCheckIn).toBeUndefined();
    expect(display.latestCheckIn?.id).toBe('checkin-1');
    expect(display.missedYesterday).toBe(true);
    expect(display.warningMessages).toContain('No integrity check-in recorded for 2026-04-24.');
  });

  it('keeps missed-yesterday messaging visible after answering today', () => {
    const display = buildIntegrityDisplayInputs({
      todayKey: '2026-04-25',
      yesterdayKey: '2026-04-24',
      runtime: {
        honestyStreak: 2,
        honestAdmissionCount: 0,
        lastSeenTimestamp: '2026-04-25T21:00:00Z',
        clockTamperDetected: false,
        warnings: [],
      },
      checkIns: [
        {
          id: 'checkin-1',
          date: '2026-04-23',
          answer: 'yes',
          answeredAt: '2026-04-23T21:00:00Z',
        },
        {
          id: 'checkin-2',
          date: '2026-04-25',
          answer: 'yes',
          answeredAt: '2026-04-25T21:00:00Z',
        },
      ],
    });

    expect(display.todayCheckIn?.id).toBe('checkin-2');
    expect(display.missedYesterday).toBe(true);
  });

  it('does not show skipped messaging for a first-ever check-in today', () => {
    const display = buildIntegrityDisplayInputs({
      todayKey: '2026-04-25',
      yesterdayKey: '2026-04-24',
      runtime: {
        honestyStreak: 1,
        honestAdmissionCount: 0,
        lastSeenTimestamp: '2026-04-25T21:00:00Z',
        clockTamperDetected: false,
        warnings: [],
      },
      checkIns: [
        {
          id: 'checkin-1',
          date: '2026-04-25',
          answer: 'yes',
          answeredAt: '2026-04-25T21:00:00Z',
        },
      ],
    });

    expect(display.missedYesterday).toBe(false);
    expect(display.warningMessages).toHaveLength(0);
  });

  it('appends and persists integrity check-in history while updating streak counts', () => {
    useAppStore.getState().answerIntegrityCheckIn('yes', '2026-04-23T21:00:00Z');
    useAppStore.getState().answerIntegrityCheckIn('yes', '2026-04-24T21:00:00Z');
    useAppStore.getState().answerIntegrityCheckIn('partially', '2026-04-25T21:00:00Z');

    expect(useAppStore.getState().integrityCheckIns).toHaveLength(3);
    expect(useAppStore.getState().integrityRuntime.honestyStreak).toBe(0);
    expect(useAppStore.getState().integrityRuntime.honestAdmissionCount).toBe(1);

    const persistedBeforeRestart = readPersistedJsonForTests<PersistedEnvelope>(
      APP_STORE_STORAGE_KEY,
    );
    useAppStore.getState().resetForTests();

    if (!persistedBeforeRestart) {
      throw new Error('Expected persisted integrity state before restart.');
    }

    writePersistedJsonForTests(APP_STORE_STORAGE_KEY, persistedBeforeRestart);
    useAppStore.getState().rehydrateFromStorageForTests();

    expect(useAppStore.getState().integrityCheckIns).toHaveLength(3);
    expect(useAppStore.getState().integrityCheckIns[2]).toMatchObject({
      date: '2026-04-25',
      answer: 'partially',
    });
  });

  it('surfaces clock tamper through runtime warnings', () => {
    useAppStore.setState((state) => ({
      integrityRuntime: {
        ...state.integrityRuntime,
        lastSeenTimestamp: '2026-04-23T12:10:00Z',
      },
    }));

    useAppStore.getState().markAppSeen('2026-04-23T12:04:00Z');

    const display = buildIntegrityDisplayInputs({
      todayKey: '2026-04-23',
      yesterdayKey: '2026-04-22',
      checkIns: useAppStore.getState().integrityCheckIns,
      runtime: useAppStore.getState().integrityRuntime,
    });

    expect(useAppStore.getState().integrityRuntime.clockTamperDetected).toBe(true);
    expect(display.warningMessages).toContain('Backward clock drift detected.');
  });
});
