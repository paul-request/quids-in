# Validation: Fresh data on merge deployments

## Automated checks

1. Run `npm run validate` and confirm that lint, type-check, tests and build
   all pass.
2. Lint `.github/workflows/deploy-pages.yml` with `actionlint`, or an
   equivalent YAML and schema check, and confirm there are no errors.
3. Confirm that `.github/workflows/import-season-data.yml` has been removed
   and that no other workflow deploys to Pages.

## Workflow definition review

1. The triggers are `push` to `main`, `schedule` with `0 0 * * *`, and
   `workflow_dispatch`.
2. The concurrency is `group: pages` with `cancel-in-progress: false`.
3. The import step runs before `npm run build` for every trigger, with no
   trigger-specific conditions that skip it.
4. The retry loop allows at most 3 attempts, with a back-off, and exits with
   a non-zero code after the final failure.
5. Permissions are unchanged: `contents: read`, `pages: write` and
   `id-token: write`. No step pushes to the repository.
6. The snapshot artifact upload is present, with 30-day retention.

## Retry behaviour checks

1. Simulate a command that fails twice and then succeeds. Confirm there are
   3 attempts and 2 warnings, and that the step succeeds.
2. Simulate a command that always fails. Confirm there are 3 attempts and a
   final error, that the step fails and that no build step runs.
3. Simulate a command that succeeds first time. Confirm there are no
   retries and no delay.

## Manual acceptance on GitHub

1. Merge the pull request. Confirm that the resulting `push` run imports
   fresh data and deploys, and that the live footer's "Data last refreshed"
   time matches the run time, not the committed snapshot.
2. Trigger `workflow_dispatch` and confirm that it follows the same path and
   deploys successfully.
3. Confirm that the next midnight scheduled run succeeds from the
   consolidated workflow.
4. Optionally, break the import temporarily on a branch run, for example by
   passing an invalid league ID. Confirm that the retries are logged, the
   run fails and the live site is unchanged.
5. Confirm that `main` has no bot commits after any of these runs.

## Merge gate

This phase is ready to merge when `npm run validate` passes, the workflow
definition review is complete, the retry checks pass, and the documentation
and roadmap are updated. Complete the manual acceptance steps immediately
after merging.
