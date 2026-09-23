# Validation: Minor fixes and tweaks

## Automated checks

1. Run `npm run lint` and confirm there are no new diagnostics.
2. Run `npm run typecheck` and confirm the Svelte and TypeScript checks pass.
3. Run `npm test` and confirm existing and new tests pass.
4. Run `npm run build` and confirm the production bundle succeeds.
5. Run `npm run validate` as the merge-gate command.
6. Test the import and deployment path with:
   - malformed generated data;
   - import failures;
   - build failures; and
   - deployment failures.
7. Validate the workflow definition so:
   - the cron runs every day at midnight;
   - scheduled and manual dispatches use the same import, build, and deploy
     path;
   - permissions are sufficient; and
   - the freshly generated snapshot is included in the Pages build.

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
2. Run the import workflow manually against controlled data; confirm it
   builds and deploys the site using the freshly generated snapshot.
3. Confirm the workflow does not commit or modify `main`.
4. Force an import, build, or deployment failure; confirm the workflow fails
   visibly.

## Merge gate

The phase is ready to merge only when the selector checks pass in all agreed
browsers and viewport classes, the direct daily deployment path is verified,
failure states are explicit, `npm run validate` passes, and no regression is
observed in the existing dashboard or GitHub Pages deployment flow.
