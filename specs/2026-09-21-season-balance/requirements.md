# Requirements — Profit & loss (Phase 6)

## Source

This feature implements Phase 6 of `specs/roadmap.md`: display each
participant's season and weekly profit/loss from prize winnings and
contributions.

## Scope

In scope:

- Treat every participant as having paid £38 for the season.
- Calculate each recorded Gameweek's prize pot as £1 per season participant.
- Award the full pot to a sole winner.
- Split tied-winner pots into whole pennies, assigning leftovers in season
  participant order.
- Calculate gross winnings and net balances in integer pennies.
- Add a Profit & loss card after Average weekly position.
- Show Season balance and Weekly balance columns.
- Sort rows highest to lowest by Season balance and include every participant.
- Extend the existing responsive summary-card layout without changing the
  selected Gameweek card.

Out of scope:

- Processing payments or moving real money.
- Recording payment status, bank details, reminders, settlements, or exports.
- Configurable contributions, participant-specific fees, or carried-over pots.
- Changes to winner, score, weekly-loss, or average-position rules.
- Changes to importing, scheduled workflows, or deployment.

## Context

- The quids-in dashboard already shows Gameweek rankings, overall standings,
  The slugs, and Average weekly position.
- The metric is informational and derived entirely from the existing season
  snapshot.
- The existing roadmap and planning spec define £38 as the fixed season
  payment and £1 per participant per recorded Gameweek.

## Decisions

- **Currency arithmetic:** use integer pennies throughout; never use floating
  point values for money calculations.
- **Winner source:** reuse the existing Gameweek winner calculation.
- **Tied winners:** divide the pot equally in pennies, then distribute
  leftover pennies one at a time in season participant order.
- **Balance:** gross winnings minus 3,800 pennies, deducted once per
  participant regardless of recorded Gameweek count.
- **Weekly balance:** gross winnings from all recorded Gameweeks through the
  latest Gameweek minus £1 for each Gameweek number elapsed through that
  Gameweek. At Gameweek 5, each participant has contributed £5.
- **Empty season:** show every participant with a net balance of -£38.00.
- **Ordering:** sort descending by net balance; use season participant order
  for equal balances.
- **Display:** show GBP with exactly two decimal places and an explicit minus
  sign for negative balances.
- **Card title:** use `Profit & loss`.
- **Columns:** label the existing net column `Season balance` and add
  `Weekly balance`.
- **Layout:** place the card after Average weekly position in the existing
  masonry-style summary layout, capped at two columns on large screens.
- **Table content:** show Season balance and Weekly balance; gross winnings
  remain an internal derived value.
- **Zero display:** format a zero balance as `£0.00` without an additional
  settled label.
- **Accessibility:** balance meaning must not depend on colour; use semantic
  table headings and text signs.
