# Requirements: Fresh data on merge deployments

## Problem

Merging a pull request to `main` replaces the live site's fresh FPL data
with stale data from the repository.

- `.github/workflows/import-season-data.yml` runs daily at midnight UTC. It
  imports fresh FPL data, builds the site and deploys it directly to GitHub
  Pages. It does not commit the snapshot, as agreed in the minor fixes and
  tweaks phase.
- `.github/workflows/deploy-pages.yml` runs on every push to `main`. It
  builds from the committed `data/season-2026-27.json`, which is only as
  fresh as the last manual commit, and then deploys it.
- As a result, every merge rolls the live dashboard, cups and "Data last
  refreshed" footer back to the committed snapshot until the next midnight
  run.
- The two workflows use different concurrency groups (`pages` and
  `import-and-deploy-season-data`), so a merge deployment and a scheduled
  deployment can also race, and whichever finishes last wins.

## Scope

Every deployment to GitHub Pages builds with freshly imported FPL data,
whether it is triggered by a merge to `main`, the daily schedule or a manual
dispatch.

## Functional requirements

1. A push to `main` imports the current FPL season data with the existing
   `npm run import:season-data` command before building and deploying.
2. The daily midnight UTC schedule and the manual `workflow_dispatch` path
   keep their current import, build and deploy behaviour.
3. All three triggers use one shared import, build and deploy path, so the
   paths cannot diverge again.
4. All Pages deployments share one concurrency group. They run one at a
   time, and a deployment that has started is never cancelled mid-way.
5. If the import fails, the whole import is retried up to 3 times in total,
   with a back-off between attempts. This is in addition to the importer's
   existing per-request retries, and covers FPL maintenance windows such as
   "the game is being updated" 503 responses.
6. If every attempt fails, the workflow fails before the build and deploy
   steps. The live site keeps its last successful deployment and is never
   rebuilt from the committed snapshot.
7. Import failures and retries are visible in the workflow log. Each retry
   logs the attempt number and the error.
8. The freshly imported snapshot is still uploaded as a workflow artifact
   for 30 days, whatever the trigger.
9. No workflow commits to, or modifies, `main`.

## Decisions

- **Consolidate workflows:** merge the two workflows into one Pages
  workflow with `push` (to `main`), `schedule` and `workflow_dispatch`
  triggers, rather than duplicating the import steps.
- **Failure policy:** retry the import, then fail the deployment. Never fall
  back to the committed snapshot, because that would reintroduce the stale
  data regression.
- **Retry location:** retry at workflow level around the whole import
  command. The importer writes atomically, so a retried run can never deploy
  a half-written snapshot.
- **Concurrency:** use the `pages` group with `cancel-in-progress: false`.
  GitHub keeps only the newest pending run, so queued deployments collapse
  to the latest one.
- **Committed snapshot:** keep `data/season-2026-27.json` in the repository
  for local development, tests and type imports. Deployments never rely on
  it.

## Out of scope

- Committing refreshed snapshots back to `main`.
- Changing the importer's data mapping, schema or per-request retry
  behaviour.
- Changing the midnight schedule or the cup-draw workflow.
- Live FPL requests from the browser.
- Replacing GitHub Pages or adding another deployment platform.
