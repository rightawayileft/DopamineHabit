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

## Completed Checkpoints

- PR1 scaffold: Expo Router app, TypeScript config, shared UI placeholders, app routes, pure game modules, Zustand store, persistence adapter, platform-safe audio/haptics/hooks, tests, and CI.
- PR2 onboarding: Naked Rule acceptance plus first jar, habit, reward, and integrity check-in setup.
- PR3 habit completion: home flow for logging habit reps, rate-limit feedback, token draw, token inventory, persisted completion records, and tests.
- PR4 cash-in and spin: token cash-in rules, wheel rendering/animation, deterministic pending spin resolution, near-miss fallthrough, persisted spin results, cashed-in token state, and tests.
- PR5 reward grants and sessions: awarded-tier reward selection with fallback, append-only `RewardGrant` records, persisted `ActiveRewardSession`, reward timer UI, end/early-end behavior, and timer reload tests.
- PR6 bonus round flow: persisted `BonusChain` lifecycle, deterministic bonus award resolution, bonus timers, timeout sync, bonus reward/token grants, max-chain behavior, and route UI/tests.
- PR7 rewards, habits, and jars management: create/edit/archive/restore flows, active/archived filtering, history-preserving jar and reward references, management entry points, and persistence tests.
- PR8 integrity loop: daily check-in UI, honesty streak/admission display, skipped-check-in and clock-tamper messaging, app-seen drift detection, append-only persisted check-in tests.
- Cloud deployment handoff: EAS project link, GitHub-triggered EAS deploy workflow, web export script, Vercel static config, and deployment notes.
- Cloud deployment handoff follow-up: added `npm run handoff:cloud` verification gate and `CLOUD_DEPLOYMENT_HANDOFF.md` runbook for repeatable local-to-cloud transitions.

## Next Checkpoint

PR9 should focus on milestones and fun money.

Recommended scope:

- Surface jar milestone progress and unlocked milestone states.
- Add fun-money accounting display and settings per jar.
- Update token-to-jar progress when tokens are earned or cashed in.
- Add visible milestone unlock feedback.
- Add tests for milestone progress, unlock persistence, and fun-money totals.

## Later Checkpoints

- Milestones and fun money: visible jar progress, milestone unlocks, and optional fun-money accounting.
- Polish: responsive mobile web layout, accessibility pass, reduced-motion handling, richer sound/haptic adapters.
- Native readiness: EAS build profiles, app icons/splash polish, notification permissions, and store metadata.

## Cloud Handoff Notes

- The clean handoff point is GitHub `main`; cloud work should start from the pushed repo state rather than local uncommitted files.
- If local-to-cloud conversion fails while computing the diff to remote, start a new cloud task from repo `rightawayileft/DopamineHabit`, branch `main`.
- For the simplest website link, try EAS deploy alias `dopaminehabit` first. Fallback aliases: `dopamine-habit`, `dopaminehabitapp`, `dopamine-habit-app`.
- Keep `npm run handoff:cloud` green before handoff.
- Follow `CLOUD_DEPLOYMENT_HANDOFF.md` for explicit handoff steps and completion criteria.
