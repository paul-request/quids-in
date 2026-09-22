# Validation — Season Balance

## Automated checks

1. Add utility tests covering:
   - a sole winner receiving the full weekly pot;
   - equal tied-winner splits;
   - indivisible penny splits and participant-order leftovers;
   - multiple recorded Gameweeks;
   - participants with no winnings;
   - equal balances and deterministic ordering;
   - an empty season with -£38.00 balances.
2. Assert every weekly allocation sums exactly to the participant-count pot.
3. Assert the fixed £38 contribution is deducted once per participant.
4. Add component tests covering the Profit & loss heading, semantic columns,
   all participant rows, positive and negative GBP formatting, zero balances,
   weekly balance at the latest Gameweek, and empty-season output.
5. Run `npm run validate` successfully.

## Manual acceptance checks

- A sole winner receives £1 multiplied by the participant count.
- Tied winners receive whole-penny shares whose total equals the exact pot.
- Leftover pennies follow season participant order.
- Net balances are gross winnings minus exactly £38.
- The Profit & loss card follows Average weekly position and participates in the same
  maximum-two-column masonry layout.
- At Gameweek 5, Weekly balance equals prize winnings through Gameweek 5
  minus £5 for every participant.
- The card remains readable on phone, tablet, and desktop widths without page
  horizontal scrolling.
- Positive, zero, and negative balances are understandable without colour.
- Existing Gameweek rankings, standings, slugs, and average-position results
  remain unchanged.

## Merge gate

Merge only when all tests, type checks, lint, build, accessibility checks, and
manual responsive checks pass, and the product decisions in `requirements.md`
are confirmed.

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
