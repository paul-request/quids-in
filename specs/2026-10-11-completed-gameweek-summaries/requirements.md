# Requirements: Completed-Gameweek season summaries (Phase 18)

## Source

Implement Phase 18 of the [roadmap](../roadmap.md): keep live Gameweek
results visible while preventing provisional results from changing season
summaries.

## Context

- `Gameweek.ended` is optional. The importer sets it to `true` only when FPL
  marks the event both `finished` and `data_checked`; old snapshots and
  unavailable status may omit it.
- The dashboard shows the selected Gameweek's scores and statistics alongside
  season standings, slug rankings, average weekly position and profit/loss.
- Player pages show season totals and averages, best/worst Gameweeks, transfer
  counts and balances. They also show the latest imported Team value.
- The selected Gameweek and its statistics may include live scores. Season
  summaries must instead represent only completed Gameweeks.

## Scope

In scope:

- Use completed Gameweeks consistently for dashboard and player-page season
  aggregates.
- Keep selected-Gameweek results and statistics responsive to live score
  changes.
- Recalculate summaries from the season snapshot on every load, including
  direct player-page visits.
- Include a newly completed Gameweek in all affected summaries together once
  the snapshot marks it completed.

Out of scope:

- Changing how the importer determines `ended`, the snapshot schema, or FPL
  requests.
- Changing the selected Gameweek's score, result, indicator, or live-statistic
  calculations.
- Changing cup brackets, cup-result rules, or cup entry and prize rules.
- Browser-side FPL requests, polling, or automatic refresh of an already-open
  page.
- Changing team value to use a historical rather than latest imported value.
- Changing the existing season contribution, balance labels, or display
  semantics.

## Functional requirements

### Definition of completed

1. A Gameweek is eligible for season summaries only when `ended === true`.
   `ended === false` and omitted `ended` are both ineligible.
2. Do not infer completion from scores, the Gameweek number, or the browser
   clock. Retain support for snapshots that omit completion metadata.

### Dashboard season summaries

3. Calculate overall winner standings and `The slugs` using completed
   Gameweeks only. An unfinished Gameweek contributes neither wins nor losses.
4. Calculate average weekly position using completed Gameweeks only. Preserve
   the existing ranking, missing-score and tie behaviour for eligible
   Gameweeks.
5. Calculate season and weekly balances using completed Gameweeks only:
   exclude unfinished Gameweek winnings and its £1 weekly stake. Preserve the
   existing fixed season contribution, display semantics, penny allocation and
   cup accounting.
6. A change to scores in an unfinished Gameweek may update that selected
   Gameweek's results card and its Gameweek statistics, but must not change
   requirements 3–5.
7. Recalculate these summaries from the current snapshot on every load. A
   reload or direct route to a player page must not reintroduce unfinished
   results, and repeated calculations must not double-count a Gameweek.

### Gameweek statistics

8. Keep selected-Gameweek metrics (highest, lowest, league average, FPL
   average when available, and spread) based on the selected Gameweek's
   available scores, including live scores.
9. Calculate the season-average comparison using completed Gameweeks only,
   retaining the current handling of Gameweeks without usable scores.
10. If there is no completed Gameweek with usable scores, omit the
    “Difference from season average” row. Do not use the selected live
    Gameweek as its own baseline or display a misleading zero.
11. Keep the comparison available when at least one completed Gameweek
    provides a usable baseline, regardless of whether the selected Gameweek is
    completed or in progress.

### Player-page season aggregates

12. Calculate total points, average weekly score, highest and lowest score and
    their Gameweek labels, average league position, total transfers, season
    profit/loss and current profit/loss from completed Gameweeks only.
13. Keep the Player page's Team value based on the latest imported Gameweek,
    including when that Gameweek is unfinished.
14. When there are no completed scores for a player, retain the existing
    no-recorded-scores state and balance presentation; do not report an
    unfinished score as a season aggregate.

### Completion transition and empty season

15. When `ended` changes to `true` in a refreshed snapshot, include that
    Gameweek in every applicable dashboard and player-page aggregate in the
    same calculation, exactly once.
16. With no completed Gameweeks, show no unfinished wins, losses, positions,
    winnings or weekly stakes in season summaries. Preserve the existing fixed
    season contribution in season balances and keep live results visible in
    the selected-Gameweek cards.

## Decisions

- **Completion gate:** only explicit `ended === true` is sufficient. This
  matches the importer’s finished-and-checked status and treats missing legacy
  metadata as unknown.
- **Selected versus season data:** selected-Gameweek cards remain live; all
  season aggregates use completed Gameweeks.
- **Season-average baseline:** use completed Gameweeks with usable scores.
  Omit the comparison row when no baseline exists.
- **Player Team value:** continue to show the latest imported value. It is a
  current snapshot, not a season aggregate.
- **Refresh model:** summaries update when a new snapshot is loaded. Phase 18
  does not add live polling or promise updates to an already-open page.
- **Existing semantics:** preserve the fixed season contribution, balance
  labels, cup rules, sorting and missing-score behaviour except for excluding
  unfinished Gameweeks from the specified aggregates.
