# Cloud Deployment Handoff

This runbook captures the exact cloud handoff flow referenced by `ROADMAP.md`.

## Goal

Deploy DopamineHabit web from GitHub `main` through EAS Hosting, with Vercel as a portable fallback.

## Preconditions

- Expo owner is `daroruen`.
- EAS project is linked to `b57418e8-25f6-48ab-8302-5945a2c8d8d3`.
- GitHub branch `main` contains the handoff commit.

## Local verification gate

Run this command before handing off:

```bash
npm run handoff:cloud
```

It runs:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test -- --runInBand`
4. `npm run build:web`

## EAS Hosting handoff flow

1. Log in to Expo:
   ```bash
   npx eas-cli@latest login --browser
   ```
2. Confirm the linked project:
   ```bash
   npx eas-cli@latest project:info
   ```
3. Push verified `main` to GitHub.
4. In Expo dashboard, ensure `.eas/workflows/deploy.yml` is enabled for GitHub-triggered deploys on `main`.
5. Confirm production alias deployment:
   ```bash
   npx eas-cli@latest deploy:list --limit 5
   ```

### Alias order

Try aliases in this order when creating/updating production URL:

1. `dopaminehabit`
2. `dopamine-habit`
3. `dopaminehabitapp`
4. `dopamine-habit-app`

## Vercel fallback

If EAS Hosting is blocked, deploy the static export to Vercel using `vercel.json`:

1. `npm run build:web`
2. Import repo into Vercel.
3. Ensure build command is `npm run build:web`.
4. Ensure output directory is `dist`.

## Handoff completion criteria

- `npm run handoff:cloud` passes on the same commit pushed to `main`.
- EAS deployment is visible for latest `main` commit.
- Public web URL is reachable (EAS alias or Vercel fallback).
