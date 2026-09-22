# Requirements — Gameweek stats (Phase 7)

## Source

This feature implements Phase 7 of the quids-in roadmap:

> Add a Gameweek stats card for the selected Gameweek, showing score
> distribution and a comparison with the recorded season's typical Gameweek.

## Scope

In scope:

- Derive highest score, lowest score, league average score, and score spread
  for the selected Gameweek.
- Derive a season benchmark from the league-average score of every recorded
  Gameweek.
- Derive signed variance between the selected Gameweek league average and the
  season benchmark.
- Add a dashboard card titled `Gameweek stats` as the first card in the
  responsive summary grid beneath the selected Gameweek card.
- Update the displayed card values when the selected Gameweek changes.
- Add utility and presentation tests for calculations, formatting, unavailable
  states, selector updates, and accessible semantics.

Out of scope:

- Changing the selected Gameweek results table, Gameweek selector, winner or
  slug rules, fractional-win standings, chips, or imported scoreboard values.
- Storing derived statistics in season JSON files.
- Player-level history, charts, trends, position calculations, profit and
  loss, payments, participant administration, or score editing.
- Changes to the FPL importer, scheduled workflow, deployment workflow,
  backend, or runtime data fetching.

## Decisions

- **Score source:** All statistics use the imported scoreboard `points` values
  already stored in the Gameweek score map. Transfer deductions must not be
  applied again.
- **Highest and lowest scores:** Use the maximum and minimum usable scores in
  the selected Gameweek. Tied values remain a single shared metric, with no
  player ranking or tie-break displayed in this card.
- **League average:** Divide the sum of usable selected-Gameweek scores by the
  number of usable scores.
- **Spread:** Calculate the selected Gameweek's highest usable score minus its
  lowest usable score.
- **Season benchmark:** Calculate each recorded Gameweek's league-average
  score with usable scores, then take their arithmetic mean. The selected
  Gameweek is included in that benchmark.
- **Variance:** Calculate `selected Gameweek league average − season
  benchmark`. Display a `+` prefix for positive values, `−` for negative
  values, and `0` for equality.
- **Missing scores:** A missing participant score is unavailable for this
  feature and is excluded from all Gameweek aggregates. It must not become
  zero. A Gameweek with no usable scores has no statistics or benchmark
  comparison and displays an explicit unavailable state.
- **Precision:** Display score-derived values with at most two decimal places
  and remove unnecessary trailing zeroes. Preserve the calculation precision
  until formatting for display.
- **Card content:** Render the five labelled metrics: `Highest score`, `Lowest
  score`, `League average`, `Spread`, and `Variance from season average`.
- **Card position:** Place `Gameweek stats` first in the existing
  season-summary grid, directly beneath the full-width selected Gameweek
  card, before overall standings, `The slugs`, average weekly position, and
  profit and loss.
- **Semantics:** Use a labelled card region and semantic definition-list or
  table markup that makes each metric's name and value available to assistive
  technology. Keep the visible card heading as an `h2`.
- **Rules ownership:** Calculation and result types belong in the utility
  layer. The Svelte card consumes typed values and performs display formatting
  only.

## Context

quids-in is a lightweight, static companion for one private FPL group. The
dashboard already lets the group select a recorded Gameweek and inspect its
scores alongside season-wide summaries. Gameweek stats adds an at-a-glance
view of how widely scores were distributed and whether the selected Gameweek
was above or below the season's typical average.

The app remains a Svelte and Vite static site backed by season JSON bundled at
build time. The feature must derive its values from that existing snapshot,
with no additional service, API request, database, or dependency.
