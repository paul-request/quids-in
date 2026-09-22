# Validation — Real Season Data Import (Phase 4)

This phase is ready to merge when every applicable check below passes.

## Import correctness

- [ ] The importer fetches all pages of league `869128` standings.
- [ ] Every imported league entry uses its FPL standings entry ID as
      `participants[].id` and for all associated Gameweek score references;
      no app-assigned participant IDs remain.
- [ ] Each imported FPL entry ID is present, finite, unique within the season,
      and paired with the expected display information.
- [ ] Each imported Gameweek stores net points calculated by subtracting
      authoritative `event_transfers_cost` from FPL `points` and preserves
      transfer metadata.
- [ ] The dashboard uses the imported net score without deducting transfer
      cost again.
- [ ] Completed chip use from `history.chips[]` is mapped to its Gameweek.
- [ ] A picks-endpoint `active_chip` lookup is used only where current-week
      confirmation is needed.
- [ ] The snapshot includes its retrieval time and source league ID.
- [ ] Derived winners, shares, and season standings are not stored in source
      snapshot data.
- [ ] A successful local import replaces `data/season-2026-27.json` only
      after the complete snapshot has passed validation.

## Failure handling

- [ ] FPL request failures, malformed payloads, incomplete standings
      pagination, invalid entry IDs, and invalid score values fail explicitly.
- [ ] An unsuccessful import does not create an empty or partial replacement
      snapshot.
- [ ] Import tests use deterministic local fixture payloads rather than live
      FPL requests.

## Real data verification

- [ ] The checked-in 2026-27 data contains the real active-league
      participants and available Gameweeks, not placeholders or development
      fixtures.
- [ ] Each Gameweek winner is manually cross-checked against the official FPL
      site.
- [ ] The resulting fractional-win leaderboard is manually cross-checked
      against those verified Gameweek winners.
- [ ] Any actual tie, transfer deduction, and chip usage in the imported data
      is correctly represented.

## GitHub Actions artifact workflow

- [ ] The workflow runs on a Tuesday schedule and supports
      `workflow_dispatch`.
- [ ] The workflow invokes the same importer command used locally.
- [ ] A successful workflow uploads a timestamped snapshot artifact.
- [ ] The artifact has the same canonical season-file shape as
      `data/season-2026-27.json`.
- [ ] The workflow does not commit data to `main`, create a pull request, or
      deploy the app.
- [ ] Workflow failure is visible and does not affect existing checked-in
      data.

## Regression and sign-off

- [ ] `npm run validate` passes.
- [ ] The local dashboard displays the imported Gameweek and standings data
      correctly.
- [ ] README documentation explains local imports and the artifact-only
      workflow boundary.
- [ ] `git status` contains only intended Phase 4 changes.

Once every applicable box is checked, the verified static data import is ready
to merge. Deployment integration remains Phase 10 work.

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
