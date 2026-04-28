# DopamineHabit Roadmap

This file is the current handoff map for local and cloud work. The product behavior source of truth remains `DOPAMINEHABIT_SPEC_CODEX.md`; keep this roadmap aligned with that spec as PR-sized checkpoints land.

## Current State

- Branch: `main`
- Current source of truth: latest pushed commit on `main`
- Expo owner: `daroruen`
- EAS project ID: `b57418e8-25f6-48ab-8302-5945a2c8d8d3`
- Web target: Expo Router static export to `dist`
- Preferred web hosting: EAS Hosting
- Portable fallback: Vercel via `vercel.json`
- Product quality audit: `PRODUCT_QUALITY_AUDIT.md`
- Product behavior source of truth: `DOPAMINEHABIT_SPEC_CODEX.md`
- Local persistence contract: `docs/PERSISTENCE.md`

## Completed Checkpoints

- PR1 scaffold: Expo Router app, TypeScript config, shared UI placeholders, app routes, pure game modules, Zustand store, persistence adapter, platform-safe audio/haptics/hooks, tests, and CI.
- PR2 onboarding: Naked Rule acceptance plus first jar, habit, reward, and integrity check-in setup.
- PR3 habit completion: home flow for logging habit reps, rate-limit feedback, token draw, token inventory, persisted completion records, and tests.
- PR4 cash-in and spin: token cash-in rules, wheel rendering/animation, deterministic pending spin resolution, near-miss fallthrough, persisted spin results, cashed-in token state, and tests.
- PR5 reward grants and sessions: awarded-tier reward selection with fallback, append-only `RewardGrant` records, persisted `ActiveRewardSession`, reward timer UI, end/early-end behavior, and timer reload tests.
- PR6 bonus round flow: persisted `BonusChain` lifecycle, deterministic bonus award resolution, bonus timers, timeout sync, bonus reward/token grants, max-chain behavior, and route UI/tests.
- PR7 rewards, habits, and jars management: create/edit/archive/restore flows, active/archived filtering, history-preserving jar and reward references, management entry points, and persistence tests.
- PR8 integrity loop: daily check-in UI, honesty streak/admission display, skipped-check-in and clock-tamper messaging, app-seen drift detection, append-only persisted check-in tests.
- PR9 milestones and fun money: earned/inventory jar progress, default and custom milestones, unlock feedback, optional fun-money balance accounting, bonus-token progress, and persistence tests.
- Post-PR9 agentic audit hardening: blocked repeat spin exploits, resumable interrupted spins, active reward/session guards, retroactive milestone unlocks, duplicate/skipped integrity check-in handling, and focused UX/accessibility feedback.
- Product quality audit: researched product-level agent prompt patterns, audited local product flows and persistence risks, and created a PR-sized improvement roadmap in `PRODUCT_QUALITY_AUDIT.md`.
- PR10 product legibility and navigation: restored the missing product spec, added persistent primary navigation plus a Manage hub, replaced placeholder Settings and Stats routes, surfaced add-more habit/reward/jar affordances from Home/onboarding, added build/local-data visibility, and added stats summary tests.
- PR11 local DB durability and data controls: added persisted-state versioning, migration helpers, old-envelope migration tests, Settings export/import/reset controls, stale-state recovery copy, and `docs/PERSISTENCE.md`.
- PR12 first-loop expansion and guided setup: added a post-onboarding next-step route, quick-add habit/reward templates, contextual concept copy, first-spin checklist state, and focused guidance tests.
- PR13 spin and reward comprehension: added a token-to-tier cash-in explainer, direct disabled-spin reasons, detailed post-spin outcome explanations, active reward recovery context, and focused comprehension tests.
- PR14 integrity reminder and settings completion: added a persisted reminder toggle, permission-aware local notification scheduling, Settings reminder status, Home check-in prompt, and no-shame integrity recovery copy.
- PR15 stats, progress, and coaching: added timeframe, jar, and habit filters, progress dashboard helpers, momentum score, rep rhythm bars, reward-energy breakdowns, and coaching cards.
- Cloud deployment handoff: EAS project link, GitHub-triggered EAS deploy workflow, web export script, Vercel static config, and deployment notes.
- Cloud deployment handoff follow-up: added `npm run handoff:cloud` verification gate and `CLOUD_DEPLOYMENT_HANDOFF.md` runbook for repeatable local-to-cloud transitions.

## Next Checkpoint

PR16 should focus on the agentic product audit harness.

Recommended scope:

- Add a `docs/agentic-product-audit-prompts.md` prompt pack.
- Add seeded journey states for first-time, returning, power, stale-state, accessibility, and recovery users.
- Add a lightweight route-render smoke test or browser verification script for core journeys.
- Add a backlog synthesis format with severity, evidence, user impact, effort, and acceptance criteria.
- Run a six-agent audit before major roadmap pivots.

## Later Checkpoints

- PR16 agentic product audit harness: prompt pack, seeded journey states, route-render smoke tests, and six-agent backlog synthesis.
- Native readiness: EAS build profiles, app icons/splash polish, notification permissions, and store metadata.

## Cloud Handoff Notes

- The clean handoff point is GitHub `main`; cloud work should start from the pushed repo state rather than local uncommitted files.
- If local-to-cloud conversion fails while computing the diff to remote, start a new cloud task from repo `rightawayileft/DopamineHabit`, branch `main`.
- For the simplest website link, try EAS deploy alias `dopaminehabit` first. Fallback aliases: `dopamine-habit`, `dopaminehabitapp`, `dopamine-habit-app`.
- Keep `npm run handoff:cloud` green before handoff.
- Follow `CLOUD_DEPLOYMENT_HANDOFF.md` for explicit handoff steps and completion criteria.
