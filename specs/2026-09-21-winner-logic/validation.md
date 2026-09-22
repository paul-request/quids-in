# Validation — Winner Logic (Phase 2)

This phase is done, and safe to merge, when all of the following are true.

## Data model

- [ ] Every participant in `data/season-2025-26.json` has a unique numeric
      `id` from `1` through `12`.
- [ ] The `gameweeks` field is an array whose entries are ordered
      chronologically and contain a Gameweek number plus a score map keyed by
      participant ID.
- [ ] The latest recorded Gameweek is always the last array entry; no separate
      current-Gameweek field is introduced.
- [ ] Derived winners, last-place finishers, fractional shares, and leaderboard
      totals are not duplicated in the JSON source data.
- [ ] The JSON remains valid and contains no live FPL/API/backend dependency.

## Rules engine behaviour

- [ ] A single-winner Gameweek returns the highest score and exactly one
      winner with a win share of `1`.
- [ ] A two-way tie returns both winners with a win share of `0.5` each.
- [ ] A three-way tie returns all three winners with a win share of `1 / 3`
      each.
- [ ] A single lowest scorer is returned as the last-place finisher.
- [ ] A tie for the lowest score returns every tied participant as joint
      last-place finishers.
- [ ] Last-place finishers receive no negative, fractional, or additional win
      value.
- [ ] A participant missing from a Gameweek score map is evaluated as having
      scored zero.
- [ ] Season aggregation sums fractional shares across every Gameweek in
      array order.
- [ ] The leaderboard is sorted by total wins descending.
- [ ] The first leaderboard row identifies the season leader and the final
      row or rows identify every participant tied for the minimum total wins.
- [ ] Equal leaderboard totals have deterministic ordering based on the
      participant order in the season data.
- [ ] Empty-season aggregation returns a valid zero-win result for every
      known participant.
- [ ] Invalid IDs, malformed/non-finite scores, duplicate participant IDs,
      non-canonical score keys, empty score sets, malformed participant or
      Gameweek collections, duplicate Gameweek numbers, and out-of-order
      Gameweeks are rejected with explicit errors.

## Automated checks

- [ ] Vitest tests cover single winners, two-way ties, three-way ties,
      single last place, tied last place, missing scores,
      multi-Gameweek aggregation, leaderboard ordering and season-last-place
      detection, empty data, invalid input, canonical score keys, and ordered
      Gameweek validation.
- [ ] `npm run lint` passes with no errors.
- [ ] `npm run test` passes.
- [ ] `npm run build` completes without errors and produces a `dist/` output.

## Scope and regression checks

- [ ] The existing Phase 1 participant-list behaviour is not regressed.
- [ ] No dashboard, Gameweek detail view, winner UI, live FPL integration,
      deployment setup, or prize-money feature is added in this phase.
- [ ] The implementation uses pure, reusable calculation functions that can
      be consumed by the Phase 3 dashboard.
- [ ] `git status` contains only intended Phase 2 implementation and
      specification changes.

## Sign-off

Once every box above is checked, the Phase 2 rules engine is ready to merge
into `main`, and work can begin on Phase 3 — Dashboard: current round and
overall standings.

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
