# Validation — Project Scaffolding (Phase 0)

This phase is done, and safe to merge, when all of the following are true.

## Running locally

- [ ] `npm install` completes without errors on a clean checkout.
- [ ] `npm run dev` starts a local Vite dev server without errors.
- [ ] Opening the local dev server URL in a browser shows the quids-in
      placeholder page: the supplied logo and a short "under construction"
      note — not the default Vite/Svelte starter content.
- [ ] The placeholder page is responsive: the logo scales within the
      viewport and the note remains readable at phone, tablet, and desktop
      widths.
- [ ] `npm run build` completes without errors and produces a `dist/`
      output.

## Linting and formatting

- [ ] `npm run lint` runs and passes with no errors on the scaffolded
      codebase.
- [ ] `npm run format` (Prettier) runs successfully and formatting is
      consistent (e.g. running it twice produces no further changes).

## Placeholder data

- [ ] `data/season-2025-26.json` exists.
- [ ] It contains exactly 12 participant entries, each with a `name` and
      `teamName` field (no FPL manager name field — matches the
      tech-stack/roadmap decision).
- [ ] It contains no real Gameweek scores (dummy/placeholder data only, or
      an empty results array).
- [ ] The file is valid JSON (e.g. parses without error via
      `node -e "JSON.parse(require('fs').readFileSync('data/season-2025-26.json'))"`
      or equivalent).

## Repo hygiene

- [ ] `git status` is clean after a fresh `npm install` (i.e.
      `node_modules/` and `dist/` are properly gitignored, not tracked).
- [ ] `package-lock.json` **is** committed and tracked (not gitignored).
- [ ] `README.md` documents install, dev, lint, and format commands.
- [ ] No leftover scaffold boilerplate (default logos, counter demo,
      sample test files) remains in the codebase.
- [ ] No work-related (L&G) code, comments, credentials, or registry
      references are present anywhere in the repo — this repo is/will be
      public.

## Consistency with the constitution

- [ ] Nothing added in this phase reads live FPL data, requires a backend,
      or introduces any paid service — consistent with
      [mission.md](../mission.md) and [tech-stack.md](../tech-stack.md).
- [ ] No deployment/hosting configuration has been added yet (that's
      Phase 10) — the app is local-only at this point.

## Sign-off

Once every box above is checked, Phase 0 is complete and this branch can
be merged into `main`, at which point work can begin on
[Phase 1 — Participants list](../roadmap.md).

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
