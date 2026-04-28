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
  "version": 2,
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
- Missing integrity runtime fields hydrate from `createInitialIntegritySlice()`.
- Legacy completions without `wasBonusRep` migrate to `wasBonusRep: false`.
- Legacy jars without fun-money fields migrate to disabled fun money with a 50-cent default accrual value and a zero balance.
- Legacy jars without milestones receive the current default milestone set.

## User Data Controls

Settings exposes:

- Export local data: generates a JSON envelope for the current device state.
- Import local data: accepts either a full envelope or a raw state object and migrates it before replacing current local state.
- Reset local data: requires a second confirmation press and returns the app to onboarding.

Destructive local data actions must stay user-confirmed at action time.

## Test Coverage

Persistence durability tests live in `__tests__/persistenceMigration.test.ts` and should be updated whenever `AppState` changes.
