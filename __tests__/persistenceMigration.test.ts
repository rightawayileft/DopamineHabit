import {
  APP_STORE_PERSIST_VERSION,
  migratePersistedAppState,
  useAppStore,
  type AppState,
} from '@/store';
import {
  APP_STORE_STORAGE_KEY,
  readPersistedJsonForTests,
  resetPersistenceForTests,
  writePersistedJsonForTests,
} from '@/store/persistence';

interface PersistedEnvelope {
  exportedAt?: string;
  state: Partial<AppState>;
  version: number;
}

describe('persistence migrations', () => {
  beforeEach(() => {
    resetPersistenceForTests();
    useAppStore.getState().resetForTests();
  });

  it('hydrates pre-management persisted state with missing slices', () => {
    writePersistedJsonForTests(APP_STORE_STORAGE_KEY, {
      version: 0,
      state: {
        currentState: 'IDLE',
        habits: [
          {
            id: 'legacy-habit',
            name: 'Legacy habit',
            jarId: 'legacy-jar',
            createdAt: '2026-04-23T12:00:00Z',
          },
        ],
        jars: [
          {
            id: 'legacy-jar',
            name: 'Legacy jar',
            colorHex: '#46D56E',
            milestones: [],
            funMoneyEnabled: false,
            funMoneyPerTokenCents: 50,
            funMoneyBalanceCents: 0,
            createdAt: '2026-04-23T12:00:00Z',
          },
        ],
        rewards: [],
        settings: {
          nakedRuleAcceptedAt: '2026-04-23T12:00:00Z',
          integrityCheckInTime: '21:00',
          checkInReminderEnabled: false,
          hapticsEnabled: true,
          soundEnabled: true,
          reducedMotion: false,
          rateLimitSecondsPerHabit: {},
        },
      },
    });

    useAppStore.getState().rehydrateFromStorageForTests();
    const state = useAppStore.getState();

    expect(state.habits).toHaveLength(1);
    expect(state.rewardGrants).toEqual([]);
    expect(state.bonusChains).toEqual([]);
    expect(state.integrityRuntime.lastSeenTimestamp).toBeDefined();
    expect(state.integrityRuntime.clockTamperDetected).toBe(false);
  });

  it('fills pre-fun-money jar fields and pre-bonus completion fields', () => {
    const migrated = migratePersistedAppState(
      {
        jars: [
          {
            id: 'pre-pr9-jar',
            name: 'Old jar',
            colorHex: '#3D9BFF',
            createdAt: '2026-04-23T12:00:00Z',
          },
        ],
        completions: [
          {
            id: 'pre-bonus-completion',
            habitId: 'habit-1',
            completedAt: '2026-04-23T12:05:00Z',
            tokenDrawnId: 'token-1',
          },
        ],
        settings: {
          nakedRuleAcceptedAt: '2026-04-23T12:00:00Z',
        },
      },
      0,
    );

    expect(migrated.jars[0]).toMatchObject({
      id: 'pre-pr9-jar',
      funMoneyEnabled: false,
      funMoneyPerTokenCents: 50,
      funMoneyBalanceCents: 0,
    });
    expect(migrated.jars[0]?.milestones.length).toBeGreaterThan(0);
    expect(migrated.completions[0]?.wasBonusRep).toBe(false);
    expect(migrated.settings.integrityCheckInTime).toBe('21:00');
    expect(migrated.settings.checkInReminderEnabled).toBe(false);
  });

  it('hydrates legacy reward grant closures into explicit outcomes', () => {
    const migrated = migratePersistedAppState(
      {
        rewardGrants: [
          {
            id: 'legacy-complete',
            rewardId: 'reward-1',
            grantedAt: '2026-04-23T12:00:00Z',
            source: 'spin',
            endedAt: '2026-04-23T12:10:00Z',
          },
          {
            id: 'legacy-stop',
            rewardId: 'reward-1',
            grantedAt: '2026-04-23T13:00:00Z',
            source: 'spin',
            endedEarlyAt: '2026-04-23T13:05:00Z',
          },
        ],
      },
      2,
    );

    expect(migrated.rewardGrants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'legacy-complete',
          outcome: 'completed',
          closedAt: '2026-04-23T12:10:00Z',
        }),
        expect.objectContaining({
          id: 'legacy-stop',
          outcome: 'stopped',
          closedAt: '2026-04-23T13:05:00Z',
        }),
      ]),
    );
  });

  it('hydrates legacy reward grant snapshots from reward records', () => {
    const migrated = migratePersistedAppState(
      {
        rewards: [
          {
            id: 'reward-1',
            name: 'Original reward',
            tier: 2,
            durationMinutes: 12,
          },
        ],
        rewardGrants: [
          {
            id: 'legacy-grant',
            rewardId: 'reward-1',
            grantedAt: '2026-04-23T12:00:00Z',
            source: 'spin',
          },
          {
            id: 'snapshot-grant',
            rewardId: 'reward-1',
            rewardSnapshot: {
              name: 'Already frozen',
              tier: 1,
              durationMinutes: 3,
            },
            grantedAt: '2026-04-23T13:00:00Z',
            source: 'bonus',
          },
        ],
      },
      3,
    );

    expect(migrated.rewardGrants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'legacy-grant',
          rewardSnapshot: {
            name: 'Original reward',
            tier: 2,
            durationMinutes: 12,
          },
        }),
        expect.objectContaining({
          id: 'snapshot-grant',
          rewardSnapshot: {
            name: 'Already frozen',
            tier: 1,
            durationMinutes: 3,
          },
        }),
      ]),
    );
  });

  it('exports, imports, and resets local data through store actions', () => {
    useAppStore.getState().acceptNakedRule('2026-04-23T12:00:00Z');
    const exported = useAppStore.getState().exportLocalData();
    const parsed = JSON.parse(exported) as PersistedEnvelope;

    expect(parsed.version).toBe(APP_STORE_PERSIST_VERSION);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.state.settings?.nakedRuleAcceptedAt).toBe('2026-04-23T12:00:00Z');

    const preview = useAppStore.getState().previewImportLocalData(exported);
    expect(preview).toMatchObject({
      status: 'ready',
      summary: expect.objectContaining({
        version: APP_STORE_PERSIST_VERSION,
        habits: 0,
        rewards: 0,
      }),
    });

    useAppStore.getState().resetLocalData();
    expect(useAppStore.getState().settings.nakedRuleAcceptedAt).toBe('');

    const result = useAppStore.getState().importLocalData(exported);
    expect(result.status).toBe('imported');
    expect(useAppStore.getState().settings.nakedRuleAcceptedAt).toBe(
      '2026-04-23T12:00:00Z',
    );

    const persistedAfterImport = readPersistedJsonForTests<PersistedEnvelope>(
      APP_STORE_STORAGE_KEY,
    );
    expect(persistedAfterImport?.version).toBe(APP_STORE_PERSIST_VERSION);
  });

  it('rejects raw JSON objects for user-facing imports', () => {
    useAppStore.getState().acceptNakedRule('2026-04-23T12:00:00Z');
    const preview = useAppStore.getState().previewImportLocalData('{}');
    const result = useAppStore.getState().importLocalData('{}');

    expect(preview.status).toBe('failed');
    expect(result.status).toBe('failed');
    expect(useAppStore.getState().settings.nakedRuleAcceptedAt).toBe(
      '2026-04-23T12:00:00Z',
    );
  });

  it('rejects invalid import JSON without changing state', () => {
    useAppStore.getState().acceptNakedRule('2026-04-23T12:00:00Z');

    const result = useAppStore.getState().importLocalData('not json');

    expect(result.status).toBe('failed');
    expect(useAppStore.getState().settings.nakedRuleAcceptedAt).toBe(
      '2026-04-23T12:00:00Z',
    );
  });

  it('repairs orphan active reward sessions during migration', () => {
    const migrated = migratePersistedAppState(
      {
        currentState: 'REWARD_ACTIVE',
        activeRewardSession: {
          rewardGrantId: 'missing-grant',
          expiresAt: '2026-04-23T12:10:00Z',
        },
        rewards: [],
        rewardGrants: [],
      },
      APP_STORE_PERSIST_VERSION,
    );

    expect(migrated.activeRewardSession).toBeUndefined();
    expect(migrated.currentState).toBe('IDLE');
  });
});
