# Requirements: Weekly update workflow and responsive polish

## Scope

Implement Phase 9 of the quids-in roadmap. Make the weekly season-data update
workflow clear and repeatable for maintainers, and apply targeted responsive
and usability refinements to the fuller dashboard introduced through the
statistics phases.

## Context

- Season snapshots live in `data/`, with one JSON file per season.
- The importer already produces and validates the active-season snapshot.
- The dashboard now includes the selected Gameweek, overall standings, slug
  results, Gameweek stats, average weekly position, profit and loss, and
  player stats.
- The app is a static Svelte/Vite site and does not fetch live FPL data at
  runtime.
- The existing roadmap defers deployment work to Phase 10.

## Functional requirements

1. The repository README documents the supported weekly update workflow from
   importing or reviewing season data through validating the app and reviewing
   the generated snapshot.
2. The documentation identifies the season JSON location, the required
   top-level data shape, the meaning of `points`, `transferCost`, `transfers`,
   and optional `chip`, and the rule that Gameweeks are appended in order.
3. The documentation explains that imported data must be reviewed before it is
   committed and that the scheduled workflow uploads an artifact rather than
   modifying `main` or deploying the app.
4. The dashboard remains usable without horizontal page overflow at supported
   phone, tablet, and desktop widths.
5. Dashboard cards, tables, selectors, links, and player-stat content remain
   readable and usable at supported widths, including keyboard navigation and
   visible focus states.
6. Responsive refinements preserve the current information architecture and
   behaviour: selected Gameweek results, standings, slug results, statistics,
   player links, sorting, and player back navigation continue to work.
7. Responsive or visual changes do not alter imported scoreboard values,
   calculated statistics, ranking rules, balances, transfer counts, or route
   semantics.
8. The update workflow and responsive changes are covered by appropriate
   automated tests or documented browser verification.

## Decisions

- Scope includes both README workflow documentation and targeted responsive
  usability improvements.
- The weekly workflow remains static and build-time driven; no live API
  integration or deployment change is introduced.
- The importer remains the source of truth for generating season snapshots;
  maintainers should not hand-edit derived scoreboard values as part of the
  normal workflow.
- Responsive work is corrective and incremental rather than a redesign of the
  dashboard or its visual identity.
- Existing accessibility patterns, including semantic tables, labelled form
  controls, keyboard-accessible links and visible focus indicators, must be
  preserved or improved.

## Out of scope

- GitHub Pages deployment or changes to the deployment workflow.
- Live FPL requests from the browser.
- New dashboard statistics or changes to calculation rules.
- Authentication, accounts, payments, notifications, or multi-group support.
- Redesigning the dashboard information architecture.

