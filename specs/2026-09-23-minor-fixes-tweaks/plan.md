# Plan: Minor fixes and tweaks

1. **Define the change-detection contract**
   - Confirm the import output path, canonical serialisation, and comparison
     boundary for `data/season-2026-27.json`.
   - Schedule the workflow to run daily at midnight rather than only on
     Tuesdays.
   - Define workflow outputs for changed and unchanged snapshots.
   - Define the minimum GitHub Actions permission and an explicit automated
     commit message for changed data.

2. **Standardise Gameweek selector presentation**
   - Update the selector styling in `app.css` to remove browser-native
     arrow differences while preserving the existing select semantics.
   - Verify the arrow colour, spacing, focus ring, option readability, and
     responsive width at mobile and desktop breakpoints.
   - Keep the existing `App.svelte` label, binding, Gameweek ordering, and
     result updates unchanged unless a small integration adjustment is
     required by the styling approach.

3. **Implement snapshot comparison in the import workflow**
   - Run the existing import command from the daily midnight schedule and
     the manual dispatch path.
   - Compare the generated snapshot with the committed snapshot after
     validation.
   - Treat an equivalent snapshot as sufficiently fresh: report no change
     without committing, pushing, or deploying.
   - Commit and push only the refreshed season snapshot when values differ,
     allowing the existing `deploy-pages.yml` push trigger to deploy it.
   - Surface import, validation, comparison, git, and push errors explicitly.

4. **Add regression coverage**
   - Extend import-script or workflow-support tests for equal snapshots,
     changed snapshots, canonical formatting, repeat runs, and failures.
   - Add component or browser-facing coverage for selector rendering,
     accessible naming, keyboard focus, selected-value updates, and mobile
     layout constraints.
   - Keep existing dashboard and import behaviour covered.

5. **Validate the phase for merge**
   - Run the focused import tests and frontend tests.
   - Run lint, type-check, and the repository validation command.
   - Exercise scheduled-equivalent and manual workflow paths with mocked or
     fixture data for both changed and unchanged snapshots.
   - Verify the Pages workflow is triggered only by a changed-data commit and
     that no-change runs leave `main` untouched.
