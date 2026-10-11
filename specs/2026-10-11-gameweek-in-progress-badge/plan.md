# Plan: In-progress Gameweek badge (Phase 15)

## 1. Extend the status contract

1. Add optional `started` metadata to `Gameweek` in
   `libs/quids-in/utility/results.interfaces.ts`.
2. Extend the snapshot validator in `scripts/import-season-data.mjs` to
   accept an omitted field and reject supplied non-boolean values.
3. Preserve optional completion metadata for legacy snapshots. Add tests
   demonstrating old snapshots still load with no inferred live badge.

## 2. Import start and completion status

1. Replace `fetchEndedGameweeks` with `fetchGameweekStatuses` to retain matching event status
   as well as the existing completed-event FPL average.
2. Compare each valid `deadline_time` with the import's `retrievedAt`,
   rather than the browser's clock or multiple reads of the current time.
3. Populate `started` and explicit `ended` metadata for known events.
   Represent unavailable status as unknown, not confirmed unfinished.
4. Preserve the existing FPL average availability rule and every score,
   transfer and cup field. Keep one `bootstrap-static` request per import.
5. Extend `scripts/import-season-data.test.ts` with before-deadline,
   exact-deadline, live, finished-but-unchecked, finished-and-checked,
   missing metadata and malformed supplied metadata cases.

## 3. Define badge visibility

1. Follow the existing utility patterns to express the exact visibility
   rule: selected round is latest, started is true and ended is false.
2. Test the rule deterministically using snapshot metadata, without
   wall-clock timing, network calls or assumptions based on score values.
3. Cover an earlier selected round, unknown metadata, no recorded rounds
   and the transition to finished-and-checked.

## 4. Render the badge

1. Wire the visibility rule into `App.svelte`.
2. Place a non-interactive text badge beside the heading within the existing
   results-card heading layout. Keep the heading's accessible name and the
   selector options unchanged.
3. Reuse existing styling conventions and add only scoped presentation
   needed for text contrast, spacing and narrow-screen wrapping.
4. Extend `App.test.ts` to verify presence, absence and selection-driven
   updates, while preserving existing card and navigation assertions.
5. Keep the stats card, season summaries and player/cup pages unchanged.

## 5. Document and review a representative snapshot

1. Document `started`, unknown status and snapshot-based timing in
   `README.md`; preserve the current import/deployment guidance.
2. If a real data refresh is available during implementation, run
   `npm run import:season-data` and inspect the imported metadata against
   the source event. Do not commit unrelated snapshot churn merely to test
   the badge; deterministic fixtures cover unavailable live states.
3. Update Phase 15's roadmap status only when implementation is verified.
   Keep Phases 16–18 planned and independent.

## 6. Validate and record evidence

1. Run the targeted importer, visibility and app tests first, then the
   complete `npm run validate` suite.
2. Perform the responsive, selection and accessibility checks in
   [validation.md](./validation.md).
3. Record exact commands, results and any unresolved checks. Review the
   final diff for scope and preservation of existing behaviour before
   requesting merge approval.

## Implementation status

Task groups 1-5 are implemented. Group 6's automated checks and controlled
browser layout, selection and accessibility-tree checks pass. Remaining
manual and deployment checks are recorded in [validation.md](./validation.md).
No real season snapshot was refreshed or committed.
