# Plan — Average Weekly Position (Phase 5)

## 1. Add the typed average-position result

1. Add a focused result interface containing participant ID, average weekly
   position, and average weekly score.
2. Keep participant names and team names in the existing participant model;
   resolve them in the presentation layer.
3. Do not add derived position or average fields to season JSON files.

## 2. Implement the calculation in the utility layer

1. Reuse the existing participant and Gameweek validation rules.
2. For each recorded Gameweek, order scores descending and assign competition
   positions such as `1, 2, 2, 4`.
3. Treat a missing score as zero, consistently with the existing Gameweek
   result calculation.
4. Accumulate each participant's positions and divide by the number of
   recorded Gameweeks.
5. Accumulate each participant's usable scores and divide by the number of
   Gameweeks in which that participant has a recorded score.
6. Return every participant ordered by average position ascending, retaining
   season participant order when averages are equal.
7. Return an empty result for a valid season with no recorded Gameweeks.
8. Keep the result season-wide and independent of the dashboard's selected
   Gameweek.
9. Keep the calculation pure and avoid mutating participants, Gameweeks, or
   score maps.

## 3. Add the dashboard card

1. Add a focused Svelte component titled `Average weekly position`.
2. Render a semantic table with `Player`, `Team`, and `Average position`
   columns.
3. Format averages with at most two decimal places and no trailing zeroes.
4. Render every participant returned by the utility calculation.
5. Show a clear no-data message when the season has no recorded Gameweeks.
6. Label the card region from its visible heading and preserve the existing
   page heading hierarchy.

## 4. Update the dashboard layout

1. Keep the selected Gameweek card as the first, full-width dashboard card.
2. Place overall standings, `The slugs`, and average weekly position in a
   season-summary grid beneath it.
3. Use an auto-fitting grid with a readable minimum card width so the summary
   cards wrap naturally from one to multiple columns as space permits.
4. Preserve DOM and keyboard reading order when the visual grid wraps.
5. Retain horizontal table scrolling within an individual card where needed;
   do not cause page-level horizontal scrolling.
6. Keep the grid extensible for the planned Phase 6 `Season balance` card.

## 5. Test the planned behaviour

1. Add utility tests for clear positions, competition-ranked ties, multiple
   Gameweeks, equal averages, missing scores, and an empty season.
2. Assert that utility results are ordered from best to worst average and use
   participant order as the deterministic tie-breaker.
3. Add presentation tests for the card heading, table columns, participant
   values, number formatting, and empty state.
4. Update dashboard tests for the additional card without weakening existing
   Gameweek, standings, or slug assertions.
5. Run `npm run validate`.
6. Manually verify the wrapping card grid at phone, tablet, and desktop widths
   and confirm the page has no horizontal overflow.
7. Verify the delivered changes satisfy every item in
   [validation.md](./validation.md) before merging.
