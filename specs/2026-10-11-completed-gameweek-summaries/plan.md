# Plan: Completed-Gameweek season summaries (Phase 18)

## 1. Establish the completion filter

1. Reuse the existing `Gameweek.ended` metadata; do not change importer
   status handling or infer status from scores.
2. Add or reuse a small shared predicate for season-summary eligibility if
   needed. It must return true only for `ended === true`.
3. Keep single-Gameweek result and selected-Gameweek calculations independent
   of this filter so live results remain visible.

## 2. Gate dashboard season aggregates

1. In `libs/quids-in/utility/results.ts`, apply the completion filter to
   `calculateSeasonLeaderboard`, `calculateBiggestSlugs` and
   `calculateAverageWeeklyPosition`.
2. Apply it to weekly winnings and weekly stake counts in
   `calculateSeasonBalances`, preserving the fixed season contribution,
   existing penny allocation and cup accounting.
3. In `calculateGameweekStats`, retain selected-Gameweek metrics from all
   usable scores, but build the season-average baseline from completed
   Gameweeks only.
4. Represent a missing completed baseline explicitly in the result type and
   omit “Difference from season average” in
   `libs/quids-in/feature-shell/GameweekStatsCard.svelte`.

## 3. Gate player-page aggregates

1. In `calculatePlayerStats` in `libs/quids-in/utility/results.ts`, use only
   completed Gameweeks for score totals and averages, best/worst scores and
   labels, average league position, and transfer totals.
2. Ensure the displayed season and current profit/loss use the completed-only
   balances from `calculateSeasonBalances`.
3. Keep `calculateTeamValue` on the latest imported Gameweek; retain the
   existing no-completed-score empty state and its balance presentation.

## 4. Add calculation and UI regression tests

1. Extend `libs/quids-in/utility/results.test.ts` for completed, unfinished
   (`ended: false`) and unknown-status Gameweeks across every affected
   aggregate.
2. Verify live score changes affect the selected Gameweek result and
   statistics but do not affect dashboard season aggregates.
3. Verify an unfinished Gameweek is included once after its status becomes
   completed, and repeated calculations do not change the result.
4. Verify the season-average comparison excludes unfinished rounds and is
   absent when no completed Gameweek has usable scores.
5. Extend player-stat tests for completed-only values, no completed scores,
   and the unchanged latest-imported Team value.
6. Verify the no-completed-Gameweeks case, missing scores, and existing
   tie, ordering, penny-split and cup-accounting behaviour.

## 5. Document and update roadmap status

1. Update `README.md` only if its description of dashboard or player
   statistics needs to explain the completed-Gameweek rule.
2. Update the Phase 18 status in `specs/roadmap.md` only after implementation
   and validation are complete. Preserve unrelated roadmap edits.

## 6. Validate and record evidence

1. Run the focused result, dashboard-card and player-page tests.
2. Run `npm run validate`.
3. Complete the checks in [validation.md](./validation.md), recording exact
   commands, outcomes and any remaining manual or deployment checks.
4. Review the final diff to confirm live selected-Gameweek behaviour and
   existing cup, balance and missing-score semantics are preserved.
