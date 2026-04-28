# Six-Agent Product Audit

Date: 2026-04-28

Scope: UX improvement, usability, delight, recovery, accessibility, trust, and product completeness after completing the PR10-PR16 roadmap locally.

Status: Complete. All six PR16 product-audit agents ran:

- Impatient First-Timer
- Casual Returner
- Optimizer
- No-Shame Coach
- Constrained Mobile User
- Product Strategist

## Strongest Signals

1. First-loop UX is still too conceptual before it feels rewarding.
2. A single non-gold token can be selected into an invalid cash-in state, which makes Spin feel broken.
3. Reward payoff and completion moments are accurate but low-delight.
4. Integrity copy is improved, but still risks feeling like compliance instead of repair.
5. Mature users need ledger clarity: token state, reward-grant why, milestones, and fun money need auditability.
6. Accessibility needs a consistent selected-state contract, non-color indicators, focus recovery, and safer destructive actions.
7. Local-first and self-enforced gate behavior need clearer trust framing for mainstream users.

## Prioritized Backlog

### P1: First Reward Path

ID: UX-001
Title: First-run setup teaches too many concepts before the payoff
Persona: Impatient First-Timer
Journey: Clean-first-run onboarding through post-onboarding next step
Evidence: `app/onboarding/step1.tsx`, `app/onboarding/step2.tsx`, `app/onboarding/next.tsx`, `game/productAuditHarness.ts` seed `clean-first-run`
User impact: A fast new user has to parse too much product vocabulary before feeling the reward loop.
Severity: P1
Effort: M
Opportunity: Make onboarding sell one concrete action: do one tiny rep, spin, start the reward.
Acceptance criteria: Pre-reward screens avoid advanced terms like Tier, Bonus, cash-in strategy, and Integrity except behind optional help; the primary path keeps the next action focused on the first rep.
Dependencies: None

ID: UX-002
Title: Integrity check-in competes with the first rep
Persona: Impatient First-Timer
Journey: Post-onboarding next step to first rep on Home
Evidence: `DOPAMINEHABIT_SPEC_CODEX.md` core loop, `app/index.tsx`, `game/productAuditHarness.ts` seed `clean-first-run`
User impact: The first screen can feel like compliance before the user earns anything.
Severity: P1
Effort: S
Opportunity: Delay or demote integrity until after the first reward.
Acceptance criteria: Before the first reward grant, Home prioritizes the first habit rep and hides or demotes the check-in prompt; after first reward completion, check-in appears with no-shame context.
Dependencies: Derived "has completed first loop" selector.

ID: UX-003
Title: Token drawn feedback does not carry the user to Spin
Persona: Impatient First-Timer
Journey: First rep to first token
Evidence: `app/index.tsx`, `store/index.ts`, `game/productAuditHarness.ts` route smoke check for `/`
User impact: After tapping Done, the user gets confirmation but not an obvious next step.
Severity: P1
Effort: S
Opportunity: Turn the first token moment into a guided handoff.
Acceptance criteria: Successful completion feedback includes a primary `Spin now` CTA and explains that the token is saved.
Dependencies: Existing `lastCompletionFeedback` and inventory token count.

ID: UX-004
Title: One-token cash-in feels broken
Persona: Impatient First-Timer, Casual Returner
Journey: First/returning token to Spin
Evidence: `components/CashInPanel.tsx`, `game/cashIn.ts`, `app/spin.tsx`, seed `returning-with-tokens`
User impact: Users naturally tap their only token and immediately block themselves.
Severity: P1
Effort: S-M
Opportunity: Make "save this token or spin Tier 1" explicit.
Acceptance criteria: With one non-gold token selected, `/spin` shows inline recovery to clear and spin Tier 1; ideally one invalid non-gold token is shown as saved for later rather than a selectable blocker.
Dependencies: Cash-in panel awareness of available valid cash-in groups.

ID: UX-005
Title: First reward grant does not feel like starting the reward
Persona: Impatient First-Timer
Journey: First spin to first reward
Evidence: `store/index.ts`, `app/spin.tsx`, `app/reward/[id].tsx`
User impact: The payoff moment is split across screens and feels recorded rather than earned.
Severity: P1
Effort: M
Opportunity: Make the first reward grant a clear transition into the timer.
Acceptance criteria: After a timed reward is granted, outcome UI shows one primary `Start reward: [name]` action near the award result, or routes to the reward screen with an accessible confirmation.
Dependencies: Active reward session and awarded reward lookup.

### P1: Recovery and Trust

ID: UX-006
Title: Naked Rule and integrity copy still feel compliance-heavy
Persona: No-Shame Coach
Journey: Recovery-active-reward, Naked Rule to `/checkin`
Evidence: `app/onboarding/step1.tsx`, `app/checkin.tsx`
User impact: A returning user after a slip may avoid the app because it feels like a character audit.
Severity: P1
Effort: M
Opportunity: Reframe integrity as repair and information while preserving the Naked Rule.
Acceptance criteria: Naked Rule and check-in screens use recovery-forward labels, avoid "Scoreboard" framing, and include a visible "what to do after a slip" next action.
Dependencies: Copy pass plus focused check-in tests.

ID: UX-007
Title: Missed-day recovery stops at answering today
Persona: No-Shame Coach
Journey: Missed check-in to `/checkin` to Home
Evidence: `game/checkInReminder.ts`, `game/integrity.ts`, seed `recovery-active-reward`
User impact: The product acknowledges a miss but does not help the user repair the routine.
Severity: P1
Effort: M
Opportunity: Turn missed days into a small recovery workflow.
Acceptance criteria: After a missed or partial check-in, `/checkin` offers one primary recovery action, uses human-readable dates, and Home keeps a gentle recovery prompt visible until today is answered.
Dependencies: Integrity copy/helper update and route tests.

ID: UX-008
Title: Active reward protection is too binary
Persona: No-Shame Coach
Journey: Active reward to Spin
Evidence: `app/reward/[id].tsx`, `game/spinComprehension.ts`, seed `recovery-active-reward`
User impact: Users who drift during a reward may be nudged toward dishonest completion instead of honest re-entry.
Severity: P1
Effort: M
Opportunity: Make active reward protection feel like boundary support.
Acceptance criteria: Active reward UI uses local time, distinguishes completed/stopped/slipped states, links slip state to integrity recovery, and shows expired-session recovery before normal spinning resumes.
Dependencies: Reward session copy and grant-status handling.

ID: UX-009
Title: Local-first data trust is too technical
Persona: Product Strategist
Journey: Stale-local-state recovery from `/settings`
Evidence: `game/productAuditHarness.ts` seed `stale-local-state`, `app/settings.tsx`
User impact: Users may not know whether their data is private, backed up, stale, recoverable, cloud-synced, or device-only.
Severity: P1
Effort: S-M
Opportunity: Turn local-first from an implementation detail into a trust signal.
Acceptance criteria: `/settings` includes a plain-language Data Status card that states data is stored on this device, whether cloud sync exists, what export/import/reset do, and the safest recovery action for stale local state.
Dependencies: Optional `lastExportedAt` / `lastImportedAt` metadata if backup freshness is shown.

ID: UX-010
Title: Backup and restore feels developer-facing
Persona: Product Strategist
Journey: Stale-local-state recovery from `/settings`
Evidence: `app/settings.tsx` export/import JSON controls
User impact: Mainstream users may avoid recovery because raw JSON feels fragile.
Severity: P1
Effort: M
Opportunity: Make local backup feel safe without adding cloud accounts.
Acceptance criteria: Export creates a named snapshot with human-readable counts; import validates and previews habits, rewards, tokens, grants, and version before replacement; destructive replacement requires explicit confirmation.
Dependencies: Platform sharing/download support or copy-to-clipboard fallback.

ID: UX-011
Title: Gate strength is not explained
Persona: Product Strategist
Journey: Settings to Rewards to active reward expectations
Evidence: `DOPAMINEHABIT_SPEC_CODEX.md`, `app/reward/[id].tsx`, `app/settings.tsx`
User impact: Users arriving from app blockers may overestimate enforcement, then lose trust when the product behaves like a self-accountability tool.
Severity: P1
Effort: S
Opportunity: Be radically honest about the current gate and make that honesty part of the brand.
Acceptance criteria: Reward setup or Settings includes a "Gate strength" explanation that says rewards are self-enforced and local-first today, with clear boundaries for what the app does and does not block.
Dependencies: None.

### P1: Accessibility and Safety

ID: UX-012
Title: Reduced-motion spin resolution lacks focus recovery
Persona: Constrained Mobile User
Journey: `/spin` with reduced motion enabled
Evidence: `game/productAuditHarness.ts` seed `accessibility-reduced-motion`, `app/spin.tsx`, `components/Wheel/Wheel.tsx`
User impact: After tapping Spin, a reduced-motion user may not be moved to or told the result.
Severity: P1
Effort: M
Opportunity: Treat reduced-motion spin completion as a focused result state, not just a skipped animation.
Acceptance criteria: Reduced-motion spin completion scrolls/focuses to a textual result summary, announces landed tier/reward, and does not require seeing wheel motion or highlight.
Dependencies: Focus/announcement helper for web/native.

ID: UX-013
Title: Accidental taps can archive or end sessions without immediate undo
Persona: Constrained Mobile User
Journey: Slow-tap management and active reward recovery
Evidence: `app/habits.tsx`, `app/jars.tsx`, `app/rewards.tsx`, `app/settings.tsx`
User impact: A missed tap can hide setup or end a reward session without same-viewport recovery.
Severity: P1
Effort: M
Opportunity: Apply the reset flow's safety pattern to high-impact management actions.
Acceptance criteria: Archive and reward-ending actions require confirmation or show an immediate Undo control in the same viewport without deleting append-only history.
Dependencies: Confirmation or toast/undo pattern.

### P1: Ledgers and Auditability

ID: UX-014
Title: Token inventory and history are conflated
Persona: Optimizer
Journey: Jar inventory and token history review
Evidence: `app/jar/[id].tsx`, `components/TokenInventory.tsx`, seed `power-user-mature`
User impact: A spent token can appear in an "Inventory" card, eroding trust in token economics.
Severity: P1
Effort: M
Opportunity: Turn token state into a legible ledger.
Acceptance criteria: Inventory only counts `in_inventory`; jar detail has separate token history with earned date, state, color, and source habit; cashed-in tokens are visibly distinct.
Dependencies: Existing `Token.state`.

ID: UX-015
Title: Reward grant history does not explain why a reward happened
Persona: Optimizer
Journey: Reward history after repeated spins and cash-ins
Evidence: `DOPAMINEHABIT_SPEC_CODEX.md`, `app/rewards.tsx`, `spinResults`, `rewardGrants`, `tokens`
User impact: Users cannot audit whether rewards matched their token strategy.
Severity: P1
Effort: M
Opportunity: Make every grant self-explanatory.
Acceptance criteria: Grant history shows reward, grant time, source, duration, spin tier, landed slice, cashed-in token count/colors, and near-miss/fallback status where applicable.
Dependencies: Existing `spinResults`, `rewardGrants`, and `tokens`.

## P2 Opportunities

- Spin should expose contextual add-more actions from `/spin`.
- Manual add forms need visible success feedback and next actions.
- Reward completion needs a satisfying confirmation state.
- Reward timer should use human-readable time and a completion payoff.
- Stats should show active or most recent reward status.
- Stats filters need scoped habit choices, clear filters, and better empty states for mature use.
- Management needs search, filters, compact mode, and batch-ish archive/restore for mature users.
- Milestones and fun money need ledger-level auditability.
- Bonus loops should explicitly be optional and support no-shame decline/end-chain.
- The recovery seed should better model the promised two-week journey.
- Token and jar color controls need non-color selected indicators and 48px targets.
- Primary navigation should be reachable without scrolling on mobile web.
- Stats and Settings should expose the primary action and top facts within the first mobile viewport.
- Selected states should be standardized across Stats filters, reward tiers, jar choices, and settings toggles.
- Habit-tracker conventions need lightweight today status, last logged date, and 7-day visuals.
- Spin needs a transparent odds/fairness signal for the current activated tier.
- Reward creation should support temptation-planning prompts and boundary notes.
- Home or Stats should surface contextual differentiators like fun money, next milestone, or saved reward energy.

## Recommended Next UX Checkpoints

1. PR17 first reward path delight: simplify first-run copy, demote early check-in, add `Spin now` from token feedback, fix one-token cash-in recovery, and make first reward start/complete feel satisfying.
2. PR18 recovery language and reward boundary support: no-shame copy pass, missed-day repair workflow, active reward stopped/slipped states, human-readable times.
3. PR19 trust and safety polish: Data Status card, safer backup/restore, gate-strength explanation, reduced-motion result focus, and undo/confirm for high-impact actions.
4. PR20 trust ledgers: token history split from inventory, reward grant why history, recent reward status on Stats.
5. PR21 mature management polish: compact/searchable management, scoped Stats filters, milestone/fun-money ledgers, consistent selected controls.
