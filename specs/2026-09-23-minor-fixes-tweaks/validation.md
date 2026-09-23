# Validation: Minor fixes and tweaks

## Automated checks

1. Run `npm run lint` and confirm there are no new diagnostics.
2. Run `npm run typecheck` and confirm the Svelte and TypeScript checks pass.
3. Run `npm test` and confirm existing and new tests pass.
4. Run `npm run build` and confirm the production bundle succeeds.
5. Run `npm run validate` as the merge-gate command.
6. Test the import comparison logic with:
   - identical generated and committed snapshots;
   - semantically changed scores, chips, participants, or Gameweeks;
   - equivalent snapshots with only normalised formatting differences;
   - a repeated run after a changed snapshot has been committed;
   - malformed generated data;
   - import, git, commit, and push failures.
7. Validate the workflow definition so:
   - the cron runs every day at midnight;
   - scheduled and manual dispatches use the same change-aware path;
   - permissions are sufficient; and
   - no-change runs cannot reach a deployment-triggering push.

## Browser and accessibility checks

1. Run the app locally and verify the Gameweek selector in Safari, Chrome,
   and Firefox at supported desktop and mobile viewport sizes.
2. Confirm the arrow is white and consistently visible, the selected text is
   readable, and no horizontal overflow is introduced.
3. Navigate to the selector with the keyboard, open and change it, confirm
   the focus indicator remains visible, and verify that the displayed
   Gameweek results update.
4. Confirm the existing accessible label remains exposed to assistive
   technology and that the selector remains a native single-select control.
5. Confirm existing winner, slug, standings, chip, and player-link behaviour
   is unchanged.

## Manual workflow acceptance

1. Confirm the workflow schedule is configured for midnight daily.
2. Run the import workflow manually against a fixture or controlled test
   snapshot that is unchanged; confirm it logs no change and creates no
   commit or deployment.
3. Run it with changed FPL data; confirm it validates, commits only the
   season snapshot to `main`, and causes the existing Pages deployment to
   run through its `push` trigger.
4. Rerun the same changed-data workflow; confirm no duplicate commit or
   deployment is created.
5. Force an import or push failure; confirm the workflow fails visibly and
   does not report a successful no-change result.

## Merge gate

The phase is ready to merge only when the selector checks pass in all agreed
browsers and viewport classes, the changed and unchanged workflow paths are
verified, failure states are explicit, `npm run validate` passes, and no
regression is observed in the existing dashboard or GitHub Pages deployment
flow.
