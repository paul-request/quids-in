# Requirements — Real Season Data Import (Phase 4)

## Source

This feature implements the current-season import portion of
[Phase 4](../roadmap.md). It adds verified real 2026-27 results and
repeatable static-data import tooling for the group's FPL league.

## Scope

In scope:

- A shared import command that runs locally and in GitHub Actions.
- Importing every member of FPL classic league `869128`, including pagination.
- Using each participant's FPL entry ID as their canonical participant ID
  instead of an app-assigned ID.
- Importing each member's historical Gameweek data.
- Capturing the calculated net Gameweek score, transfer count, transfer
  deduction, and chip usage for every imported Gameweek.
- Producing a validated static JSON snapshot that the existing rules engine
  and dashboard can consume without browser-side FPL requests, replacing
  `data/season-2026-27.json`.
- Loading and reviewing the currently available 2026-27 Gameweeks.
- Manually cross-checking imported Gameweek winners and season standings
  against the official FPL site for the active season.
- A GitHub Actions workflow that runs every Tuesday and on manual dispatch,
  invoking the same importer and retaining a timestamped artifact.

Out of scope:

- Browser-side calls to FPL, a backend service, database, CORS proxy, or any
  other runtime data service.
- Automatically committing imported output to `main`.
- Automatically deploying refreshed data; deployment integration remains
  Phase 10 work.
- Editing FPL data in the dashboard.
- Prize pot or payment tracking.
- Historical 2025-26 backfill. It requires separate source analysis because
  FPL's public API exposes per-Gameweek histories only for the active season.

## Decisions

- **FPL source:** Use the public FPL endpoints
  `leagues-classic/869128/standings/`, `entry/{entryId}/history/`, and,
  where needed for current-week confirmation,
  `entry/{entryId}/event/{gameweek}/picks/`.
- **Participant identity:** Use the FPL standings entry ID (the team's API
  identifier) for `participants[].id` and all Gameweek score references.
  Do not create a separate arbitrary app ID. The entry ID is the stable key
  for linking a participant's imported data across seasons; names and team
  names remain display fields that may change.
- **No runtime fetch:** FPL currently does not provide permissive CORS
  headers for this use case. The app remains a static consumer of imported
  JSON and does not call FPL from the browser.
- **Score of record:** The scoreboard score is the imported FPL `points`
  minus the authoritative `event_transfers_cost`, regardless of chip use.
- **Transfer deductions:** Preserve
  `history.current[].event_transfers_cost` in imported data for transparency.
  Apply the deduction once during import; the app consumes the resulting net
  score without recalculation.
- **Chip usage:** Preserve historical `history.chips[]` mapped to its
  Gameweek. Use the per-Gameweek picks endpoint only when authoritative
  `active_chip` confirmation is needed. Chip data explains a zero transfer
  cost where relevant; it does not cause client-side score recalculation.
- **Shared importer:** Local use and the workflow invoke exactly one importer
  implementation, preventing divergent data shapes or calculation behaviour.
- **Canonical output:** A successful local import replaces
  `data/season-2026-27.json`, the canonical file read by the app. It writes
  only after all source data has been fetched and validated.
- **Workflow schedule:** The workflow runs every Tuesday and supports
  `workflow_dispatch` for an ad hoc refresh.
- **Workflow output:** The workflow uploads a timestamped JSON artifact.
  The artifact is the canonical season-file shape produced by the shared
  importer; the workflow does not commit, open a pull request, or deploy.
- **Consistency metadata:** Each imported snapshot includes a retrieval time
  and source league ID. Separate FPL endpoint responses are not atomic during
  live scoring, so consumers must not treat the snapshot as live data.
- **Failure behaviour:** A failed import must fail visibly and retain prior
  checked-in data. It must never replace usable data with an empty snapshot.

## Context

FPL's public endpoints expose the data needed for league `869128`, but are an
undocumented interface and cannot be fetched directly from a separately hosted
browser application because of CORS restrictions. A local/import-time fetch
keeps quids-in static, zero-cost, and free of backend services while enabling
repeatable data refreshes.

This phase intentionally keeps artifact production separate from deployment.
Phase 10 will decide how an approved imported artifact becomes part of a GitHub
Pages deployment.
