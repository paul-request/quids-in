# Plan — Winner Logic (Phase 2)

## 1. Define the season and Gameweek data model

1. Extend each participant in `data/season-2025-26.json` with a stable
   numeric `id`.
2. Define each Gameweek entry as an ordered array item containing its
   Gameweek number and a score map keyed by participant ID.
3. Keep the Gameweeks array append-only and ordered chronologically; the last
   item is the latest recorded Gameweek.
4. Document that a missing participant ID in a Gameweek score map is treated
   as a score of zero by the rules engine.
5. Keep derived winners, last-place finishers, and leaderboard totals out of
   the JSON source of truth; calculate them from participant and Gameweek data.

## 2. Implement the single-Gameweek rules

1. Add typed TypeScript interfaces for participants, Gameweeks, score maps,
   winner results, and leaderboard rows.
2. Implement a pure function that finds the highest score for one Gameweek.
3. Return every participant sharing the highest score as a joint-winner set.
4. Calculate each winner's fractional win share as `1 / winnerCount`.
5. Find the lowest score for the same Gameweek and return every participant
   sharing it as a joint-last-place set.
6. Treat missing score entries as zero and preserve participant identity using
   numeric IDs.
7. Do not assign win shares to last-place finishers; last-place output is
   informational only.
8. Define explicit behaviour for an empty Gameweek and invalid score input
   rather than silently returning a success-shaped result.

## 3. Implement season aggregation

1. Add a pure function that processes all recorded Gameweeks in array order.
2. Sum each participant's fractional win shares across Gameweeks.
3. Return leaderboard rows containing the participant identity and total wins,
   with the lowest-ranked row(s) clearly representing the season bottom.
4. Sort the leaderboard by total wins descending so the first row is the
   season leader and the final row(s) are the season bottom when totals tie.
5. Use the stable participant order from the season data as the deterministic
   tie-breaker when total wins are equal.
6. Expose season-last-place participants as all participants tied on the
   minimum total wins, without assigning them a negative or fractional
   penalty.
7. For a season with no recorded Gameweeks, return one zero-win row for every
   known participant and identify all participants as tied for last place.

## 4. Add Vitest coverage

1. Test a single Gameweek with one clear winner.
2. Test a two-way tie and verify both winners receive `0.5`.
3. Test a three-way tie and verify each winner receives `1 / 3`.
4. Test a single last-place participant and a tied-last Gameweek.
5. Test missing participant scores being treated as zero, including the
   effect on last-place detection.
6. Test multiple Gameweeks aggregating fractional wins correctly.
7. Test leaderboard ordering, season-last-place detection, and deterministic
   ordering for equal totals.
8. Test empty and invalid inputs according to the documented error/return
   behaviour.

## 5. Verify against [validation.md](./validation.md)

1. Run the focused Vitest suite for the rules engine.
2. Run `npm run lint`, `npm run test`, and `npm run build`.
3. Confirm no UI dashboard or live FPL integration has been added.
4. Work through every validation checkbox before merging the branch.
