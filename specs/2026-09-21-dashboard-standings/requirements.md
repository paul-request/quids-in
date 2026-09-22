# Requirements — Dashboard, Standings, and Slugs (Phase 3)

## Source

This feature implements [Phase 3](../roadmap.md) of the quids-in roadmap:

> Build the landing-page dashboard for the latest Gameweek, overall standings,
> and weekly-loss ranking, with selectable results for every recorded
> Gameweek.

## Scope

In scope:

- Populate `data/season-2025-26.json` with two or three clearly labelled
  sample Gameweeks, including at least one joint-win result.
- Replace the current participant-only landing page with a dashboard that
  shows:
  - the latest Gameweek (the final `gameweeks` array item);
  - every participant's score in that Gameweek;
  - the winner or joint winners for that Gameweek; and
  - the overall season standings, including fractional wins; and
  - a season ranking of participants with the most weekly losses.
- Provide a labelled dropdown on the dashboard for switching between the
  latest Gameweek and all previous recorded Gameweeks.
- Show the selected Gameweek's scores, winner or joint winners, win shares,
  and last-place participant or participants in the dashboard view.
- Provide a visible, useful empty state when a season contains no Gameweeks,
  rather than calling the rules engine with no current Gameweek.
- Make the dashboard responsive and usable with a keyboard.
- Add presentation tests for the dashboard, Gameweek selection, and empty
  states.

Out of scope:

- Replacing sample results with real 2025-26 Gameweeks 1-4 or verifying them
  against FPL; that is Phase 4.
- Editing Gameweek data in the browser.
- Live FPL API requests, scraping, a backend, authentication, or a database.
- Prize-pot or money tracking.
- GitHub Pages deployment or a deployment workflow.
- Historical-season browsing.

## Decisions

- **Latest Gameweek:** The latest result is always the final entry in the
  ordered `gameweeks` array. The dashboard must not introduce a separate
  current-Gameweek field.
- **Sample data:** The committed data will contain enough ordered sample
  Gameweeks to demonstrate a clear winner, a joint winner, and aggregation.
  These are temporary development fixtures and Phase 4 replaces them with
  verified real results.
- **Rules source:** The UI consumes `calculateGameweekResult` and
  `calculateSeasonLeaderboard`; it does not reproduce winner, tie, fractional
  share, last-place, or sorting calculations.
- **Score display:** Scores are rendered in the stable participant order from
  the season data in a semantic HTML table. The selected Gameweek rows sort
  by score descending, retaining season participant order for equal scores.
  Gameweek score-table rows retain the dark, bordered horizontal-card styling
  so results remain easy to scan. Individual table cells show the numeric
  score only, because the Score column heading provides the unit; standings
  retain the rules engine's total-wins ordering.
- **Score summaries:** The selected Gameweek summary labels its highest score
  with a trophy emoji and its lowest score with a slug emoji. The lowest-score
  summary appears on a new line and identifies every lowest-scoring
  participant in bold brackets after the score.
- **Winner and slug labels:** The summary names winners without repeating
  their fractional win shares or a `Winner`/`Slug` label; participant names
  appear in bold brackets after the corresponding score. Table badges use
  `🏆 Winner` and `🐌 Slug`; `Last place` is not shown.
- **Responsive dashboard:** The selected-round and overall-standings panels
  stack on narrow and medium screens, then display in two columns from a
  64rem viewport width.
- **Gameweek selector label:** The selector keeps an accessible name for
  assistive technology, but its visual label is hidden to keep the compact
  dashboard heading.
- **Tied standings positions:** The first participant at a given total-wins
  value displays their numerical table position. Each immediately following
  participant with the same total displays `=` instead, while later,
  non-tied rows keep their original row-number position.
- **Gameweek selection:** The latest Gameweek is selected by default. A
  labelled native dropdown lists every recorded Gameweek in reverse
  chronological order and switches the dashboard results in place; no
  duplicate detail route or browse-links list is needed.
- **Winner emphasis:** Every joint winner receives the same visible,
  non-colour-only winner indicator. The selected Gameweek identifies the
  winning score and each winner's fractional share.
- **Last-place display:** The selected Gameweek identifies every participant
  tied for the lowest score. Last place is informational and does not alter
  the standings.
- **Weekly losses:** A weekly loss is a last-place finish in a recorded
  Gameweek. Every participant tied for the lowest score receives one loss for
  that Gameweek.
- **Slug ranking:** A card titled `The slugs` lists participants by weekly
  losses in descending order, showing each participant's name, team, and loss
  count. Participants with no weekly losses are omitted. Equal loss totals
  retain season participant order.
- **Dashboard layout:** Below 64rem, the selected Gameweek, overall standings,
  and slug cards stack in source order. At or above 64rem, the selected
  Gameweek card spans the full dashboard width and the overall standings and
  slug cards form two equal columns underneath it.
- **No recorded Gameweeks:** The dashboard displays the participant list and
  zero-win standings from the existing rules engine, an empty `The slugs`
  table, and a message that no Gameweek results have been recorded. It does
  not render a fictional current round or Gameweek links.

## Context

quids-in is a static scoreboard for one group of 12 Fantasy Premier League
friends. Season JSON is deliberately updated by hand after results are
finalised. The Phase 2 rules engine already derives single-Gameweek results
and fractional-win standings from that JSON, making Phase 3 a presentation and
navigation feature rather than a new calculation feature.

The implementation follows [mission.md](../mission.md) and
[tech-stack.md](../tech-stack.md): it remains lightweight, static, responsive,
and zero-cost. The app continues to import the season JSON at build time and
must not make network requests.
