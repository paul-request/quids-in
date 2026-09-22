# Validation — Phase 9 extension: logo, team value, mobile density

This phase is ready to merge when every applicable check below passes.

## Header logo

- [x] The header logo is horizontally centred at phone, tablet, and desktop
      widths.
- [x] The logo renders at `4rem` square (up from `3rem`), remains legible,
      and keeps its existing drop-shadow styling.
- [x] The header link's accessible name (`aria-label="quids-in home"`) and
      visible focus indicator are unchanged.
- [x] No visible text title was added alongside the logo.

## Season-data schema and importer

- [x] `GameweekScore` gains optional `squadValue` and `bank` fields
      (non-negative integers, tenths of a million pounds) without changing
      the meaning or shape of any existing field.
- [x] The importer captures `value`/`bank` from the FPL history response it
      already fetches, without any new network request.
- [x] The importer validates `squadValue`/`bank` as non-negative integers
      only when present, and does not require or fabricate them when the
      source response omits one.
- [x] Importer tests cover both fields present, both absent, only one
      present, and invalid values being rejected.
- [x] `README.md`'s season-data schema section documents `squadValue` and
      `bank`, noting both are optional.

## Team value calculation

- [x] `calculateTeamValue` (or equivalent) returns the combined
      `(squadValue + bank) / 10` figure using the participant's own latest
      Gameweek that has both fields present, not the season's overall
      latest Gameweek.
- [x] An explicit unavailable result is returned when no Gameweek has both
      fields for that participant, including participants with no recorded
      scores at all — never a fabricated or zero value.
- [x] The calculation does not alter `PlayerStats`, season/current balance,
      or any other existing derived statistic.
- [x] Formatting renders whole-million figures without a trailing `.0`
      (e.g. `£100m`) and one-decimal figures correctly (e.g. `£101.5m`).
- [x] Utility tests cover a single qualifying Gameweek, multiple Gameweeks
      with only some qualifying, no qualifying Gameweek, and an unknown
      participant ID.

## Player stats display

- [x] Team value is shown directly below the participant's name and team,
      above the existing statistics list.
- [x] An explicit unavailable label is shown when team value data is
      missing, consistent with the screen's existing empty-state handling.
- [x] Component tests cover team value present, team value unavailable
      alongside otherwise-present stats, and the no-recorded-score
      participant state.

## Mobile winner/slug badges

- [x] Below 40rem, the selected-Gameweek table shows only the 🏆/🐌 icon for
      winner/slug indicators; "Winner"/"Slug" wording is visually hidden.
- [x] At and above 40rem, the existing "🏆 Winner"/"🐌 Slug" text remains
      visible exactly as before.
- [x] "Winner"/"Slug" wording remains present in the DOM and available to
      assistive technology at every width; the accessible meaning of a
      winning/last-place row is unchanged.
- [x] Component tests confirm the wording is present in markup regardless of
      viewport (visual hiding is CSS-only and verified manually).

## Mobile heading abbreviations

- [x] Below 40rem, `Average position`, `Average score`, `Season balance`,
      and `Weekly balance` headings show their shortened visual form
      (`Avg. pos.`, `Avg. score`, `Season`, `Weekly`).
- [x] At and above 40rem, all four headings show their existing full
      wording, unchanged.
- [x] `Player/team`, `Position`, `Wins`, `Losses`, `Score`, and `Chip`
      headings are unchanged at every width.
- [x] Each affected heading's accessible name is its full wording at every
      width (confirmed via `getByRole('button', { name: <full wording> })`
      -style component tests).
- [x] Existing sort-toggle behaviour for every affected heading is
      unaffected.

## Refreshed season data

- [x] `data/season-2026-27.json` has been re-imported against the live FPL
      API and now includes `squadValue`/`bank` for recorded Gameweeks.
- [x] The refreshed snapshot's existing points, transfers, chip, and
      Gameweek values for previously recorded Gameweeks are unchanged.
- [x] The refreshed snapshot has been reviewed (per the existing weekly
      update workflow) before being committed.

## Responsive layout, regression, and scope

- [x] The dashboard and Player stats screen remain usable at supported
      phone, tablet, and desktop widths without page-level horizontal
      overflow.
- [x] Existing dashboard behaviour is unchanged: Gameweek selection,
      standings, slugs, Gameweek stats, average weekly position, profit and
      loss, player-stat totals/averages/high-low scores, and hash routing.
- [x] Existing tests continue to pass.
- [x] `npm run validate` passes linting, type checking, Vitest, and the
      production build.
- [x] No backend, live in-app FPL request, routing dependency, payment
      processing, or unrelated calculation change is introduced.

## Sign-off

Once every box is checked, this Phase 9 extension is ready to merge into
`main`.
