# Validation — Dashboard, Standings, and Slugs (Phase 3)

This phase is ready to merge when every applicable check below passes.

## Data and calculation integration

- [ ] `data/season-2025-26.json` contains two or three valid, ordered sample
      Gameweeks with a clear-winner case and a joint-winner case.
- [ ] No derived winner, share, last-place, or standings data is stored in
      the season JSON.
- [ ] The current round on the dashboard is the final Gameweek array entry.
- [ ] The dashboard uses the existing rules-engine functions
      rather than independently calculating results.
- [ ] The overall standings show fractional totals and preserve the
      rules-engine's deterministic ordering.
- [ ] Weekly losses are derived from each recorded Gameweek's last-place
      participants rather than stored in the season JSON.
- [ ] Every participant tied for a Gameweek's lowest score receives one weekly
      loss.

## Dashboard behaviour

- [ ] The landing page at `/` shows the current Gameweek number, every
      participant's score, and the winning score.
- [ ] The selected-Gameweek summary shows highest and lowest scores, labelled
      with trophy and slug emoji respectively.
- [ ] The lowest-score summary appears on a new line and identifies every
      lowest-scoring participant in bold brackets after the score.
- [ ] Score summaries do not display `Winner` or `Slug`; they show the
      corresponding participant names in bold brackets after each score.
- [ ] Winner badges include a trophy emoji and slug badges use `🐌 Slug`;
      neither table nor summary displays a winner share or `Last place`.
- [ ] Selected-Gameweek rows sort by score descending and retain season
      participant order when scores are equal.
- [ ] Selected-Gameweek score cells show numeric values without a redundant
      `points` suffix.
- [ ] Current-round and selected-Gameweek scores are rendered in semantic HTML
      tables whose rows retain a horizontal-card appearance.
- [ ] A single winner is clearly identified.
- [ ] All joint winners are equally identified and their individual
      fractional shares are shown.
- [ ] The standings identify participant names or teams alongside total wins.
- [ ] A card titled `The slugs` shows each ranked participant's name, team,
      and weekly loss count.
- [ ] The slug card orders participants by weekly losses descending, omits
      participants with zero losses, and retains season participant order for
      tied totals.
- [ ] The first row at a tied total retains its numerical position and each
      following tied row displays `=` without changing leaderboard order.
- [ ] A labelled, keyboard-operable dropdown lists every recorded Gameweek,
      selects the latest by default, and updates the displayed results.
- [ ] The selector retains an accessible label while its visible label is
      hidden.
- [ ] Winner emphasis does not rely on colour alone.
- [ ] The populated dashboard is usable at phone, tablet, and desktop widths.
- [ ] All dashboard cards stack in source order below 64rem.
- [ ] At or above 64rem, the selected-Gameweek card spans the full dashboard
      width and the overall standings and slug cards display in two equal
      columns underneath it.

## Gameweek selection

- [ ] Selecting any recorded Gameweek displays every participant score,
      winner or joint winners, fractional win shares, and all last-place
      participants.
- [ ] No separate detail route, route resolver, or browse-links list remains.

## Empty data and regressions

- [ ] With an empty Gameweeks array, the landing page renders a clear
      no-results message, zero-win standings for every participant, and no
      zero-loss rows in the slug card.
- [ ] An empty Gameweeks array does not cause a rules-engine error or render
      a fictional current Gameweek.
- [ ] Existing participant identity and team-name display data remain intact.
- [ ] No live FPL requests, scraping, backend, authentication, data editing,
      prize tracking, historical seasons, or deployment workflow is added.

## Automated and manual checks

- [ ] Presentation tests cover populated dashboard output, joint winners and
      fractional standings, slug ranking, Gameweek selection, and no-results
      behaviour.
- [ ] Utility tests cover weekly loss aggregation, tied last place,
      deterministic ordering, and zero-loss exclusion.
- [ ] Existing rules-engine tests continue to pass.
- [ ] `npm run validate` passes (lint, type check, Vitest, and production
      build).
- [ ] Manual checks confirm readable responsive layouts and visible keyboard
      focus for navigation links.
- [ ] `git status` contains only intended Phase 3 specification and
      implementation changes.

## Sign-off

Once every box is checked, the dashboard is ready to merge into `main`.
Phase 4 can then replace the temporary sample Gameweeks with verified real
2025-26 results.

## Validation evidence (retrospective)

Re-run on 2026-09-22 against the current `main`: `npm run validate` (lint,
typecheck, test, build) passed — 55/55 Vitest tests, 0 ESLint warnings, 0
svelte-check/tsc errors, and a successful production build. This confirms
the automated checks above still hold against the current codebase. Manual
and browser checks were not re-executed retroactively for this historical
phase; they remain the responsibility of the phase's original review.
