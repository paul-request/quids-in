# Validation — Player stats (Phase 8)

This phase is ready to merge when every applicable check below passes.

## Routes and navigation

- [ ] `/#/players/:participantId` renders the corresponding Player stats
      screen on direct navigation and after browser refresh.
- [ ] The dashboard remains available at `#/`.
- [ ] The application responds to hash changes and browser history navigation
      without a routing dependency or server-side fallback.
- [ ] An invalid, malformed, or unknown player route renders an explicit
      not-found state with a dashboard link.
- [ ] The Player stats screen provides a clearly labelled, keyboard-accessible
      link back to the dashboard.

## Dashboard player/team links

- [ ] The selected-Gameweek scores, overall standings, `The slugs`, average
      weekly position, and profit/loss tables each replace separate `Player`
      and `Team` columns with one `Player/team` column.
- [ ] Every `Player/team` value is the row's only link to that participant's
      canonical Player stats hash route.
- [ ] Links preserve the combined visible player/team text, table semantics,
      winner/slug/chip labels, and keyboard reading order.
- [ ] Links have meaningful accessible names and visible focus indicators.

## Player statistics

- [ ] The screen identifies the selected player and team.
- [ ] Total points equal the sum of usable recorded scoreboard scores.
- [ ] Average weekly score equals total points divided by usable-score
      Gameweeks.
- [ ] Highest and lowest scores are derived from usable recorded scores.
- [ ] Highest and lowest score labels include every tied Gameweek in ascending
      Gameweek order.
- [ ] Average league position uses competition ranking and excludes Gameweeks
      without a score for the selected player.
- [ ] Missing player scores are never converted to zero for Player stats.
- [ ] Score and position values use at most two decimal places without
      unnecessary trailing zeroes.
- [ ] A known player without usable scores displays an explicit no-recorded-
      score state without fabricated score or position values.

## Profit/loss

- [ ] Season profit/loss exactly matches the selected participant's existing
      `netBalancePennies` result.
- [ ] Current profit/loss exactly matches the selected participant's existing
      `weeklyBalancePennies` result.
- [ ] Both values use GBP formatting with two decimal places and remain
      understandable without relying on colour alone.
- [ ] The implementation does not duplicate prize-pot, contribution, or
      winner-allocation logic.

## Responsive layout, regression, and scope

- [ ] The Player stats screen is usable at supported phone, tablet, and
      desktop widths without page-level horizontal overflow.
- [ ] Existing dashboard Gameweek selection, Gameweek stats, winner and slug
      indicators, fractional-win standings, chips, average weekly position,
      and profit/loss behaviour remain unchanged.
- [ ] Utility tests cover normal, tied, decimal, missing-score, empty-season,
      no-recorded-score, and unknown-player cases.
- [ ] Presentation and routing tests cover all dashboard link surfaces,
      direct route load, back navigation, statistics, formatting, and explicit
      empty/not-found states.
- [ ] Existing tests continue to pass.
- [ ] `npm run validate` passes linting, type checking, Vitest, and the
      production build.
- [ ] No backend, runtime FPL request, importer change, routing dependency,
      score editing, payment processing, chart, history comparison, or
      derived season-JSON value is introduced.

## Sign-off

Once every box is checked, Player stats is ready to merge into `main`.

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
