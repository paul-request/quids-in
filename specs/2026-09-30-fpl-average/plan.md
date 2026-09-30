# Plan: FPL average in Gameweek stats (Phase 14)

## 1. Extend the data contract

1. In `libs/quids-in/utility/results.interfaces.ts`:
   - add `fplAverage?: number` to `Gameweek`; and
   - add `fplAverage?: number` and `differenceFromFplAverage?: number` to
     `AvailableGameweekStats`.
2. Confirm that `data/season-2026-27.json` still type-checks when it is
   imported without the new field.

## 2. Import the FPL average

1. In `scripts/import-season-data.mjs`, change `fetchEndedGameweeks` so it
   returns a `Map<gameweekId, { fplAverage?: number }>` for ended events,
   keeping one `bootstrap-static` request. Alternatively, rename it to
   `fetchGameweekStatus` and return an object.
2. When building `gameweeks`, set `ended` as it is set now. Spread
   `fplAverage` into the object only when it is defined.
3. Add a small `readFplAverage(event)` helper. It returns
   `average_entry_score` only when the value is a finite number of 0 or more.
4. Extend `scripts/import-season-data.test.ts` for:
   - an ended Gameweek with an average, which is stored;
   - a Gameweek that has not ended, where the field is omitted;
   - a missing or malformed `average_entry_score`, where the field is
     omitted and the import succeeds; and
   - no extra `bootstrap-static` requests.

## 3. Calculate the stats

1. In `calculateGameweekStats` in `libs/quids-in/utility/results.ts`, read
   `selectedGameweekInSeason.fplAverage`. When it is defined, return
   `fplAverage` and `differenceFromFplAverage = leagueAverage - fplAverage`.
2. Extend `results.test.ts`:
   - with an FPL average, check both values, including negative variance;
   - without an FPL average, check both are `undefined` and the existing
     values are unchanged; and
   - check that `fplAverage: 0` is still treated as present.

## 4. Update the card

1. In `GameweekStatsCard.svelte`, add the `FPL average` and
   `Difference from FPL average` rows after `League average`. Wrap them in
   `{#if stats.fplAverage !== undefined}`.
2. Reuse the existing `<dl>` row markup and styling, with no CSS changes
   unless the layout needs them at mobile widths.
3. Extend `GameweekStatsCard.test.ts` so it checks:
   - the rows render with formatted values (for example `59.8` and `-3.2`);
     and
   - the rows are hidden when `fplAverage` is undefined.

## 5. Refresh the data and update the documentation

1. Run `npm run import:season-data` locally, check that `fplAverage` appears
   on the ended Gameweeks, and commit the refreshed snapshot so local
   development and tests show the new rows. Deployed builds import fresh data
   anyway.
2. Update `README.md` to add `fplAverage` to the snapshot field list.
3. Add a Phase 14 entry to `specs/roadmap.md` and update the current status.

## 6. Validate

Run the checks in `validation.md`, including `npm run validate`.
