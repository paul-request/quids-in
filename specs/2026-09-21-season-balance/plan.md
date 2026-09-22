# Plan — Profit & loss (Phase 6)

## 1. Add typed money results

1. Add a focused result interface containing participant ID, gross winnings in
   pennies, and net season balance in pennies.
2. Define the £1 weekly contribution and £38 season payment as integer-penny
   constants in the utility layer.
3. Keep participant identity in the existing participant model and resolve
   names and teams in the presentation layer.
4. Do not add derived money values to the season JSON.

## 2. Implement weekly prize allocation

1. Reuse existing validation and the existing Gameweek winner calculation.
2. Calculate each weekly pot as the participant count multiplied by 100
   pennies.
3. Divide the pot using integer division and assign leftover pennies one at a
   time to tied winners in season participant order.
4. Ensure each weekly allocation totals exactly the weekly pot.

## 3. Calculate season balances

1. Accumulate each participant's prize shares across recorded Gameweeks.
2. Subtract 3,800 pennies from every participant's gross winnings.
3. Return all participants ordered by net balance descending, retaining season
   order for equal balances.
4. Keep the metric season-wide and independent of selected Gameweek state.
5. Return every participant at -3,800 pennies season balance and £0.00 weekly
   balance for an empty season.

## 4. Add the Profit & loss card

1. Add an accessible `Profit & loss` Svelte component.
2. Render a semantic table with Player, Team, Season balance, and Weekly balance
   columns.
3. Format integer pennies as GBP with exactly two decimal places.
4. Communicate positive and negative values through text and sign, not colour
   alone.
5. Render every participant, including those with no winnings.

## 5. Extend the summary-card layout

1. Place Profit & loss after Average weekly position in the summary grid.
2. Reuse the existing responsive masonry-style grid with a maximum of two
   columns on large screens.
3. Preserve source and keyboard reading order as cards wrap.
4. Keep table overflow within each card and prevent page-level overflow.

## 6. Test and validate

1. Test sole winners, tied winners, indivisible penny splits, multiple
   Gameweeks, no wins, equal balances, and empty seasons.
2. Verify leftover pennies follow participant order and every pot is fully
   allocated.
3. Verify the £38 contribution is deducted once per participant.
4. Test card headings, columns, rows, GBP formatting, ordering, and empty
   season balances.
5. Run `npm run validate` and manually verify phone, tablet, and desktop
   layouts.
