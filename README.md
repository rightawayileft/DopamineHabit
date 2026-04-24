# DopamineHabit

DopamineHabit is a local-first habit tracker that turns every completed habit rep into a token draw and weighted reward spin. The product is designed as a shared Expo codebase that runs on iOS, Android, and web while preserving the same core psychology, state machine, and persistence rules across platforms.

## Quickstart

1. `npm install`
2. `npm start`

## Project Structure

The app follows the folder structure defined in the product spec. Core logic lives in `game/`, persisted state lives in `store/`, routes live in `app/`, and shared UI lives in `components/`.

## Testing

Run `npm test`.

## Web Deployment

Build the static web app with `npm run build:web`; Expo exports the site to `dist/`.

Preferred hosting is EAS Hosting because this is an Expo Router app. After the EAS project is connected to GitHub, pushes to `main` deploy from the cloud via `.eas/workflows/deploy.yml`.

1. `npx eas-cli@latest login --browser`
2. `npx eas-cli@latest init`
3. `npm run build:web`
4. `npx eas-cli@latest deploy --prod --alias dopaminehabit`

Try `dopaminehabit` first for the shortest public URL. If that alias is taken, try `dopamine-habit`, `dopaminehabitapp`, or `dopamine-habit-app`.

Vercel is also supported via `vercel.json` with `npm run build:web` and `dist`.

## Phase Status

Phase 1 MVP in progress.

See `ROADMAP.md` for completed checkpoints, the next PR-sized scope, and cloud handoff notes.

## Spec

Source of truth: `DOPAMINEHABIT_SPEC_CODEX.md`
