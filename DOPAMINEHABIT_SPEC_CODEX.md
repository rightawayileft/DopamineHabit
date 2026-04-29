# DopamineHabit Product Spec

Last updated: 2026-04-28

This file is the local source of truth for product behavior. `ROADMAP.md` records PR-sized delivery order, while this spec describes the intended product model and durable invariants.

## Product Intent

DopamineHabit is a local-first Expo app for iOS, Android, and web. It helps users gate tempting rewards behind small habit reps. Every completed rep draws a token. Tokens can be kept in inventory or cashed in for better spin odds. Spins grant timed reward sessions, bonus rounds, or near-miss fallthroughs.

The product should feel clear, recoverable, and no-shame. It should reward honest use without deleting history or hiding state.

## Core Loop

1. User accepts the Naked Rule.
2. User creates a first jar, habit cue, and Tier 1 reward during onboarding.
3. User completes a habit rep.
4. App draws a token into the habit jar.
5. User opens Spin.
6. User either spins with no cash-in for Tier 1, or selects valid tokens to activate Tier 2 or Tier 3.
7. App persists the pending spin before animation resolves.
8. App resolves the spin into a bonus round, near miss, or reward grant.
9. User uses an active timed reward session.
10. User answers the daily integrity check-in once per local day.

## Product Areas

### Onboarding

- Step 1 records Naked Rule acceptance.
- Step 2 creates the first jar, habit, and Tier 1 reward from editable starter bundles, with a live gate preview.
- Step 3 sets or accepts the daily check-in time as a no-shame repair ritual.
- A post-onboarding next step prioritizes starting the first rep and keeps extra setup available behind an optional customization affordance.
- Onboarding creates the first loop, not the only loop. The app must make expansion discoverable immediately after setup.

### Habits

- Habits belong to jars.
- Habits can be created, edited, archived, and restored.
- Common habit templates can quick-add starter options, but created habits behave like normal editable habits.
- Archiving prevents new completions but preserves historical completions.
- Completing a habit creates an append-only `HabitCompletion` and a token tied to the habit jar.
- Rate limiting must provide user-facing feedback instead of silently failing.

### Jars, Tokens, Milestones, and Fun Money

- Jars receive tokens from linked habit completions.
- Tokens are never deleted.
- Token states are `in_inventory`, `cashed_in`, or `in_jar`.
- Milestones unlock when earned token count reaches their threshold.
- Custom milestones added below the current earned-token count should unlock immediately.
- Optional fun-money balances accrue from earned tokens when enabled.

### Cash-In and Spin

- No selected tokens activates Tier 1.
- The first eligible spin must resolve into a starter reward path rather than a bonus detour.
- A single gold token activates Tier 3.
- Two matching non-gold tokens activate Tier 2.
- Three matching non-gold tokens activate Tier 3.
- Invalid selections must explain why they are invalid.
- First-spin setup must explain the current state: no rep ready, pending spin recovery, invalid token selection, active reward blocker, or ready to spin.
- Disabled spin controls must show the direct reason, not only appear inactive.
- Spin outcomes must explain the landed slice, activated tier, cashed-in tokens, near-miss or fallback behavior, and reward duration when available.
- Preparing a spin must reject archived habits, duplicate pending spins, already-spun completions, active reward sessions, and tokens outside the completion habit jar.
- Pending spins must be recoverable after reload.
- Reduced motion must skip the long wheel animation and resolve the persisted spin directly.

### Rewards

- Rewards can be created, edited, archived, and restored.
- Common reward templates can quick-add starter tiers, but created rewards behave like normal editable rewards.
- Reward grants are append-only.
- Active reward sessions block new spins until completed, stopped cleanly, logged as a slip, or expired.
- Reward history should explain what was earned, when, why, and how the session closed.
- Active reward screens should help users protect the granted session, mark it complete, stop clean, or log a boundary slip.

### Bonus Rounds

- Bonus chains are append-only.
- Bonus spins are deterministic from seeds.
- Bonus outcomes can discount a bonus rep, grant a free token, grant a golden token, or extend the chain.
- Bonus timers must expire deterministically after reload.
- Completing a bonus rep can create tokens, reward grants, and milestone/fun-money progress.

### Integrity

- Integrity check-ins are append-only.
- Users can answer once per local day.
- Skipped days reset the honesty streak.
- Partial or no answers count as honest admissions without shame-heavy copy.
- Check-in UI should frame missed days, partial slips, and no answers as repair signals rather than compliance failures.
- Clock drift warnings should be visible without blocking the loop.
- Reminder scheduling should respect the check-in time where platform support allows.
- Users should be able to enable or disable a gentle daily check-in reminder from Settings.
- Missed or partial check-ins should be framed as useful recovery signals, not failure states.

### Settings

- Settings should expose haptics, sound, reduced motion, check-in time, build/version information, and local data controls.
- Settings should show notification permission/reminder status when daily reminders are configured.
- Destructive local data actions must require confirmation.
- Local DB reset/export/import belongs to the durability checkpoint.

### Stats

- Stats should summarize setup, reps, tokens, spins, reward grants, milestones, fun money, integrity, and next best action.
- Stats must be useful with zero data, early data, and mature data.
- Stats should support timeframe, jar, and habit filters for focused progress review.
- Stats should translate raw local data into coaching cues, visible rhythm, and reward-energy signals.

## Persistence Invariants

- Local-first state is the source of truth for the app experience.
- State transitions that the UI depends on must be persisted before animations or follow-up navigation rely on them.
- `HabitCompletion`, `SpinResult`, `BonusChain`, and `RewardGrant` records are append-only.
- Persisted-state changes require explicit versioning and migrations. See `docs/PERSISTENCE.md`.

## Agent Audit Expectations

Product audits should inspect journeys, not only code. Each finding should cite at least one of:

- Route or component
- Store state shape
- Test or seed scenario
- User-facing copy
- Browser-rendered evidence
- Source document

Findings should include severity, user impact, opportunity, and acceptance criteria.

The canonical prompt pack and seed state manifest live in `docs/agentic-product-audit-prompts.md` and `game/productAuditHarness.ts`.
