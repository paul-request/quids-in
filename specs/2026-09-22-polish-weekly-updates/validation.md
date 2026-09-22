# Validation: Weekly update workflow and responsive polish

## Automated checks

1. Run the focused tests for any changed dashboard, player-stat, importer, or
   utility files and confirm they pass.
2. Run `npm run lint` and confirm there are no new diagnostics.
3. Run `npm run typecheck` and confirm Svelte and TypeScript checks pass.
4. Run `npm run test` and confirm the complete Vitest suite passes.
5. Run `npm run build` and confirm the production bundle is generated
   successfully.
6. Run `npm run validate` as the final combined gate.
7. If the importer or its documentation is changed, run the importer tests and
   verify that generated season data still validates without changing the
   documented field meanings or ordering rules.

## Browser and accessibility checks

- At phone, tablet, and desktop viewport widths, open the dashboard and verify
  there is no horizontal page overflow.
- Confirm the selected Gameweek card, summary cards, tables, selectors, and
  player-stat cards remain readable and usable at each viewport width.
- Use keyboard navigation to reach the Gameweek selector, sortable headings,
  player/team links, and the player-stats back link; verify visible focus and
  meaningful accessible names.
- Select a past Gameweek, use the existing sorting controls, open a player
  stats route, and return to the dashboard. Confirm existing values and
  behaviour are unchanged.
- Review the README workflow against the actual importer and validation
  commands, including the artifact-only scheduled workflow.

## Manual acceptance checks

- A maintainer can follow the README from a weekly data update through review,
  validation, and committing the snapshot without needing undocumented steps.
- The documentation makes clear which values are imported, which are derived,
  and that the scheduled workflow does not commit or deploy.
- The fuller dashboard looks reasonable on a phone and remains efficient to
  use on tablet and desktop.
- No new responsive change obscures data, removes keyboard access, or changes
  existing statistics and navigation.

## Merge gate

The feature is ready to merge only when the documentation matches the current
workflow, responsive browser checks pass at all supported widths, accessibility
checks pass, `npm run validate` passes, and no existing dashboard or player
stats behaviour regresses.


## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
