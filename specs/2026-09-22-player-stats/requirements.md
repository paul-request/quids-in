# Requirements — Player stats (Phase 8)

## Source

This feature implements Phase 8 of the quids-in roadmap:

> Add a Player stats screen with linked player and team identities across the
> dashboard, showing score, position, and profit/loss summaries.

## Scope

In scope:

- Add a Player stats screen for an individual participant at
  `/#/players/:participantId`.
- Replace the separate dashboard player and team fields with one combined
  player/team field that links to the corresponding Player stats route.
- Show the selected player's name and team name, with a clearly labelled link
  back to the dashboard.
- Derive and display total points, average weekly score, highest score and
  Gameweek or Gameweeks, lowest score and Gameweek or Gameweeks, and average
  league position.
- Reuse the existing season-balance calculation to display season profit/loss
  and current profit/loss.
- Provide explicit unknown-player and no-recorded-score states.
- Add utility, component, routing, accessibility, and responsive tests.

Out of scope:

- Editing players, teams, scores, chips, Gameweek results, or profit/loss
  settings.
- Changing winner, slug, fractional-win, Gameweek stats, average-position, or
  profit/loss calculations.
- Player-to-player comparison, charts, trends, historical-season selection,
  filtering by a Gameweek range, or score history tables.
- Adding a routing dependency, backend, runtime FPL API request, importer
  change, data-model change, or derived values to season JSON files.

## Decisions

- **Routing:** Use the hash route `/#/players/:participantId`. The route must
  render after direct navigation or browser refresh on GitHub Pages without
  server-side fallback configuration or a routing dependency.
- **Route identifier:** `participantId` is the canonical numeric ID from the
  season data, not a name or team-name slug.
- **Dashboard links:** Replace separate player and team columns with one
  `Player/team` column in the selected-Gameweek scores, overall standings,
  `The slugs`, average weekly position, and profit/loss tables. Each row's
  combined player/team text is one link to the associated Player stats route;
  it is the only Player stats link in that row and works with keyboard
  navigation.
- **Back navigation:** The Player stats screen has a clearly labelled,
  keyboard-accessible link to `#/`, returning to the dashboard.
- **Score source:** Total points, average weekly score, and highest and lowest
  scores use the stored scoreboard `points` values. Transfer deductions must
  not be applied again.
- **Missing scores:** A missing player score is unavailable and excluded from
  all Player stats score and position calculations. It must not be converted
  to zero.
- **Total points:** Sum the player's usable recorded scoreboard scores.
- **Average weekly score:** Divide total points by the number of usable
  recorded scores.
- **High and low scores:** Derive the maximum and minimum usable recorded
  scores. For a tied maximum or minimum, list every Gameweek where the tied
  score occurred in ascending Gameweek order.
- **Average league position:** Derive each usable-score Gameweek position
  using the existing competition-ranking rules. Calculate the arithmetic mean
  only across Gameweeks in which the selected player has a usable score.
- **Profit/loss:** Reuse the existing season-balance calculation without
  replicating prize or contribution rules. Label `netBalancePennies` as
  **Season profit/loss** and `weeklyBalancePennies` as **Current
  profit/loss**. Display both in GBP with two decimal places and an explicit
  sign where applicable; colour is supplementary only.
- **Precision:** Format score and average-position values to at most two
  decimal places without unnecessary trailing zeroes.
- **No recorded score:** For a known player without usable scores, show an
  explicit no-recorded-score state. Do not invent score, average, high, low,
  or position values; profit/loss remains available from the existing
  season-balance calculation.
- **Unknown route:** For a missing, malformed, or unknown participant ID,
  show an explicit not-found state with a dashboard link rather than failing
  silently.
- **Rules ownership:** Domain calculations and typed results belong in the
  utility layer. Svelte components consume those typed values, perform
  formatting, and do not duplicate business rules.

## Context

quids-in is a responsive, static companion for one private Fantasy Premier
League group. The dashboard already presents a selected Gameweek and
season-wide summaries. Player stats adds a focused view for understanding one
participant's recorded performance without introducing live data, accounts,
or general-purpose league support.

The application uses Svelte and Vite with static season JSON bundled at build
time. Hash routing keeps Player stats deep links compatible with planned
GitHub Pages hosting while preserving the zero-cost, no-backend architecture.
