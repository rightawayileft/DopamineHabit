# AGENTS

DopamineHabit is a production-grade Expo app for iOS, Android, and web. The source of truth for product behavior is `DOPAMINEHABIT_SPEC_CODEX.md`, and work should stay aligned with the PR-by-PR checkpoints defined there.

Read `ROADMAP.md` before starting a new checkpoint; it records the latest completed PR-sized scope, next recommended work, and cloud handoff status.

## Commands

- `npm start`
- `npm test`
- `npm run typecheck`
- `npm run lint`

## Code Style

- TypeScript strict mode is required.
- Do not use `any` without an inline reason.
- Use functional React components only.
- Prefer absolute imports via `@/*`.
- Reanimated worklets must not read from Zustand or React state directly.

## Invariants

- Persistence-first: state transitions must be persisted synchronously before the app depends on them.
- Append-only: `HabitCompletion`, `SpinResult`, `BonusChain`, and reward grants are never deleted.

## Workflow

- Work in one PR-sized checkpoint at a time.
- Keep tests green before stopping.
- Do not add dependencies casually; if a new dependency is needed, update the spec and document why.
