# Validation — Average Weekly Position (Phase 5)

This phase is ready to merge when every applicable check below passes.

## Calculation

- [ ] Positions are derived from the stored net Gameweek score without
      applying transfer deductions again.
- [ ] Scores are ranked descending using competition positions such as
      `1, 2, 2, 4`.
- [ ] Every participant tied on a score receives the same position.
- [ ] Missing participant scores are treated as zero and ranked consistently.
- [ ] Each average is the arithmetic mean of a participant's positions across
      every recorded Gameweek.
- [ ] Changing the selected Gameweek does not change the season-wide average
      position values.
- [ ] Results sort by average position ascending and retain season participant
      order when averages are equal.
- [ ] A valid season with no Gameweeks returns no average-position rows.
- [ ] No derived positions or averages are added to season JSON files.

## Dashboard card

- [ ] A card titled `Average weekly position` appears beneath the full-width
      selected Gameweek card.
- [ ] The card identifies each participant by name and team.
- [ ] The card shows every participant when at least one Gameweek exists.
- [ ] Average positions use at most two decimal places without unnecessary
      trailing zeroes.
- [ ] The ranking is rendered as a semantic HTML table with `Player`, `Team`,
      and `Average position` column headings.
- [ ] An empty season displays a clear no-data message rather than zero or a
      fictional average.
- [ ] The card is a labelled region and the page retains one `h1` followed by
      logical `h2` card headings.

## Responsive layout and accessibility

- [ ] The selected Gameweek card remains full width at every viewport.
- [ ] Overall standings, `The slugs`, and average weekly position occupy a
      responsive auto-fitting grid beneath the Gameweek card.
- [ ] The summary cards preserve source order when displayed in one or
      multiple columns.
- [ ] Narrow screens show one card per row.
- [ ] Tables remain readable without causing page-level horizontal scrolling.
- [ ] Existing keyboard operation, focus visibility, landmark labels, and
      semantic table navigation remain intact.

## Regression and scope

- [ ] Existing selected-Gameweek, winner, fractional-win, weekly-loss, and
      standings behaviour is unchanged.
- [ ] Utility tests cover competition ties, multiple Gameweeks, equal
      averages, missing scores, deterministic ordering, and an empty season.
- [ ] Presentation tests cover populated and empty average-position cards.
- [ ] Existing tests continue to pass.
- [ ] `npm run validate` passes linting, type checking, Vitest, and the
      production build.
- [ ] No charts, trends, date filtering, historical comparison, live request,
      backend, importer change, or deployment change is introduced.

## Sign-off

Once every box is checked, the average weekly position card is ready to merge
into `main`.

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
