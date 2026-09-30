# Validation: FPL average in Gameweek stats (Phase 14)

## Automated checks

1. Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`,
   or run `npm run validate`, and confirm they all pass.
2. Importer tests show that:
   - `fplAverage` is stored only for ended Gameweeks with a valid
     `average_entry_score`;
   - a missing, negative, non-numeric or live value is omitted, and the
     import does not fail; and
   - `bootstrap-static` is still fetched only once per import.
3. Stats tests show that:
   - `fplAverage` and `varianceFromFplAverage` are correct for positive,
     negative and zero variance;
   - both are `undefined` when the Gameweek has no `fplAverage`; and
   - the existing statistics are unchanged.
4. Card tests show that the new rows render with correct formatting when
   `fplAverage` is present, and are hidden when it is absent.

## Data checks

1. After running `npm run import:season-data`, every ended Gameweek in
   `data/season-2026-27.json` has an `fplAverage` that matches FPL's
   `average_entry_score`. For example, GW1 is 50, GW2 is 81, GW3 is 51, GW4
   is 69 and GW5 is 48, as fetched on 30 September 2026.
2. A Gameweek that has not ended has no `fplAverage`.
3. No other fields in the snapshot change unexpectedly.

## Manual checks

1. Run `npm run dev` and select each Gameweek. Check that `FPL average` and
   `Variance from FPL average` appear directly after `League average`, with
   values that match the snapshot and a correct sign.
2. Select the current live Gameweek, if there is one. Check that the two
   rows are hidden and the rest of the card is unchanged.
3. Check the card at mobile and desktop widths for wrapping, alignment and
   overflow.
4. Check with a screen reader or the accessibility tree that each new
   term/value pair is announced correctly.

## Merge gate

This phase is ready to merge when `npm run validate` passes, the data and
manual checks are complete, and the README and roadmap are updated. After
merging, confirm that the deployed card shows the FPL average from the
freshly imported data.
