# Plan — Real Season Data Import (Phase 4)

## 1. Define import data contracts

1. Extend the season-data interfaces so `Participant.id` and every Gameweek
   score reference use the FPL standings entry ID rather than an app-assigned
   ID. Retain display name and team name as mutable presentation fields.
2. Add raw FPL import metadata needed for Gameweek traceability: source league
   ID, retrieval time, net score, transfer count, transfer deduction, and chip
   usage.
3. Keep derived winners, fractional shares, and season standings out of the
   imported JSON.
4. Calculate each score at import time by subtracting the authoritative FPL
   transfer cost, then ensure the rules engine does not apply the deduction a
   second time.
5. Define validation failures for incomplete pagination, missing or duplicate
   FPL entry IDs, unknown entries,
   malformed FPL payloads, missing Gameweeks, and non-finite numeric values.

## 2. Implement the shared FPL importer

1. Fetch all standings pages from
   `leagues-classic/869128/standings/`.
2. For every league entry, fetch `entry/{entryId}/history/`.
3. Map each participant and score reference to its FPL standings entry ID, then
   map `history.current[]` to ordered Gameweek records, calculating net points
   from `points` and `event_transfers_cost` and preserving transfer metadata.
4. Map `history.chips[]` to the corresponding Gameweek; use the picks
   endpoint only where an authoritative active-chip check is required.
5. After successful validation, atomically replace
   `data/season-2026-27.json`, the canonical static JSON consumed by the
   application.
6. Fail explicitly on FPL request, pagination, mapping, or validation errors;
   never replace the canonical file with an empty or partial snapshot after a
   failed import.
7. Add deterministic unit tests with fixture payloads for pagination, net
   score mapping, transfer cost, chip mapping, and invalid payloads.

## 3. Load and verify real data

1. Run the importer locally for league `869128`.
2. Generate `data/season-2026-27.json` from the active league and update the
   dashboard to consume it. Preserve `data/season-2025-26.json` as a
   historical fixture pending separate backfill analysis.
3. Compare every imported Gameweek winner and season leaderboard result with
   the official FPL site.
4. Record any source discrepancy and correct the importer or data mapping
   before accepting the snapshot.

## 4. Add artifact-only GitHub Actions refresh

1. Add a workflow that uses the shared importer on a Tuesday cron schedule.
2. Add `workflow_dispatch` to permit an ad hoc refresh.
3. Upload the generated canonical season-file snapshot as a timestamped
   artifact with an explicit retention period.
4. Do not commit output to `main`, open a pull request, or deploy from this
   workflow.
5. Make workflow failures visible and preserve previously checked-in data.

## 5. Update documentation and validate

1. Document local importer prerequisites, command usage, output location, and
   review process in the README.
2. Document the artifact-only workflow boundary and its relationship to the
   later GitHub Pages deployment.
3. Run importer unit tests, `npm run validate`, and a local dashboard review
   against the real snapshot.
4. Verify every item in [validation.md](./validation.md) before merging.
