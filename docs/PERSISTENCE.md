# Local Persistence Contract

Last updated: 2026-04-28

DopamineHabit is local-first. The persisted app state is stored under:

```text
dopaminehabit-app-store
```

The current persisted envelope version is exported as `APP_STORE_PERSIST_VERSION` from `@/store`.

## Envelope Shape

Exports and Zustand persistence use this shape:

```json
{
  "version": 4,
  "exportedAt": "2026-04-29T00:00:00Z",
  "state": {
    "currentState": "IDLE",
    "habits": [],
    "jars": [],
    "rewards": []
  }
}
```

The full `state` object is the `AppState` subset returned by the store `partialize` function.

## Migration Rules

- Missing top-level slices hydrate from `createInitialAppState()`.
- Missing settings fields hydrate from `createInitialSettingsSlice()`.
- Version 2 adds `settings.checkInReminderEnabled`, which defaults to `false` for migrated states.
- Version 3 adds explicit reward grant `outcome` and `closedAt` fields. Legacy `endedAt` grants hydrate as `completed`, and legacy `endedEarlyAt` grants hydrate as `stopped`.
- Version 4 adds reward grant snapshots for historical reward name, tier, and duration display. Legacy grants hydrate snapshots from matching reward records when possible.
- Missing integrity runtime fields hydrate from `createInitialIntegritySlice()`.
- Legacy completions without `wasBonusRep` migrate to `wasBonusRep: false`.
- Legacy jars without fun-money fields migrate to disabled fun money with a 50-cent default accrual value and a zero balance.
- Legacy jars without milestones receive the current default milestone set.

## User Data Controls

Settings exposes:

- Data status: shows the active storage backend, whether it is durable, local record counts, app version, data version, EAS project, and storage key.
- Export local data: generates a JSON envelope for the current device state with an `exportedAt` timestamp.
- Import local data: previews a DopamineHabit export envelope and requires explicit confirmation before replacing current local state.
- Reset local data: requires a second confirmation press and returns the app to onboarding.

User-facing import does not accept arbitrary raw JSON objects. Destructive local data and archive actions must stay user-confirmed at action time.

## Test Coverage

Persistence durability tests live in `__tests__/persistenceMigration.test.ts` and should be updated whenever `AppState` changes.
