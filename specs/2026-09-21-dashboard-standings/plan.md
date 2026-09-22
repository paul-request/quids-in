# Plan — Dashboard, Standings, and Slugs (Phase 3)

## 1. Prepare representative dashboard data

1. Add two or three chronologically ordered sample Gameweeks to
   `data/season-2025-26.json`.
2. Include a clear winner and at least one joint-win Gameweek so both winner
   states and fractional standings can be seen in the running app.
3. Keep participant IDs, score-map keys, and Gameweek order valid for the
   existing rules-engine validation.
4. Do not add derived winners, standings, or display-specific fields to the
   JSON.

## 2. Add typed dashboard presentation helpers

1. Inspect and reuse the existing result interfaces and pure calculation
   functions from `libs/quids-in/utility/`.
2. Add focused, typed presentation helpers only where mapping participant IDs
   to names, teams, scores, or win shares would otherwise be duplicated across
   the dashboard and detail view.
3. Preserve the existing rules engine as the sole implementation of scoring,
   tie, fractional-share, last-place, and leaderboard-order rules.
4. Add unit tests for any new pure helper, including unknown participant and
   missing-score handling where applicable.

## 3. Build the dashboard view

1. Replace the participant-only landing content with a dashboard component in
   `libs/quids-in/feature-shell/`.
2. Render the latest Gameweek from the final ordered Gameweek array entry.
3. Show every participant's latest score in season participant order, with
   equal, non-colour-only emphasis for all winners.
4. Show the winner or joint-winner names, highest score, and each winner's
   fractional win share.
5. Show the lowest score alongside the highest score, with the agreed slug
   and trophy emoji labels, on its own line and with every lowest scorer
   named in bold brackets after the score; use the same format for winners
   and do not show `Winner` or `Slug` in the summary.
6. Sort selected-Gameweek score rows descending by score, preserving season
   participant order when scores tie.
7. Render overall season standings using the existing aggregated leaderboard,
   resolving participant identity without changing its deterministic ordering.
8. Show `=` for a standing row whose total is tied with the preceding row,
   without changing the underlying leaderboard order.
9. Calculate weekly losses from each Gameweek's last-place participants,
   counting every participant in a tied last place.
10. Render a card titled `The slugs` with participant name, team, and loss
    count, ordered by losses descending. Omit participants with zero losses
    and retain season participant order for tied totals.
11. Include a labelled dropdown for switching the dashboard score display
   between all recorded Gameweeks, with the latest selected initially.
   Keep its accessible label while visually hiding it in the dashboard
   heading.
12. Render a useful no-results dashboard state for an empty Gameweeks array,
   including zero-win standings, an empty slug ranking, and no invalid
   current-round output.
13. Render Gameweek scores as semantic tables and style their rows as
   horizontal cards, rather than using a grid of individual cards.
14. Style the dashboard for narrow and wide viewports with readable headings
   and visible keyboard focus. Stack all cards below 64rem. At or above 64rem,
   make the Gameweek card full width and place the standings and slug cards in
   two equal columns underneath it.

## 4. Keep Gameweek selection in the dashboard

1. Render the selected Gameweek's participants, scores, highest score,
   winner or joint winners with fractional shares, and last-place participant
   or participants.
2. Do not add a separate Gameweek detail route or a duplicate browse-links
   list, because the selected results already provide the available detail.
3. Keep the selector native, labelled, and keyboard-operable.

## 5. Test and validate the user-facing behaviour

1. Add Svelte presentation tests for the populated dashboard, including the
   latest Gameweek, joint-winner emphasis, fractional overall standings, and
   the slug card.
2. Add tests that selecting a previous Gameweek updates the displayed scores,
   winners, and last place.
3. Add utility tests for weekly loss totals, tied last place, deterministic
   ordering, and exclusion of zero-loss participants.
4. Add tests for no-results states.
5. Confirm the existing rules-engine tests remain passing.
6. Run `npm run validate`.
7. Manually check the dashboard and Gameweek selector at phone, tablet, and
   desktop widths, including keyboard selection and the desktop card layout.
8. Verify the delivered changes satisfy every item in
   [validation.md](./validation.md) before merging.
