# Requirements — Average Weekly Position (Phase 5)

## Source

This feature implements Phase 5 of the quids-in roadmap:

> Add an average weekly position card to the dashboard and place the
> season-summary cards in a responsive grid beneath the full-width Gameweek
> card.

## Scope

In scope:

- Derive each participant's finishing position for every recorded Gameweek.
- Calculate each participant's mean position across all recorded Gameweeks.
- Add a dashboard card titled `Weekly averages`.
- Show each participant's combined player/team identity, average position, and
  average weekly score.
- Order participants from the best average position to the worst.
- Replace the fixed two-column season-summary row with a responsive card grid
  containing overall standings, `The slugs`, and average weekly position.
- Add utility and presentation tests for the calculation, ordering, rendering,
  empty state, and responsive structure.

Out of scope:

- Changing winner, fractional-win, weekly-loss, or selected-Gameweek rules.
- Weighting recent Gameweeks differently from earlier Gameweeks.
- Filtering the average to a user-selected range of Gameweeks.
- Storing derived positions or averages in the season JSON.
- Adding charts, trends, position movement, or historical-season comparisons.
- Changing the FPL data importer, scheduled workflow, or deployment workflow.

## Decisions

- **Position source:** Position is derived from the final net `points` value
  already stored for each participant in each Gameweek. Transfer deductions
  must not be applied again.
- **Competition ranking:** Participants with equal scores share the same
  position and the following position skips the occupied places. For example,
  scores producing positions `1, 2, 2, 4` retain those positions for the
  average.
- **Missing scores:** A missing participant score follows the existing
  Gameweek result rule and is treated as zero. Participants tied on zero share
  the corresponding competition rank.
- **Average:** A participant's average weekly position is the arithmetic mean
  of their derived positions across every recorded Gameweek.
- **Average weekly score:** A participant's average weekly score is the
  arithmetic mean of their usable recorded scoreboard scores. Missing scores
  are excluded and are not treated as zero.
- **Season-wide metric:** The average uses the full recorded season and does
  not change when the selected Gameweek changes.
- **Display precision:** Average positions display with at most two decimal
  places and no unnecessary trailing zeroes.
- **Ranking order:** The card sorts average positions ascending, because a
  lower position is better. Equal averages retain season participant order.
- **Participants:** Every season participant appears when at least one
  Gameweek has been recorded.
- **Empty season:** When no Gameweeks have been recorded, the card shows a
  clear no-data message rather than displaying zero or a fictional position.
- **Card semantics:** The ranking uses a semantic HTML table with columns for
  player, team, and average position.
- **Responsive layout:** The selected Gameweek card remains full width. The
  three season-summary cards beneath it use an auto-fitting grid that wraps
  according to available space while preserving source order: overall
  standings, `The slugs`, then average weekly position. On narrow screens,
  every card occupies one column. The grid must allow later summary cards,
  including the planned Phase 6 `Season balance` card, without a new layout
  system.
- **Rules ownership:** Average-position logic belongs in the utility layer.
  The Svelte components consume its typed result and do not reproduce ranking
  or averaging rules.

## Context

The dashboard already presents the selected Gameweek at full width and shows
overall standings and weekly losses underneath. Average weekly position adds
a consistency measure: it reflects where each participant typically finishes,
not only how often they finish first or last.

The implementation remains static and build-time driven. It derives the new
metric from the existing season snapshot and requires no new data source,
backend, or runtime request.
