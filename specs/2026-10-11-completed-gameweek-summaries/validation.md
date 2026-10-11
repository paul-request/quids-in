# Validation: Completed-Gameweek season summaries (Phase 18)

## Automated checks

1. Run the focused tests for `libs/quids-in/utility/results.test.ts`,
   `libs/quids-in/feature-shell/App.test.ts`,
   `libs/quids-in/feature-shell/GameweekStatsCard.test.ts` and
   `libs/quids-in/feature-shell/PlayerStats.test.ts`.
2. Run `npm run validate` and confirm lint, type-check, tests and build pass.
3. Calculation tests confirm only `ended === true` Gameweeks contribute to
   season summaries. Both `ended === false` and missing `ended` are excluded.
4. Dashboard tests confirm unfinished score changes can update selected-round
   results and live statistics without changing standings, slugs, average
   weekly position or balances.
5. Completion-transition tests confirm a newly completed Gameweek updates all
   applicable summaries together and is counted exactly once on repeated
   calculation or reload.
6. Gameweek-stat tests confirm the selected round retains its live metrics,
   while the season-average comparison uses completed rounds only and is
   omitted when no completed baseline with usable scores exists.
7. Player tests confirm completed-only totals, averages, best/worst Gameweeks,
   positions, transfers and balances. They also confirm Team value continues
   to use the latest imported Gameweek.
8. Empty-season and missing-score tests confirm no unfinished results appear
   in season summaries, existing empty states remain appropriate, and the
   fixed season contribution is preserved.
9. Existing tests continue to cover tie handling, participant ordering,
   penny allocation, cup accounting and unavailable Gameweek statistics.

## Snapshot and manual checks

1. Use a deterministic fixture with one completed and one unfinished
   Gameweek; compare each affected summary with values calculated from the
   completed round alone.
2. Change only the unfinished Gameweek's scores and confirm the selected
   Gameweek results and statistics change while all season summaries remain
   unchanged.
3. Change that Gameweek to `ended: true` and confirm its data appears in every
   affected summary in one update.
4. Test a snapshot with no completed Gameweeks, including a live selected
   round. Confirm the live card remains useful, season summaries exclude the
   live data, the Gameweek stats comparison is omitted, and player pages do
   not present live scores as season aggregates.
5. Test a player with no completed score but with a latest imported Team
   value. Confirm the existing empty state remains and the latest Team value
   is retained.
6. Review the code path for a direct player-page load and reload to confirm
   summaries are derived from the snapshot rather than preserved in transient
   state.

## Merge gate

This phase is ready to merge when the focused tests and `npm run validate`
pass, all acceptance checks above are evidenced, no unfinished Gameweek
contributes to a season aggregate, and selected-Gameweek live behaviour and
existing cup and balance semantics are preserved. Record any deployment or
real-data checks that cannot be completed before merge.

## Execution evidence

- `rtk npm --prefix /Users/paulbennett/development/quids-in test -- libs/quids-in/utility/results.test.ts libs/quids-in/feature-shell/App.test.ts libs/quids-in/feature-shell/GameweekStatsCard.test.ts libs/quids-in/feature-shell/PlayerStats.test.ts` — passed, 4 files and 95 tests.
- `rtk npm --prefix /Users/paulbennett/development/quids-in run validate` — passed: ESLint, Svelte/TypeScript checks, all 19 test files (198 tests), and production build.
- No deployment or post-deployment check was run.
