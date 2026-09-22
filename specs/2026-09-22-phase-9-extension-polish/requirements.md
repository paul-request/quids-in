# Requirements — Phase 9 extension: logo, team value, mobile density

## Source

This feature implements the "Phase 9 extension — Logo, team value, and mobile
density" section of the quids-in roadmap:

> Centre and enlarge the header logo; add a Team value figure to Player
> stats, sourced from a new importer/schema field; show winner/slug badges
> icon-only on mobile; abbreviate long sortable table headings on mobile —
> all while preserving existing accessible names and behaviour.

## Scope

In scope:

- Centre the header logo at every supported width and increase its size
  from 3rem to 4rem (48px to 64px).
- Add a single current **Team value** figure to the Player stats screen,
  combining a participant's FPL squad value and bank balance for their own
  latest recorded Gameweek.
- Extend the season-data schema with two new optional per-participant,
  per-Gameweek fields (squad value and bank), captured by the importer from
  the FPL history endpoint it already fetches.
- Re-run the importer against the live FPL API to refresh the committed
  `data/season-2026-27.json` snapshot with the new fields.
- On mobile (≤40rem / 640px):
  - Visually hide the "Winner"/"Slug" wording in the selected-Gameweek
    table, showing only the 🏆/🐌 icon, while preserving the wording for
    assistive technology.
  - Visually abbreviate specific sortable table column headings, while
    preserving the full wording as each heading's accessible name.
- Update `README.md`'s season-data schema documentation to describe the two
  new fields.
- Add or update utility, component, and formatting tests to cover all of the
  above.

Out of scope:

- Any change to how points, transfers, chips, winners, fractional wins,
  slugs, average weekly position, Gameweek stats, or season/current balance
  are calculated.
- Showing team value trend/change over the season, or any historical/
  Gameweek-by-Gameweek breakdown of squad value or bank.
- Editing squad value or bank by hand outside the importer.
- GitHub Pages deployment, live in-app FPL requests, authentication,
  payments, or any other roadmap phase's scope.
- Redesigning the header, dashboard information architecture, or existing
  visual identity beyond the specific changes listed above.

## Decisions

- **Logo:** Centre `.app-header` content at every width (not just mobile).
  Increase `.brand-logo` from `3rem` to `4rem` square. No visible text title
  is added alongside the logo; the existing `aria-label="quids-in home"` on
  the link remains the accessible name for the header link.
- **Team value data model:** Store the two raw FPL figures — squad value and
  bank, each an integer in tenths of a million pounds, exactly as the FPL
  API represents them — as new **optional** fields on each participant's
  per-Gameweek score object (alongside `points`, `transferCost`,
  `transfers`, `chip`). Field names: `squadValue` and `bank`. Optional
  because older data, hand-edited entries, and future historical-season
  imports (Phase 11) may not include them; missing fields must not be
  treated as zero.
- **Team value derivation:** For a given participant, use their own latest
  recorded Gameweek that has both `squadValue` and `bank` present (not
  necessarily the season's overall latest Gameweek, and not the latest
  Gameweek with a `points` score if that Gameweek lacks these new fields).
  Team value = `(squadValue + bank) / 10`, in £m. This is a new, independent
  utility calculation; it must not alter `PlayerStats`'s existing fields or
  any other derived statistic.
- **Team value display:** Show it directly below the participant's name and
  team, above the existing statistics list, formatted as `£<n>m` (or
  `£<n>.<d>m` when the combined figure is not a whole number), e.g. `£100m`
  or `£101.5m`. At most one decimal place; never show a trailing `.0`.
  Reuse the existing "no recorded score" pattern: if the participant has no
  Gameweek with usable squad-value/bank data (including the case where they
  have recorded scores but never recorded squad-value/bank data, e.g. older
  imports), show an explicit unavailable label rather than omitting the row
  or fabricating a value.
- **Importer:** Extend `scripts/import-season-data.mjs` to read `value` and
  `bank` from each entry in the FPL history response's `current` array
  (already fetched) and store them as `squadValue`/`bank` on the
  corresponding Gameweek score, alongside the existing fields. Validate them
  as non-negative integers when present; do not require them (some historic
  FPL responses may omit `bank` for very old Gameweeks).
- **Live re-import:** Run `npm run import:season-data` against the live FPL
  API as part of this work to refresh `data/season-2026-27.json` with real
  `squadValue`/`bank` values, then manually review the diff (per the
  existing weekly-update workflow) before it is committed.
- **Mobile winner/slug badges:** Below 40rem, hide the visible "🏆 Winner"/
  "🐌 Slug" text nodes using the existing `.visually-hidden` utility class
  (present in the DOM, hidden visually, still exposed to assistive tech),
  keeping the emoji visible. The badge's accessible meaning is unchanged at
  every width.
- **Mobile heading abbreviations:** Below 40rem, visually swap in shortened
  heading text for the following sortable headings, keeping the full
  wording as an `.visually-hidden` span so the accessible name (via
  `getByRole('button', { name: ... })`-style queries and screen readers)
  remains the full wording at every width:
  - "Average position" → "Avg. pos."
  - "Average score" → "Avg. score"
  - "Season balance" → "Season"
  - "Weekly balance" → "Weekly"
  - `Player/team`, `Position`, `Wins`, `Losses`, `Score`, and `Chip` are
    already short and are left unchanged at every width.
- **Breakpoint reuse:** All mobile-only visual changes reuse the existing
  `max-width: 40rem` media query already used elsewhere in `app.css`; no new
  breakpoint is introduced.
- **Rules ownership:** Team value calculation is a pure utility function in
  `libs/quids-in/utility/`, following the existing pattern (see
  `calculatePlayerStats`, `formatting.ts`). Components consume the typed
  result and format it for display; they do not re-derive it.

## Context

quids-in is a responsive, static companion app for one private group of 12
Fantasy Premier League friends (see [mission.md](../mission.md)). The
dashboard and Player stats screen (Phase 8) are complete; this phase is a
polish pass on top of that existing work rather than a new feature area, per
the roadmap's Phase 9 scope.

The importer (`scripts/import-season-data.mjs`) already fetches each
participant's full FPL history response, which includes `value` and `bank`
per Gameweek alongside the `points`/`event_transfers`/`event_transfers_cost`
fields it already stores — this feature captures two fields that are already
being fetched but currently discarded, rather than adding a new network
call. This keeps the change consistent with the zero-cost, static,
build-time-data architecture described in
[tech-stack.md](../tech-stack.md): no live in-app FPL requests, no backend,
and the importer remains a manual/reviewed step, not an automatic one.
