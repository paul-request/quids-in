# Validation — Gameweek stats (Phase 7)

This phase is ready to merge when every applicable check below passes.

## Calculations

- [ ] Statistics use stored scoreboard points and do not apply transfer
      deductions again.
- [ ] Highest score is the maximum usable score for the selected Gameweek.
- [ ] Lowest score is the minimum usable score for the selected Gameweek.
- [ ] Tied highest or lowest scores produce the shared numeric metric without
      a fabricated tie-break.
- [ ] League average equals the sum of usable selected-Gameweek scores divided
      by their count.
- [ ] Spread equals highest score minus lowest score.
- [ ] The season benchmark equals the arithmetic mean of each recorded
      Gameweek with usable scores' league-average score.
- [ ] The benchmark includes the selected Gameweek.
- [ ] Variance equals selected Gameweek league average minus the season
      benchmark.
- [ ] Positive variance has a `+` prefix, negative variance has a `−` prefix,
      and equal variance displays as `0`.
- [ ] Missing participant scores are excluded from aggregates and are never
      silently converted to zero.
- [ ] A selected Gameweek with no usable scores returns an explicit
      unavailable result and does not fabricate statistics or a comparison.
- [ ] No derived statistics are added to season JSON files.

## Dashboard card

- [ ] A card titled `Gameweek stats` appears as the first summary-grid card
      directly beneath the selected Gameweek card.
- [ ] The card displays `Highest score`, `Lowest score`, `League average`,
      `Spread`, and `Variance from season average`.
- [ ] Every score-derived value uses at most two decimal places without
      unnecessary trailing zeroes.
- [ ] Changing the Gameweek selector updates the card values and variance.
- [ ] An all-missing selected Gameweek presents a clear unavailable message.
- [ ] The card is a labelled region with a visible `h2` and semantic markup
      that associates every metric name with its value.

## Responsive layout and accessibility

- [ ] The selected Gameweek card remains full width.
- [ ] Gameweek stats is first in source and keyboard order within the shared
      responsive summary grid.
- [ ] Overall standings, `The slugs`, average weekly position, and profit and
      loss follow Gameweek stats in their existing source order.
- [ ] Narrow screens show one card per row without page-level horizontal
      scrolling.
- [ ] The card remains readable at supported phone, tablet, and desktop
      widths.
- [ ] The Gameweek selector remains keyboard operable with a visible focus
      indicator, and changing it announces the displayed Gameweek as before.

## Regression and scope

- [ ] Existing selected-Gameweek results, winner and slug indicators,
      fractional-win standings, chips, average weekly position, and profit
      and loss behaviour remain unchanged.
- [ ] Utility tests cover one and multiple Gameweeks, tied highs/lows,
      decimal averages, missing and all-missing scores, and
      positive/negative/zero variance.
- [ ] Presentation tests cover card labels, formatting, unavailable state,
      selector-driven updates, and semantic content.
- [ ] Existing tests continue to pass.
- [ ] `npm run validate` passes linting, type checking, Vitest, and the
      production build.
- [ ] No player-history feature, chart, backend, runtime data request,
      importer change, score editing, payment feature, or new dependency is
      introduced.

## Sign-off

Once every box is checked, the Gameweek stats card is ready to merge into
`main`.

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
