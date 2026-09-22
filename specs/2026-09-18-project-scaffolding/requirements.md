# Requirements — Project Scaffolding (Phase 0)

## Source

This is [Phase 0](../roadmap.md) of the quids-in roadmap:

> Initialise a Svelte + Vite + TypeScript project in this repo. Add basic
> linting/formatting. Add a placeholder `data/season-2025-26.json` with the
> 12 participants (name, FPL team name) and no Gameweek results yet. Run it
> locally via `npm run dev` — no deployment/hosting setup yet.

## Scope

In scope for this phase:

- A working Svelte + Vite + TypeScript project, runnable locally with
  `npm run dev`.
- ESLint + Prettier configured for linting and formatting.
- A placeholder `data/season-2025-26.json` file containing 12 dummy
  participants (name, FPL team name) and no Gameweek results.
- A minimal placeholder page rendered by the app: the supplied custom
  quids-in logo displayed prominently and a short note that the app is
  under construction. This is just to prove the scaffolding works — it
  does not yet read from the JSON file.
- Responsive placeholder styling so the logo and text remain usable on
  phone, tablet, and desktop viewport widths.
- `npm` as the package manager.

Out of scope for this phase (covered by later phases per the roadmap):

- Reading/rendering the participants list from the JSON file (Phase 1).
- Any Gameweek scores, winner logic, or dashboard UI (Phases 2-3).
- Real season data — names, team names, and scores stay as placeholders
  until Phase 4.
- Any deployment/hosting setup (Phase 10).
- Unit testing setup with Vitest (introduced when Phase 2 needs it for the
  winner logic — not required for scaffolding itself, but the project
  structure shouldn't preclude adding it later).

## Decisions

- **Framework:** Svelte + Vite (no SvelteKit), TypeScript — per
  [tech-stack.md](../tech-stack.md).
- **Linting/formatting:** ESLint + Prettier, kept minimal (default/
  recommended rule sets rather than a heavily customised config).
- **Package manager:** npm.
- **Placeholder page content:** the supplied custom quids-in logo is
  displayed prominently alongside a short "under construction" note.
  Styling remains intentionally minimal while keeping the branded visual
  treatment responsive across phone, tablet, and desktop viewport widths.
- **Placeholder data:** `data/season-2025-26.json` with 12 made-up
  participants (name + FPL team name only, per the mission/tech-stack
  docs), empty/no Gameweek results array yet. This file is not read by
  the app in this phase — it just needs to exist with the right shape so
  Phase 1 can start reading it immediately.
- **Repo visibility:** the GitHub repo for this project will be
  **public**, on a personal (non-work) GitHub account — required because
  GitHub Pages is free only for public repos. No work-related code or
  references are to be committed here at any point.
- **Dependency lock file:** `package-lock.json` is committed (not
  gitignored). It only ever resolves against the public npm registry for
  this project, so it carries no work-related references and is safe to
  publish in a public repo.

## Context

- No git repository existed for quids-in before this work; it has now
  been initialised (`git init -b main`) with the existing `specs/`
  constitution committed as a baseline.
- This is a solo/personal project for a private group of 12 friends —
  no CI, no collaborators, no PR review process required. Validation is
  by running the app locally and checking it behaves as expected.
- See [mission.md](../mission.md) and [tech-stack.md](../tech-stack.md)
  for the full constitution this phase must stay consistent with.
