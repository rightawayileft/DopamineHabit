# Product Quality Audit

Date: 2026-04-27

Scope: DopamineHabit local repo, local persistence model, product flows, route surface, and roadmap quality. This audit focuses on product improvement opportunities: incomplete features, user friction, workflow gaps, and agent-ready product review patterns.

Implementation note: PR10 addressed QF-001, QF-002, and QF-003 by restoring `DOPAMINEHABIT_SPEC_CODEX.md`, adding persistent navigation plus a Manage hub, surfacing add-more actions from Home/onboarding, and replacing the placeholder Settings and Stats routes with useful first versions. PR11 addressed QF-004 and QF-005 with versioned local DB migrations, migration tests, Settings export/import/reset controls, and `docs/PERSISTENCE.md`. PR12 addressed QF-002 and QF-006 with a post-onboarding next-step route, quick-add habit/reward templates, contextual concept copy, and a first-spin checklist that explains no-rep, invalid cash-in, active reward, pending spin, and ready states. PR13 further addressed QF-006 and QF-007 with a cash-in tier explainer, direct disabled-spin reasons, detailed spin outcome summaries, and active reward recovery context. PR14 addressed QF-008 with permission-aware check-in reminders, Settings reminder status, Home check-in surfacing, and no-shame recovery copy for skipped or partial check-ins. PR15 addressed QF-009 with filterable progress views, momentum scoring, rep rhythm visualization, reward-energy breakdowns, and coaching cards that point back into the loop. PR16 addressed QF-010 with an agentic product-audit prompt pack, seeded journey states, route smoke checks, and backlog synthesis contract tests. The completed six-agent audit is recorded in `docs/six-agent-product-audit-2026-04-28.md` and sets PR17-PR21 UX priorities.

## Research Inputs

The useful patterns were consistent across product-management prompt libraries, UX prompt articles, and Codex workflow guidance:

- Community PM prompt libraries work best when they keep the human in control, build context gradually, use established frameworks such as Jobs-to-be-Done, and include quality-control checks for missing information. Source: https://github.com/deanpeters/product-manager-prompts
- Codex-style product work benefits from an Ask Mode plan before implementation, issue-style prompts with concrete file/context references, a lightweight backlog queue, persistent `AGENTS.md` context, and "best of N" review for hard or ambiguous product decisions. Source: https://openai.com/business/guides-and-resources/how-openai-uses-codex/
- Agentic QA gets much better when the application is directly legible to agents through UI state, screenshots, navigation, logs, metrics, and repeatable journey validation rather than only static code review. Source: https://openai.com/index/harness-engineering/
- Strong UX audit prompts map journeys, user goals, touchpoints, thoughts, emotions, specific pain points, severity, impact, opportunity, critical moments, quick wins, strategic investments, and acceptable friction. Source: https://aiagentskit.com/blog/30-ai-prompts-product-managers/
- Product prompts should set a clear role, define personas, narrow the focus, and explicitly ask simulated users what is confusing in a first-use flow. Source: https://www.upwork.com/resources/ai-prompts-for-product-managers
- Competitive feature analysis should inspect flows and intent, not just feature lists; the output should become problem-centric opportunities and "how might we" statements. Source: https://aiforpro.net/competitor-feature-analysis-prompts/

## Audit Method

Inputs inspected locally:

- `README.md`, `ROADMAP.md`, `AGENTS.md`, `CLOUD_DEPLOYMENT_HANDOFF.md`
- Expo routes in `app/`
- Shared UI in `components/`
- Zustand persistence and state transitions in `store/`
- Game logic in `game/`
- Existing Jest coverage in `__tests__/`
- Static/live render evidence from seeded onboarded state for `/habits`, `/rewards`, and `/jars`

Quality lens:

1. First value moment: can a new user understand and complete the first loop?
2. Expansion: can the user discover how to add more habits, rewards, jars, and milestones?
3. Recovery: can the user recover from interrupted spins, active rewards, archived data, and stale local state?
4. Feedback: does every action explain what changed and what to do next?
5. Local DB durability: can persisted browser/native state survive product evolution?
6. Accessibility and responsive quality: can users operate the core loop with assistive tech and small screens?
7. Agent auditability: can future agents reproduce journeys and produce actionable backlog items?

## Findings

| ID | Priority | Finding | Evidence | User Impact |
| --- | --- | --- | --- | --- |
| QF-001 | P0 | The product source-of-truth file is missing locally. | `README.md` and `ROADMAP.md` point to `DOPAMINEHABIT_SPEC_CODEX.md`, but the file is not present or tracked. | Agents and humans cannot reliably separate intended behavior from accidental implementation. |
| QF-002 | P1 | Add-more-habits/rewards exists, but discoverability is weak. | Add screens live at `/habits`, `/rewards`, and `/jars`, reached through Home -> Manage options. Onboarding Step 2 only creates one loop and does not explain expansion. | A user can reasonably think the first loop is fixed and that more options are unavailable. |
| QF-003 | P1 | Two visible product routes are still scaffolds. | `app/settings.tsx` and `app/stats.tsx` render `PlaceholderRoute`, which says "Placeholder route for the PR1 hybrid scaffold." | The product feels unfinished and blocks important settings, data control, progress, and trust workflows. |
| QF-004 | P1 | Local DB/persistence has no explicit version or migration path. | Zustand persist uses `APP_STORE_STORAGE_KEY` without a versioned migration. Tests hydrate custom envelopes, but production persistence relies on default merging. | Old browser/native state can mask new features, break nested settings, or make deployments look unchanged. |
| QF-005 | P1 | There is no user-facing local data reset/export/import/debug state. | Settings is placeholder; persistence key is hidden. | Users cannot recover from stale local data, inspect app version/build, or move state across devices. |
| QF-006 | P2 | The spin/cash-in mental model is accurate but dense. | `/spin` explains matching tokens and Tier 1 no-selection, but not why selections matter, what token colors unlock, or what to do when the button is disabled. | New users may complete reps but not understand how tokens map to better reward chances. |
| QF-007 | P2 | The reward system lacks a clear "why this reward now" narrative. | Reward grants are recorded and timers work, but user-facing history is mostly timestamp/status data. | The habit loop may feel random or arbitrary instead of earned and motivating. |
| QF-008 | P2 | Integrity reminders are not product-complete. | `useCheckInReminder` is a no-op, while onboarding and Integrity screens expose a daily check-in time. | The app promises a daily ritual but does not yet help users remember it. |
| QF-009 | P2 | Stats/progress is not yet usable. | `app/stats.tsx` is a placeholder despite milestones, completions, tokens, fun money, rewards, and integrity data existing in the store. | Users cannot see momentum, diagnose drop-offs, or understand long-term value. |
| QF-010 | P2 | Agentic product audits are not yet operationalized. | The repo has good tests, but no product-audit prompt pack, seed scenarios, journey checklist, or route-level product assertions. | Future agents may find code bugs but miss product friction and incomplete workflows. |
| QF-011 | P3 | Mobile/web navigation is too hidden for repeated use. | Core routes are cards and buttons, not a persistent tab/navigation model. | Repeated tasks like log rep, spin, reward, and check-in require recall instead of recognition. |
| QF-012 | P3 | Accessibility polish is partial. | Buttons now expose role/state, but color swatches, wheel semantics, nested cards, and placeholder routes need a deeper pass. | Some users may not understand selected colors, wheel outcome, or grouped content structure. |

## Roadmap

### PR10: Product Legibility and Navigation

Goal: make the existing feature set obvious to a first-time and returning user.

Scope:

- Replace placeholder `Settings` and `Stats` routes with useful first versions or remove them from reachable navigation until complete.
- Add persistent primary navigation or a clearer app shell for Home, Spin, Rewards, Integrity, and Manage.
- Promote "Add habit", "Add reward", and "Add jar" from hidden management screens into first-loop copy and Home empty states.
- Add route-level empty states that say what is possible, why it matters, and the next action.
- Add a visible build/version/deployment marker in Settings to reduce "is this the new build?" confusion.

Acceptance criteria:

- A seeded first-time user can find "Add habit" and "Add reward" without knowing route names.
- No user-facing route says "Placeholder route".
- Product copy explains that onboarding creates the first loop, not the only loop.

### PR11: Local DB Durability and Data Controls

Goal: make local-first persistence trustworthy as the app evolves.

Scope:

- Add explicit persisted-state versioning and migrations for `APP_STORE_STORAGE_KEY`.
- Add tests for old persisted envelopes missing newer fields.
- Add Settings actions for reset local data, export JSON, and import JSON.
- Add user-facing stale-state recovery copy for web.
- Document the persistence contract in the repo.

Acceptance criteria:

- Old localStorage/native state migrates into a complete current state.
- Users can reset stale local data intentionally.
- Tests cover at least one pre-PR7 and one pre-PR9 persisted-state shape.

### PR12: First Loop Expansion and Guided Setup

Goal: make the first loop teach the full product model.

Scope:

- Add a post-onboarding "Next: add another option or start the first rep" step.
- Offer optional quick-add templates for common habits and rewards.
- Add inline explanations for jar, habit, reward, token, spin, bonus, and integrity concepts in context.
- Add a first-spin checklist that unlocks only after the user has a rep ready.

Acceptance criteria:

- New users understand how to add a second habit/reward before completing onboarding or immediately after it.
- First spin setup explains the current state: no rep, no tokens, selected tokens invalid, active reward, or ready to spin.

### PR13: Spin and Reward Comprehension

Goal: make the reward loop feel earned, understandable, and recoverable.

Scope:

- Add a token-to-tier explainer in `CashInPanel`.
- Show disabled spin reasons as direct copy.
- Add "why this reward" details after spin: landed slice, activated tier, near miss, fallback, selected tokens, and reward duration.
- Improve active reward screen with "protect this session" guidance, completion affordance, and reward history context.
- Add tests for disabled reason states and active reward recovery.

Acceptance criteria:

- A user can tell exactly why Spin is disabled.
- A user can explain what token selection will do before pressing Spin.

### PR14: Integrity Reminder and Settings Completion

Goal: turn integrity from a passive page into a reliable daily ritual.

Scope:

- Implement `useCheckInReminder` for supported platforms with permission-aware behavior.
- Add Settings controls for check-in time, haptics, sound, reduced motion, and notification status.
- Add no-shame copy for missed or partial check-ins.
- Add reminder scheduling tests where practical, plus platform fallback tests.

Acceptance criteria:

- The check-in time setting actually affects reminder scheduling where supported.
- Users can see whether reminders are enabled or unavailable.

### PR15: Stats, Progress, and Coaching

Goal: show users why the loop is working.

Scope:

- Replace `Stats` placeholder with completion trends, token earnings, spin outcomes, reward grants, fun money, milestones, and integrity streaks.
- Add simple "next best action" coaching based on local state.
- Add filters for habit, jar, and timeframe.
- Add empty states that guide the user back into the loop.

Acceptance criteria:

- Stats is useful with zero data, early data, and mature data.
- The page surfaces at least one actionable recommendation from local state.

### PR16: Agentic Product Audit Harness

Goal: make recurring product-quality audits repeatable.

Scope:

- Add a `docs/agentic-product-audit-prompts.md` prompt pack.
- Add seeded journey states for first-time, returning, power, stale-state, accessibility, and recovery users.
- Add a lightweight route-render smoke test or browser verification script for core journeys.
- Add a backlog synthesis format with severity, evidence, user impact, effort, and acceptance criteria.
- Run a six-agent audit before major roadmap pivots.

Acceptance criteria:

- Agents can audit journeys from documented seed states without inventing context.
- Every audit finding must cite a route, store state, screenshot/DOM evidence, or source doc.

## Six-Agent Product Audit Prompt Pack

Use these when we run the planned six-agent review. Each agent should produce findings, not code changes, unless explicitly assigned implementation.

### 1. First-Time User Agent

Role: impatient new user who wants the reward loop to make sense in under five minutes.

Prompt:

```text
You are auditing DopamineHabit as a first-time user. Start from a clean local state. Walk through onboarding, first habit completion, first token, first spin, and first reward. Identify every place where you are unsure what to do, why it matters, or what changed. Output a table with route, step, friction, severity, user quote, and recommended fix. Do not report code bugs unless they block the user journey.
```

### 2. Returning User Agent

Role: casual returning user with one habit, one reward, and a few tokens.

Prompt:

```text
You are a returning user trying to add more habit and reward options, then complete a rep and spin. Use seeded state with one jar, one habit, one reward, and inventory tokens. Audit discoverability, navigation, copy, disabled states, and feedback. Focus on where a user would think a feature is missing even if it exists somewhere else.
```

### 3. Power User Agent

Role: motivated user with multiple jars, rewards, milestones, and reward sessions.

Prompt:

```text
You are a power user trying to manage a mature setup. Audit batch workflows, editing, archiving, restoring, filtering, stats, reward history, fun money, and milestone progress. Find workflow gaps that slow repeated use. Output quick wins, strategic investments, and acceptable friction.
```

### 4. Behavior-Change Coach Agent

Role: skeptical habit coach focused on psychology and relapse recovery.

Prompt:

```text
Audit whether DopamineHabit supports behavior change without shame or confusion. Review the Naked Rule, integrity check-ins, missed days, partial slips, bonus reps, rewards, and copy tone. Identify gaps between the intended psychology and the actual UI. Convert each gap into a user-centered opportunity statement.
```

### 5. Accessibility and Constrained-Use Agent

Role: user with low vision, motor constraints, reduced-motion preference, and mobile web constraints.

Prompt:

```text
Audit the product using accessibility and small-screen constraints. Check labels, roles, selected states, touch targets, motion, color-only meaning, nested card structure, text density, and route discoverability. Output route-specific findings with severity and suggested acceptance criteria.
```

### 6. Competitive Gap Agent

Role: product strategist comparing DopamineHabit to habit trackers, streak apps, and reward/blocker tools.

Prompt:

```text
Audit DopamineHabit against common patterns from habit trackers, streak apps, app blockers, and reward systems. Do not copy competitors. Identify usability conventions users will expect, differentiators worth emphasizing, missing trust signals, and feature gaps. Output "how might we" opportunities ranked by user value and implementation effort.
```

## Backlog Synthesis Format

Every product-audit finding should be normalized into this shape:

```text
ID:
Title:
Persona:
Journey:
Evidence:
User impact:
Severity: P0/P1/P2/P3
Effort: S/M/L
Opportunity:
Acceptance criteria:
Dependencies:
```

## Immediate Recommendation

Start with PR10 and PR11 before deeper polish. The current product is mostly functionally present, but key features are hard to discover and local persisted state can obscure whether the user is seeing the newest experience. Fixing product legibility and local DB durability will make every later audit more trustworthy.
