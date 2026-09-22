# Validation — Participants List (Phase 1)

This phase is complete when:

- [ ] The feature shell imports `data/season-2025-26.json`.
- [ ] Exactly 12 participant cards render from the JSON data.
- [ ] Every card shows the participant's `name` and `teamName`.
- [ ] Participant display values are not duplicated as hardcoded component
      data.
- [ ] A reusable header component renders the quids-in logo and app title.
- [ ] The header is positioned at the top-left of the page.
- [ ] The logo renders at 48px by 48px (`3rem` by `3rem`) and retains its
      aspect ratio.
- [ ] The header brand is keyboard accessible and exposes a labelled home link.
- [ ] The responsive layout remains readable at phone, tablet, and desktop
      widths.
- [ ] Component tests cover the header brand, participant count, and
      representative names and team names.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes with zero Svelte and TypeScript diagnostics.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] No dashboard, live FPL integration, backend, authentication, or
      deployment setup is introduced.

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
