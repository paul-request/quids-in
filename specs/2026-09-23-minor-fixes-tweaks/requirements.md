# Requirements: Minor fixes and tweaks

## Scope

Deliver the next roadmap phase for quids-in as two focused improvements:

1. Make the Gameweek selector's custom styling consistent across supported
   desktop and mobile Safari, Chrome, and Firefox, including a white
   dropdown arrow.
2. Run the FPL season-data import daily at midnight and deploy the site using
   the freshly generated season snapshot.

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
- The import workflow builds and deploys the generated snapshot directly
  without updating the committed snapshot.

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

### FPL import and deployment

7. The scheduled workflow runs once every day at midnight UTC. The manually
    dispatched workflow remains available and follows the same behaviour.
8. Each scheduled and manually dispatched run uses the existing import
    command, validates the generated snapshot, builds the app, and deploys
    the resulting Pages artifact.
9. The generated snapshot is used for that deployment without being committed
    to `main` or compared with the checked-in snapshot.
10. Import failures, invalid API responses, validation failures, build
     failures, and deployment failures are surfaced as failed workflow steps.
11. Manual `workflow_dispatch` runs follow the same import, build, and deploy
     path as scheduled runs.

## Decisions

- **Browser support:** Safari, Chrome, and Firefox on desktop and mobile.
- **Arrow treatment:** use an explicitly styled white arrow rather than
  relying on inconsistent native arrow colours.
- **Schedule:** run the cron at midnight UTC every day so the data can be
  refreshed promptly after FPL changes.
- **Update path:** import the current data, build the app with that snapshot,
  and deploy directly through GitHub Pages.
- **Repository data:** do not commit or modify the checked-in season snapshot
  from the scheduled workflow.
- **Existing app behaviour:** preserve the selector's semantics, Gameweek
  ordering, results, accessibility, and focus treatment.
- **Winner border:** no work is planned for this already-fixed issue.

## Out of scope

- Redesigning the selector, changing its label, or changing Gameweek
  selection semantics.
- Supporting browsers outside the agreed Safari, Chrome, and Firefox target.
- Changing scoreboard calculations, FPL data mapping, or season-data schema.
- Adding a separate deployment platform or replacing GitHub Pages.
- Automatic live FPL requests from the browser.
- Authentication, pull-request approval flows, or payment behaviour.
- Reworking the winner row border or other unrelated visual polish.
