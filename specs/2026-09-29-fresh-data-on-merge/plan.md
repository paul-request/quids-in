# Plan: Fresh data on merge deployments

## 1. Consolidate into one Pages workflow

1. Update `.github/workflows/deploy-pages.yml` to trigger on:
   - `push` to `main`;
   - `schedule` at `0 0 * * *`; and
   - `workflow_dispatch`.
2. Set the workflow concurrency to `group: pages` and
   `cancel-in-progress: false`.
3. Keep the existing `build` and `deploy` job split, the `github-pages`
   environment and the least-privilege permissions (`contents: read`,
   `pages: write`, `id-token: write`). Add `timeout-minutes: 15` to the
   build job so it matches the current import workflow.
4. Delete `.github/workflows/import-season-data.yml` once its steps have
   moved across.

## 2. Import fresh data before every build

1. In the `build` job, after `npm ci`, add an **Import current FPL season
   data** step that runs `npm run import:season-data`, wrapped in a bash
   retry loop:
   - up to 3 attempts in total;
   - a back-off between attempts, for example 60 seconds and then 120
     seconds;
   - a `::warning::` annotation with the attempt number on each failed
     attempt; and
   - a `::error::` annotation and a non-zero exit after the final failure.
2. Run `npm run build` only after a successful import, so a failed import
   stops the job before the build and deploy steps.
3. Keep the `upload-artifact` step for `data/season-2026-27.json`, with
   30-day retention, for every trigger.
4. Upload `dist` with `actions/upload-pages-artifact` as the job does now.

## 3. Keep the retry logic simple and testable

1. Prefer a small `scripts/retry.sh`, or an inline step, taking the
   attempt count and back-off as arguments, so it can be exercised locally.
2. If a script is added, make it executable. Keep it free of new
   dependencies and document its usage in a comment.

## 4. Update the documentation

1. Update `README.md` deployment notes to say that every deployment,
   including merges, imports fresh FPL data. Describe the retry and failure
   behaviour.
2. Add a Phase 13 entry to `specs/roadmap.md` that links to this spec, and
   update the current status.
3. Note in the Phase 10 and minor fixes and tweaks history that the daily
   import workflow has been folded into `deploy-pages.yml`.

## 5. Validate

1. Run `npm run validate`.
2. Lint the workflow with `actionlint`, if available, and check the YAML
   syntax.
3. Exercise the retry loop locally with a command that fails twice and then
   succeeds, and with one that always fails.
4. After merging, confirm that the merge deployment shows a current "Data
   last refreshed" timestamp. Then trigger a manual dispatch to confirm the
   shared path works (see `validation.md`).
