# Requirements: FPL average in Gameweek stats (Phase 14)

## Source

Show how the league compares with the whole of FPL by adding FPL's overall
average score for the selected Gameweek to the `Gameweek stats` card.

## Context

- FPL's `bootstrap-static` endpoint returns an `events` array. Each event has
  `average_entry_score`, which is the mean score across every FPL team for
  that Gameweek, and a `highest_score`.
- `scripts/import-season-data.mjs` already fetches `bootstrap-static` in
  `fetchEndedGameweeks` to set `Gameweek.ended`. Reading the average from the
  same response costs no extra request.
- `libs/quids-in/utility/results.ts` `calculateGameweekStats` derives the
  card's values, and `libs/quids-in/feature-shell/GameweekStatsCard.svelte`
  renders them as a `<dl>`.
- The site is rebuilt with freshly imported data on every deployment (Phase
  13), so the value will appear automatically after the next deployment.

## Scope

In scope:

- Import FPL's average for each recorded Gameweek into the season snapshot.
- Show it on the `Gameweek stats` card for the selected Gameweek.
- Show the signed difference between the league average and the FPL average.

Out of scope:

- FPL's `highest_score`, overall rank or other global statistics.
- Season-long FPL averages, charts or player-level comparisons.
- Historical seasons, which `bootstrap-static` does not provide.
- Live requests to FPL from the browser.

## Functional requirements

### Importer

1. `importSeasonData` reads `average_entry_score` from the existing
   `bootstrap-static` response for each Gameweek in the snapshot.
2. The value is stored as an optional `Gameweek.fplAverage` number, placed
   next to `ended` in the Gameweek object.
3. `fplAverage` is written only when the Gameweek has ended (`finished &&
   data_checked`) and `average_entry_score` is a finite, non-negative number.
   Otherwise the field is omitted, because the value changes or is `0`
   during a live Gameweek.
4. A malformed `average_entry_score` never fails the import. The field is
   simply omitted for that Gameweek.
5. Snapshots without `fplAverage` (older files and live Gameweeks) still
   load and validate.

### Stats calculation

6. `AvailableGameweekStats` gains two optional fields:
   - `fplAverage`, the selected Gameweek's `fplAverage`; and
   - `differenceFromFplAverage`, calculated as `leagueAverage - fplAverage`.
7. Both fields are `undefined` when the selected Gameweek has no
   `fplAverage`. The existing statistics are unchanged.

### Gameweek stats card

8. The card shows two new rows, directly after `League average`:
   - `FPL average`, formatted with `formatNumber`; and
   - `Difference from FPL average`, formatted with `formatSignedNumber`, the
     same as the existing difference row.
9. When `fplAverage` is unavailable, both rows are hidden rather than showing
   a zero or placeholder. Every other row renders as it does now.
10. The rows use the existing `<dl>` markup and styles, stay readable at
    mobile widths, and keep the card's accessible semantics.
11. The values update when the selected Gameweek changes.

## Decisions

- **Label:** `FPL average`, matching the existing `League average` wording.
- **Comparison:** show the signed difference so the league's performance
  against everyone else is clear at a glance.
- **Points basis:** FPL does not document whether `average_entry_score`
  deducts transfer costs, while league scores are net of hits. The
  comparison is therefore approximate. It is presented as-is without any
  adjustment.
- **Unavailable state:** hide the rows instead of showing `-` or `0`, so live
  Gameweeks and older snapshots don't look wrong.
- **Storage:** store the raw FPL value in the snapshot, because it is source
  data rather than a value derived from league scores. Compute the difference
  at runtime, as the other statistics are.
