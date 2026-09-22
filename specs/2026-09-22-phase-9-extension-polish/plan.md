# Plan — Phase 9 extension: logo, team value, mobile density

## 1. Header logo: centre and enlarge

1. Update `.app-header` in `app.css` to centre its content
   (`justify-content: center`) at every supported width, removing the
   current left-aligned layout.
2. Increase `.brand-logo` from `3rem` to `4rem` (width and height), keeping
   the existing `object-fit: contain` and drop-shadow styling.
3. Manually verify the logo remains centred and legible at phone, tablet,
   and desktop widths, and that the header link's existing accessible name
   (`aria-label="quids-in home"`) and focus outline are unaffected.

## 2. Extend the season-data schema and importer for team value

1. Add optional `squadValue` and `bank` fields (non-negative integers, in
   tenths of a million pounds) to the `GameweekScore` interface in
   `results.interfaces.ts`, alongside the existing `points`, `transferCost`,
   `transfers`, and `chip` fields.
2. Update `scripts/import-season-data.mjs` to read `value` and `bank` from
   each FPL history entry (already fetched per participant) and store them
   as `squadValue`/`bank` on the corresponding Gameweek score entry.
3. Validate `squadValue`/`bank` as non-negative integers only when present;
   do not require them, and do not fabricate a value when the FPL response
   omits one.
4. Update or add importer unit tests covering: both fields present, both
   absent, only one present, and invalid (negative/non-integer) values
   being rejected.
5. Update the season-data schema documentation in `README.md` to describe
   `squadValue` and `bank`, noting both are optional.

## 3. Add a pure `calculateTeamValue` utility

1. Add a new typed result (e.g. `TeamValueResult`, a discriminated union of
   an available `{ available: true, teamValuePennies }`-style shape and an
   explicit unavailable state) to `results.interfaces.ts`, following the
   existing `GameweekStats`/`AvailableGameweekStats`/
   `UnavailableGameweekStats` pattern.
2. Add a `calculateTeamValue` function to `results.ts` that, for a given
   participant, finds their own latest recorded Gameweek (by Gameweek
   number, descending) that has both `squadValue` and `bank` present, and
   returns the combined figure. Returns the unavailable state when no such
   Gameweek exists (including when the participant has no recorded scores
   at all, or has scores but never has both new fields).
3. Add a formatting helper (e.g. `formatTeamValue`) to `formatting.ts` that
   renders the combined tenths-of-a-million figure as `£<n>m` or
   `£<n>.<d>m`, dropping a trailing `.0`.
4. Add utility tests covering: a single Gameweek with both fields, multiple
   Gameweeks where only some have both fields (correctly picks the latest
   qualifying one), no qualifying Gameweek, an unknown participant ID, and
   formatting edge cases (whole millions, one-decimal values, zero).

## 4. Display team value on the Player stats screen

1. Update `PlayerStats.svelte` (and its parent wiring in `App.svelte`) to
   compute and pass through the new team-value result for the selected
   participant.
2. Render the formatted team value directly below the participant's name
   and team, above the existing statistics list, using the same semantic
   pattern as the rest of the screen (a labelled value, not just floating
   text).
3. Render an explicit unavailable label when team value is unavailable,
   consistent with the screen's existing no-recorded-score handling; do not
   fabricate a value or hide the row silently.
4. Add/extend component tests covering: team value present, team value
   unavailable alongside otherwise-present player stats, and the
   no-recorded-score participant state (team value section still behaves
   sensibly when there are no scores at all).

## 5. Mobile winner/slug badges: icon-only

1. In `GameweekScoresTable.svelte`, wrap the existing "Winner"/"Slug" text
   inside the `.winner-badge`/`.last-place-badge` spans in a nested span,
   and add a `max-width: 40rem` rule in `app.css` that applies the existing
   `.visually-hidden` clipping styles to that nested span only below the
   breakpoint. This keeps "🏆 Winner"/"🐌 Slug" visible as today at tablet
   and desktop widths, and icon-only below 40rem, while the wording stays
   in the DOM (and available to assistive tech) at every width.
2. Add/update component tests asserting the "Winner"/"Slug" text content
   is present in the DOM for winner and slug rows regardless of viewport,
   since JSDOM tests don't evaluate media queries — the CSS-only visual
   hiding is verified manually per step 8.

## 6. Mobile heading abbreviations

1. For each affected heading (`Average position`, `Average score`,
   `Season balance`, `Weekly balance`) in `AverageWeeklyPositionCard.svelte`
   and `SeasonBalanceCard.svelte`, split the button label into two spans:
   one with the full wording marked `.visually-hidden` below 40rem, one with
   the abbreviated wording marked `.visually-hidden` at 40rem and above (or
   the reverse — implement via CSS so only one is visually shown at a
   time), so the rendered accessible name always includes the full wording
   text content.
2. Add the necessary `max-width: 40rem` CSS rules in `app.css` to toggle
   which span is visually hidden.
3. Leave `Player/team`, `Position`, `Wins`, `Losses`, `Score`, and `Chip`
   headings unchanged at every width.
4. Add/update component tests confirming: the accessible name for each
   sortable button includes the full wording at every width (tests run in
   JSDOM without media-query evaluation, so this mainly guards against
   accidentally removing the full-wording text from the DOM), and existing
   sort-toggle behaviour is unaffected.

## 7. Re-import and refresh committed season data

1. Run `npm run import:season-data` against the live FPL API to refresh
   `data/season-2026-27.json` with the new `squadValue`/`bank` fields
   (alongside any newly completed Gameweeks since the last import).
2. Review the diff: confirm existing points/transfers/chip values are
   unchanged for previously recorded Gameweeks, and that the new fields
   look plausible (non-negative, roughly in the £95m-£105m range per
   participant).
3. Manually spot-check the dashboard and at least one Player stats page
   locally against the refreshed data.

## 8. Test and validate

1. Run the full utility, formatting, and component test suites.
2. Manually verify, at supported phone, tablet, and desktop widths:
   - The header logo is centred and visibly larger.
   - Player stats shows the correct team value (or its unavailable state).
   - Winner/slug badges show icon-only on mobile with unchanged screen
     reader behaviour.
   - Abbreviated headings appear on mobile, full wording on larger
     screens, with sort toggling still working.
   - No page-level horizontal overflow is introduced at any width.
3. Run `npm run validate`.
4. Verify the delivered changes satisfy every item in
   [validation.md](./validation.md) before merging.
