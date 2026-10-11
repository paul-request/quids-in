# Validation: In-progress Gameweek badge (Phase 15)

Implementation acceptance checks and local evidence are recorded below.
Unchecked items remain outstanding rather than implying a completed merge gate.

## Automated checks

- [x] Targeted importer and app tests pass:
      `npm test -- scripts/import-season-data.test.ts libs/quids-in/feature-shell/App.test.ts`.
- [x] Run any added visibility-helper tests with the same targeted runner
      and record the exact file selection.
- [x] `npm run validate` passes: ESLint, Svelte/TypeScript checking, Vitest
      and production build.
- [x] Snapshot validation accepts absent start/completion metadata and
      rejects malformed supplied new fields.
- [x] Importer tests confirm one `bootstrap-static` request, deterministic
      deadline comparison using `retrievedAt`, explicit unknown status and
      unchanged FPL average, scoring and cup behaviour.

## Status matrix

Use controlled fixtures so every state can be checked regardless of the
real FPL schedule.

| Selected round | Source/snapshot state | Badge |
| --- | --- | --- |
| Latest | Retrieval before FPL deadline | Hidden |
| Latest | Retrieval exactly at deadline, not completed | In progress |
| Latest | Deadline passed, matches underway | In progress |
| Latest | Between matches, not completed | In progress |
| Latest | Finished, data not checked | In progress |
| Latest | Finished and data checked | Hidden |
| Latest | Start or completion metadata unknown | Hidden |
| Earlier | Started, not completed | Hidden |
| Earlier | Completed | Hidden |
| None | Empty Gameweeks array | Hidden; existing empty state remains |

- [x] Automated checks cover every matrix row.
- [x] Malformed supplied source metadata produces an explicit importer
      error, not an invented in-progress state.
- [x] Selecting a past round hides the badge; returning to the latest
      qualifying round restores it.
- [x] Updated snapshot props remove the badge when the selected latest
      round becomes finished and checked.
- [x] Existing legacy fixtures, selector labels, heading text, winner/slug
      indicators, stats, season summaries, player routes and cup behaviour
      remain unchanged.

## Manual and data checks

- [x] Start the app with `npm run dev` and use controlled fixtures for live
      and completed states. Record the fixtures used.
- [x] Check the badge beside the heading at mobile and desktop widths,
      including narrow widths where the selector wraps; no clipping,
      overlap or horizontal overflow is introduced.
- [x] Verify the text is readable with sufficient contrast and status is
      understandable without relying on colour.
- [x] Inspect the accessibility tree: `In progress` is readable, the
      Gameweek heading keeps its existing name, the selector is still
      labelled, and the badge adds no focus stop.
- [ ] Keyboard selection works and produces correct badge visibility
      without disruptive or repeated announcements.
- [ ] If a real import is run, compare `started` and `ended` with the
      matching FPL deadline/completion flags at the retrieval timestamp.
      Record the command, outcome and Gameweek checked.
- [x] Confirm the footer still exposes snapshot freshness. Do not claim
      minute-by-minute updates or browser-clock status transitions.

## Merge gate

- [x] Requirements and the status matrix are satisfied by local implementation
      and controlled-fixture checks.
- [x] All automated commands have recorded passing results.
- [ ] Manual checks are complete, with any unavailable real-data check
      explicitly noted and controlled-fixture evidence supplied.
- [x] README and Phase 15 roadmap status reflect the implemented behaviour.
- [x] Final diff is limited to this feature and its documentation/tests.
      Existing roadmap edits are preserved; Phases 16–18 are not silently
      implemented.
- [ ] After an approved merge and normal deployment, confirm the displayed
      badge agrees with the freshly imported snapshot and retrieval time.

## Local evidence - 11 October 2026

- Node: `nvm use` found no project `.nvmrc`; `nvm use default` selected
  Node v22.15.0, npm v10.9.2. No runtime configuration was added.
- `npm test -- scripts/import-season-data.test.ts libs/quids-in/utility/gameweek-status.test.ts libs/quids-in/feature-shell/App.test.ts`:
  passed, 69 tests across 3 files.
- `npm run validate`: passed, including 188 tests across 19 files,
  Svelte checking with zero errors/warnings, TypeScript and production build.
- Editor diagnostics on the changed importer, app and status-helper files:
  no errors.
- Browser: local Vite app on port 5175; season and cup JSON module responses
  were intercepted with a two-player, two-Gameweek fixture and an empty cup
  draw. GW1 was complete; GW2 was started and unfinished. No checked-in
  snapshot or cup draw was modified.
- Selection using the browser's select-option API hid the badge on GW1 and
  restored it on GW2. Native arrow-key selection could not be confirmed in
  the integrated browser; this manual check remains outstanding. The
  existing selector retains a visible focus outline.
- Measured CSS viewport widths of 256, 300, 320, 512, 1024 and 1280 pixels
  showed no document overflow or badge overlap with the heading/selector.
  Mobile and desktop screenshots were inspected.
- Badge contrast: approximately 14.89:1 (`#151000` on `#ffe36e`).
  Accessibility-tree output preserved the `Gameweek 2` level-one heading
  and exposed separate `In progress` text; the badge is a non-focusable span.
- No Axe scan or actual screen-reader session was performed. No real FPL
  import or deployment was performed; live-data and post-deployment checks
  remain outstanding. The old checked-in snapshot has no start metadata,
  so its badge is intentionally hidden until a fresh import.
