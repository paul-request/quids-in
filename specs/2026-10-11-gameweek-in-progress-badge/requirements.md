# Requirements: In-progress Gameweek badge (Phase 15)

## Source

Add an **In progress** badge to the current Gameweek when it is still
underway, as described in Phase 15 of the [roadmap](../roadmap.md).

## Context

- The dashboard renders the selected Gameweek heading in
  `libs/quids-in/feature-shell/App.svelte`. The latest recorded Gameweek
  is the last entry in the season's ordered `gameweeks` array.
- `Gameweek` in `libs/quids-in/utility/results.interfaces.ts` currently has
  an optional `ended` flag, but no start status.
- `scripts/import-season-data.mjs` already fetches FPL's
  `bootstrap-static` events once per import. It sets `ended` using
  `finished === true && data_checked === true`, also used for cup completion.
- The browser currently reads a bundled snapshot, not live FPL data.
  Every normal deployment imports a fresh snapshot. The footer exposes its
  retrieval time.
- Historical snapshots and existing test fixtures can omit completion
  metadata. They must remain readable without guessing their status.

## Scope

In scope:

- Import enough Gameweek status to distinguish an unstarted round from one
  past its FPL deadline.
- Show a non-interactive badge beside the selected Gameweek heading in the
  results card, only when that Gameweek is the current/latest recorded round
  and is known to be in progress.
- Cover import, status calculation, selection, accessibility and responsive
  presentation with proportionate tests and manual checks.
- Document the new snapshot metadata and link these specifications from the
  roadmap.

Out of scope:

- A badge in the selector, Gameweek stats card, player pages or Cups page.
- Changing winner/slug indicators, scores, prizes, balances or averages.
- Completed-Gameweek-only season summaries (Phase 18).
- Minute-by-minute refreshes, polling, deployment changes or external
  services (Phase 16).
- Historical-season import, dependencies, routing or unrelated UI changes.

## Functional requirements

### Snapshot status

1. Reuse the existing `bootstrap-static` request; do not add a request per
   Gameweek or browser-side requests to FPL.
2. Add an optional boolean `Gameweek.started` field. For an event with a
   valid FPL `deadline_time`, set it by comparing the deadline with the
   import's validated `retrievedAt` timestamp. At or after the deadline,
   the Gameweek has started, even if no match has kicked off yet.
3. Preserve `ended` as the finished-and-checked completion rule. A
   finished-but-unchecked event remains unfinished for the badge.
4. Use explicit completion metadata from the matching event; an absent
   event or unavailable status must not be treated as confirmed unfinished
   solely because it is absent from the completed-event map.
5. Older snapshots may omit `started` or `ended`. Omission means unknown,
   not a guessed live status. Supplied new metadata must be boolean and
   validated consistently with the existing snapshot validator.
6. Missing start metadata leaves the badge unavailable. Malformed supplied
   source status must be reported explicitly using the importer's existing
   error approach, rather than silently manufacturing a status.
7. Preserve FPL average import rules, scores, transfer deductions, cups and
   the existing single-request behaviour.

### Badge

8. Show the exact text **In progress** beside the Gameweek heading only
   when all three conditions hold:
   - the selected Gameweek is the latest recorded Gameweek;
   - `started === true`; and
   - `ended === false`.
9. Hide it before the deadline, after both completion flags are true, for a
   selected historical Gameweek, when required status is unknown, and when
   there are no recorded Gameweeks.
10. Keep it visible between matches, throughout breaks in the round, and
    after the final match while FPL checks the data.
11. Selecting another Gameweek updates badge visibility without changing
    the selector labels, the existing heading text or other card content.
12. Make the badge readable at mobile and desktop widths, including when
    the heading and selector wrap. Its meaning must be conveyed by text,
    not colour alone; keep it available to assistive technology.
13. Do not introduce a focusable control, animation or recurring live
    announcement for a static status badge.

## Decisions

- **Placement:** beside the Gameweek heading in the results card only.
- **Start boundary:** the FPL deadline, inclusive, not the first kick-off.
- **End boundary:** FPL marks the event both finished and data checked.
- **Unknown status:** hide the badge while keeping the snapshot readable.
- **Timing:** status describes the imported snapshot. Phase 15 does not
  promise an already-open page will update at a deadline or completion;
  refreshed data is needed, and automatic refresh remains Phase 16.
- **Phase separation:** Phase 15 is presentation and status metadata only.
  The planned season-summary completion gate remains Phase 18.
- **Delivery:** implementation was approved on 11 October 2026. Commits,
  pushes and a pull request still require separate approval.
