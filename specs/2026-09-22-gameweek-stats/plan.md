# Plan — Gameweek stats (Phase 7)

## 1. Define typed Gameweek-stat results

1. Add a focused utility result interface for selected-Gameweek statistics.
2. Represent an unavailable Gameweek explicitly rather than supplying
   fabricated zero-valued metrics.
3. Keep player identity and raw scores in the existing participant and
   Gameweek data types; do not add derived values to season JSON.

## 2. Implement pure score-distribution calculations

1. Reuse existing season, participant, and Gameweek validation.
2. Read stored scoreboard points without applying transfer deductions again.
3. Exclude missing participant scores from all aggregate calculations.
4. Derive highest score, lowest score, league average, and spread from the
   selected Gameweek's usable scores.
5. Derive the season benchmark from the league averages of recorded Gameweeks
   with usable scores, including the selected Gameweek.
6. Calculate signed variance as selected Gameweek league average minus the
   season benchmark.
7. Return an explicit unavailable result when the selected Gameweek contains
   no usable scores.
8. Keep the calculation pure and avoid mutating participant, Gameweek, or
   score-map data.

## 3. Add the Gameweek stats card

1. Add a focused Svelte component titled `Gameweek stats`.
2. Render the five required labelled metrics using semantic table or
   definition-list markup.
3. Format score-derived values to a maximum of two decimal places without
   unnecessary trailing zeroes.
4. Format positive variance with `+`, negative variance with `−`, and an
   equal comparison as `0`.
5. Show a clear unavailable message instead of values when the selected
   Gameweek has no usable scores.
6. Label the region using its visible heading and preserve the page's
   existing heading hierarchy.

## 4. Integrate selected-Gameweek state and layout

1. Derive the card result from the existing selected Gameweek state and the
   full recorded season.
2. Ensure changing the labelled Gameweek selector updates all five card
   values and the variance comparison.
3. Place the card first in the summary-grid source order, directly beneath
   the full-width selected Gameweek card.
4. Preserve source and keyboard reading order as the existing grid wraps at
   supported phone, tablet, and desktop widths.
5. Retain the existing selected-Gameweek table, overall standings, `The
   slugs`, average weekly position, and profit-and-loss cards unchanged.

## 5. Test and validate

1. Add utility tests for one and multiple Gameweeks, tied high/low values,
   decimal league averages, missing scores, all-missing scores, and
   positive/negative/zero variance.
2. Assert that the selected Gameweek is included in the season benchmark.
3. Add presentation tests for the card heading, all labels, formatting,
   unavailable state, and semantic association of metric names and values.
4. Update dashboard tests to assert that Gameweek stats appears first in the
   summary grid and changes with the selected Gameweek without weakening
   existing regression assertions.
5. Run `npm run validate`.
6. Manually verify the card and grid at phone, tablet, and desktop widths,
   including keyboard use of the Gameweek selector and no page-level
   horizontal overflow.
7. Verify the delivered changes satisfy every item in
   [validation.md](./validation.md) before merging.
