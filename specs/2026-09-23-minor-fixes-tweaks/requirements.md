# Requirements: Minor fixes and tweaks

## Scope

Deliver the next roadmap phase for quids-in as two focused improvements:

1. Make the Gameweek selector's custom styling consistent across supported
   desktop and mobile Safari, Chrome, and Firefox, including a white
   dropdown arrow.
2. Run the FPL season-data import daily at midnight and make it change-aware
   so the repository and GitHub Pages site are updated only when the
   generated season snapshot has changed.

The previously reported winner-border issue is excluded because it has
already been fixed.

## Context

- The dashboard renders the Gameweek selector in
  `libs/quids-in/feature-shell/App.svelte` and styles it in
  `libs/quids-in/feature-shell/app.css`.
- The selector must retain its current keyboard behaviour, accessible
  label, selected Gameweek behaviour, and focus indicator.
- The scheduled import is defined in
  `.github/workflows/import-season-data.yml`.
- `scripts/import-season-data.mjs` fetches the public FPL league and history
  data and writes `data/season-2026-27.json`.
- `.github/workflows/deploy-pages.yml` currently builds and deploys on pushes
  to `main`.
- The import workflow currently uploads an artifact and does not update the
  committed snapshot or trigger deployment.

## Functional requirements

### Gameweek selector styling

1. The selector has a consistent dark-background presentation in Safari,
   Chrome, and Firefox on supported desktop and mobile widths.
2. The dropdown arrow is explicitly rendered in white or an equivalent
   approved high-contrast treatment in each supported browser.
3. The arrow remains visible and does not overlap the selected option text.
4. The selector remains keyboard-operable and retains a visible
   `:focus-visible` state.
5. The selector keeps its existing accessible name and continues to update
   the selected Gameweek and displayed results.
6. The styling does not introduce horizontal overflow or truncate the
   selected option at supported mobile widths.

### Change-aware FPL import and deployment

7. The scheduled workflow runs once every day at midnight. The manually
    dispatched workflow remains available and follows the same behaviour.
8. Each scheduled and manually dispatched run uses the existing import
    command and validates the generated season snapshot before comparing it.
9. The workflow compares the canonical generated snapshot with the
    repository's committed `data/season-2026-27.json` content, ignoring only
    non-semantic formatting differences if the implementation normalises
    them.
10. When the snapshot is unchanged, the workflow reports a clear no-change
    result and does not commit, push, or deploy.
11. When the snapshot changes, the workflow commits the refreshed
    `data/season-2026-27.json` to `main` using an explicit automated commit
    message and pushes it with the minimum required repository permission.
12. A changed snapshot causes the existing push-to-`main` Pages workflow to
    perform the normal build and deployment.
13. The workflow remains safely repeatable: rerunning the same import after
    a successful update must produce no second data commit.
14. Import failures, invalid API responses, validation failures, and commit
    or push failures are surfaced as failed workflow steps; they must not be
    treated as no-change successes.
15. Manual `workflow_dispatch` runs follow the same comparison and
    commit/deploy rules as scheduled runs.

## Decisions

- **Browser support:** Safari, Chrome, and Firefox on desktop and mobile.
- **Arrow treatment:** use an explicitly styled white arrow rather than
  relying on inconsistent native arrow colours.
- **Schedule:** run the cron at midnight every day so the data can be
  refreshed promptly after FPL changes.
- **Freshness decision:** run the import and compare the generated canonical
  snapshot with the committed season snapshot; an unchanged comparison is
  the signal that no refresh commit or deployment is needed.
- **Update path:** when data changes, commit the snapshot directly to
  `main`; the existing push-triggered Pages workflow remains the deployment
  mechanism.
- **No-change path:** do not create a commit or invoke a deployment when the
  snapshot is unchanged.
- **Existing app behaviour:** preserve the selector's semantics, Gameweek
  ordering, results, accessibility, and focus treatment.
- **Winner border:** no work is planned for this already-fixed issue.

## Out of scope

- Redesigning the selector, changing its label, or changing Gameweek
  selection semantics.
- Supporting browsers outside the agreed Safari, Chrome, and Firefox target.
- Changing scoreboard calculations, FPL data mapping, or season-data schema
  beyond what is needed to compare and commit the generated snapshot.
- Deploying from artifacts, adding a separate deployment platform, or
  replacing GitHub Pages.
- Automatic live FPL requests from the browser.
- Authentication, pull-request approval flows, or payment behaviour.
- Reworking the winner row border or other unrelated visual polish.
