# Roadmap

Small, shippable phases. Each phase should run locally and be useful on
its own before moving to the next. Deployment/hosting (GitHub Pages) is
deliberately deferred until the app is built and refined — see Phase 10.

## Current status

- Phase 0 scaffolding is complete.
- Phase 1 participant rendering is complete.
- Phase 2 winner, last-place, and results utilities are implemented and
  tested.
- Phase 3 dashboard is complete: the app shows the selected Gameweek,
  including winner and slug states, alongside fractional-win season
  standings and `The slugs`, a ranking of participants by weekly losses. A
  labelled selector switches between recorded Gameweeks. On desktop, the
  Gameweek card spans the full width above the two season-summary cards.
- Phase 4 active-season data import and verification is complete.
- Phase 5 average weekly position is complete.
- Phase 6 profit and loss is complete.
- Phase 7 Gameweek stats is complete.
- Phase 8 player stats is complete: each participant has a deep-linkable
  `/players/:id` view showing their recorded scores, average league
  position, best/worst Gameweeks, and reused season/current balance.
- Phase 9 responsive and weekly-update-workflow polish is complete,
  including the Phase 9 extension (header logo sizing, player team value,
  and mobile badge/heading abbreviations).
- Phase 10 (GitHub Pages deployment) is planned below and awaiting
  approval before implementation. Phase 11 (historical seasons import) is
  not yet started.

## Phase 0 — Project scaffolding

- Initialise a Svelte + Vite + TypeScript project in this repo.
- Add basic linting/formatting (keep it minimal — Prettier is enough to
  start).
- Add a placeholder `data/season-2025-26.json` with the 12 participants
  (name, FPL team name) and no Gameweek results yet.
- Make the placeholder page responsive so the logo and construction note
  work on phone, tablet, and desktop viewports.
- Run it locally via `npm run dev` — no deployment/hosting setup yet (see
  Phase 10 for GitHub Pages, once the app is ready to share).
- **Done when:** the placeholder page runs locally, shows the supplied
  logo responsively, and confirms the scaffolding is working.

## Phase 1 — Participants list

- Read the JSON file and render a simple list/table of the 12 participants
  (name, FPL team name).
- **Done when:** the locally running site shows all 12 friends' details
  from the JSON file.

## Phase 2 — Winner logic (core rules engine)

- Extend the JSON schema so each season's Gameweek results are stored as
  an **array, appended to in order** — the current/latest Gameweek is
  always the last entry in the array (no separate "current GW" field
  needed).
- Add the core logic (with unit tests via Vitest) to compute, for a given
  Gameweek:
  - The highest score.
  - The winner(s) — handling ties as joint winners.
  - Each winner's fractional win share (e.g. 0.5 each for a 2-way tie).
- Aggregate fractional wins across all recorded Gameweeks into an overall
  season leaderboard (person, total wins, sorted descending).
- No UI yet beyond simple console/test output — this phase is about
  getting the rules right before building the dashboard on top of them.
- **Done when:** unit tests cover single-winner, tied-winner, and
  multi-Gameweek aggregation cases, and pass against sample data.

## Phase 3 — Dashboard: current round + overall standings

- Build the main dashboard view (the landing page of the app) showing, at
  a glance:
  - The **current round** (the last entry in the Gameweeks array) — each
    participant's score for that GW, with the winner(s) highlighted.
  - The **overall season standings** — the leaderboard of total wins
    (including fractional wins) across all Gameweeks so far.
  - **The slugs** — participants with at least one weekly loss, ordered by
    the number of last-place finishes. Every participant tied for last place
    receives a loss for that Gameweek.
- Add a labelled selector to switch the dashboard between the latest and
  previous recorded Gameweeks, reusing the single-Gameweek rendering built
  in Phase 2's logic.
- Make every numeric dashboard-table heading, including the selected
  Gameweek's Score heading, a keyboard-accessible sort control. Repeated
  activation toggles ascending and descending order while preserving
  deterministic season participant order for equal values.
- On desktop, show the selected Gameweek card at full width with the overall
  standings and slug cards in two columns underneath. Stack all cards on
  narrower screens.
- **Done when:** after 2-3 Gameweeks' worth of sample data, the dashboard
  correctly shows the selected Gameweek, overall standings, and weekly-loss
  ranking, and selecting a past Gameweek shows that round's result correctly,
  including a joint-win example.

## Phase 4 — Load active-season data and verify

- Replace the sample/placeholder data with the current active season's real
  league participants and available Gameweek scores.
- Add one shared local import command that fetches the public FPL league data
  for league `869128`. It must fetch every standings page and each entry's
  history, then produce a static season-data snapshot suitable for local
  review.
- Store the per-Gameweek score (`points`), transfer deduction
  (`event_transfers_cost`), and used chip (when present) in the imported
  snapshot. Calculate the scoreboard score by subtracting the transfer
  deduction; do not recalculate it in the app.
- Add a GitHub Actions workflow that invokes the same import command every
  Tuesday and can also be started manually with workflow dispatch. It uploads
  a timestamped snapshot as an artifact only: it must not commit to `main`
  or deploy the app. Connecting an imported artifact to deployment remains
  Phase 10 work.
- Manually cross-check the computed winner(s) and leaderboard against the
  official FPL site, Gameweek by Gameweek, to confirm the logic holds up on
  real data (not just hand-crafted test cases) — including double-checking
  any real tie that occurred.
- Fix any data-shape or logic issues surfaced by real data before relying
  on future Gameweek imports.
- **Done when:** the locally running site shows the correct current-season
  winner(s) and leaderboard for the imported Gameweeks, verified against the
  official FPL site; the shared importer works locally, and its
  Tuesday/manual workflow produces a downloadable artifact.

## Phase 5 — Average weekly position

- Derive each participant's finishing position for every recorded Gameweek
  using competition ranking for ties (`1, 2, 2, 4`).
- Add an **Average weekly position** card that shows every participant's mean
  position across all recorded Gameweeks, ordered from lowest average to
  highest.
- Display averages with up to two decimal places and no unnecessary trailing
  zeroes.
- Keep the selected Gameweek card full width and replace the fixed
  season-summary columns with a responsive grid for overall standings,
  `The slugs`, and average weekly position.
- **Done when:** the average-position calculation is covered for ties,
  multiple Gameweeks, missing scores, equal averages, and empty seasons; the
  dashboard card is accessible and responsive; and `npm run validate` passes.

## Phase 6 — Profit and loss

- Treat every participant as having paid the fixed £38 season contribution.
- Calculate each recorded Gameweek's prize pot as £1 multiplied by the season
  participant count.
- Award the complete pot to a sole winner. Split joint-win pots in whole
  pennies and assign leftover pennies in season participant order.
- Add a **Profit & loss** card showing each participant's **Season balance**
  (gross prize winnings minus £38) and **Weekly balance** (gross prize
  winnings through the current Gameweek minus £1 for each completed
  Gameweek), ordered from highest to lowest season balance.
- Place the card after **Average weekly position** in the responsive
  season-summary grid.
- Keep the feature informational only; do not process payments or store
  financial account details.
- **Done when:** integer-penny calculations allocate every weekly pot exactly,
  all participants have correctly formatted season and weekly balances, tied
  splits and empty seasons are covered by tests, and `npm run validate` passes.

## Phase 7 — Gameweek stats

- Add a **Gameweek stats** card for the selected Gameweek, derived from the
  existing imported scoreboard scores rather than duplicated UI data.
- Show the selected Gameweek's highest score, lowest score, league average
  score, and spread (highest score minus lowest score).
- Calculate the season benchmark as the arithmetic mean of every recorded
  Gameweek's league-average score, including the selected Gameweek. Show the
  signed variance as selected Gameweek average minus that benchmark, with a
  `+` prefix above the benchmark, `−` below it, and `0` when equal.
- Exclude unavailable scores from aggregate metrics; do not treat them as
  zero. Show an explicit unavailable state if a Gameweek has no usable scores.
- Display score-derived values with up to two decimal places and no
  unnecessary trailing zeroes.
- Add the card without changing the selected Gameweek results, Gameweek
  selector, winner and slug indicators, fractional-win standings, chip
  labels, or imported scoreboard values.
- Keep the dashboard responsive and expose each statistic and comparison
  through accessible semantic content.
- **Done when:** unit tests cover tied high/low scores, multiple Gameweeks,
  decimal averages, missing and all-missing scores, positive/negative/zero
  variance, and inclusion of the selected Gameweek in the season benchmark;
  component tests cover labels, formatting, unavailable state, selector-driven
  updates, and accessible semantics; and `npm run validate` passes.

## Phase 8 — Player stats

- Add a player stats screen at `/#/players/:participantId`, using hash routing
  so shared and refreshed links work on static GitHub Pages hosting without a
  server-side fallback or routing dependency.
- Replace the separate dashboard player and team fields with one combined
  player/team field. Make that field a single link to the player's stats
  screen, preserving an accessible link name and keyboard use.
- Identify the selected player and team on the screen, with a clear route for
  an unknown participant ID.
- Provide a clearly labelled, keyboard-accessible link back to the dashboard
  from the player stats screen.
- Derive player statistics from the existing imported scoreboard scores:
  total points, average weekly score, highest score with its Gameweek or
  Gameweeks, lowest score with its Gameweek or Gameweeks, average league
  position, and total transfers made across all recorded Gameweeks.
- Show the player's season profit/loss and current profit/loss, reusing the
  existing season-balance calculation rather than duplicating prize, season
  contribution, or Gameweek contribution rules.
- Exclude unavailable player scores from all player-stat calculations rather
  than treating them as zero. Where a high or low score is tied, list every
  Gameweek in which it occurred. Calculate average league position using the
  existing competition-ranking rules, excluding Gameweeks where that player
  has no recorded score. Sum transfers only from Gameweeks where that player
  has a recorded score, and preserve zero as a valid total.
- Display score-derived values with up to two decimal places and no
  unnecessary trailing zeroes.
- Keep the feature static and build-time driven: do not add a backend, live
  FPL request, data import change, or derived values to season JSON files.
- **Done when:** utility tests cover totals, decimal averages, missing scores,
  total transfers including zero-transfer and missing-score cases, tied high
  and low values, average league position, season and current profit/loss, an
  empty season, and an unknown player; component tests cover links, route
  loading, all statistics, empty and unknown-player states, and back
  navigation to the dashboard; keyboard and responsive behaviour are
  verified; and `npm run validate` passes.

## Phase 9 — Polish & usability for weekly updates

- Make it easy for whoever updates the JSON each week: clear schema,
  maybe a short "how to update this" note in the repo README.
- Continue responsive polish for the fuller dashboard and weekly update
  workflow as those views are introduced.
- **Done when:** the app looks reasonable on a phone screen and the
  update-the-JSON workflow is documented.

### Phase 9 extension — Logo, team value, and mobile density

- Centre the header logo at every supported width and increase its size
  from 3rem to 4rem (48px to 64px), without adding a visible text title
  alongside it.
- Add a **Team value** figure to the Player stats page
  (`/#/players/:participantId`), shown directly below the participant's
  name and team, above the existing statistics list.
  - Team value is a single current figure combining the FPL squad value and
    bank balance (the participant's total FPL net worth, including any
    unspent/"spare" money) for their latest recorded Gameweek, e.g.
    `£103.2m`. It does not show any change/trend over the season.
  - Capture the FPL `value` (squad value) and `bank` (unspent money)
    figures per participant per Gameweek during season import; these are
    already present in the FPL history response the importer fetches
    but are not currently stored. This is a season-data schema addition,
    so existing local season snapshots will need re-importing.
  - Exclude Gameweeks with no recorded score for that participant, matching
    the existing pattern used for other player stats. Show an explicit
    unavailable state when the participant has no recorded score at all,
    consistent with the rest of the Player stats page.
  - Do not change how points, transfers, or balances are calculated —
    team value is an additional, independent figure.
- On mobile (reusing the existing 40rem/640px breakpoint):
  - Show only the winner/slug icon (🏆/🐌) in the selected Gameweek table:
    visually hide the "Winner"/"Slug" wording, but keep it available to
    screen readers so the accessible meaning is unchanged.
  - Abbreviate long sortable table column headings to reduce wasted space
    in the data cells, while keeping each heading's full wording as its
    accessible name, so screen reader and voice-control users are
    unaffected. Proposed abbreviations (to be confirmed during
    implementation):
    - "Average position" → "Avg. pos."
    - "Average score" → "Avg. score"
    - "Season balance" → "Season"
    - "Weekly balance" → "Weekly"
    - Leave already-short headings unchanged: `Player/team`, `Position`,
      `Wins`, `Losses`, `Score`, `Chip`.
- **Done when:** the header logo is visibly larger and centred at every
  supported width; the Player stats page shows an accurate current team
  value, sourced from the re-imported season snapshot without altering
  existing scoreboard or balance values; the winner/slug badges are
  icon-only on mobile while still announcing "Winner"/"Slug" to screen
  readers; the abbreviated mobile headings keep their full wording as the
  accessible name; and `npm run validate` passes.

## Phase 10 — GitHub Pages deployment

This project was built while working at Legal & General, using an L&G-linked
machine and GitHub identity. Before this repo becomes public, it moves to
the personal `paul-request` GitHub account, and anything L&G-related is
removed or replaced first.

### Audit findings (already reviewed, no further action needed)

- No L&G references exist in tracked file contents, `package.json`,
  `package-lock.json` (npm registry only), config files, or committed
  assets. The only textual hit is a checklist line in
  `specs/2026-09-18-project-scaffolding/validation.md` confirming the
  *absence* of L&G content — not a leak.
- The actual issue is **git history**: every commit across all local
  branches is authored as `paul.bennett@landg.com`. Squashing history (see
  below) removes this entirely, since no old commits are pushed.
- `data/season-2026-27.json` contains real participant names, FPL team
  names, and the FPL league ID. Confirmed acceptable to publish as-is —
  the group already knows this data and it's just for fun.

### Decisions

- **Hosting:** a new standalone public repo, `paul-request/quids-in`,
  deployed via GitHub Actions to the default project-page URL
  `https://paul-request.github.io/quids-in/`. No custom domain/DNS work.
  This is independent of the existing `paul-request.github.io` repo (which
  keeps serving `pmbennett.net` unaffected).
- **Git history:** squash all existing local history into a single fresh
  commit authored as `paul@pmbennett.net`, rather than rewriting the 57
  existing commits in place. The new repo starts clean with no
  L&G-authored commits at all.
- **Push access:** a dedicated SSH key/host alias
  (`github-paulrequest`) has been set up on this machine so this repo
  pushes as the `paul-request` GitHub account without touching any
  existing work-linked SSH configuration.
- **Working directory:** this same local working directory
  (`/Users/paulbennett/development/quids-in`) is reused — history is
  squashed in place, then pushed to the new `origin`, rather than
  starting a separate clone.

### Implementation steps

- Set local `user.email`/`user.name` for this repo to
  `paul@pmbennett.net` / `Paul Bennett` (personal identity, repo-local
  only — does not change global git config).
- Squash all existing commits into a single new initial commit on `main`,
  preserving the current working tree exactly as-is.
- Add `origin` pointing at
  `git@github-paulrequest:paul-request/quids-in.git` and push `main`.
- Set `base: '/quids-in/'` in `vite.config.ts` so built asset paths resolve
  correctly under the project-page subpath. The app's hash-based routing
  (`#/...`) means no `404.html` SPA-redirect workaround is needed.
- Add a new GitHub Actions workflow
  (`.github/workflows/deploy-pages.yml`) that builds the Vite app and
  deploys the `dist` output to GitHub Pages on push to `main`, using the
  standard `actions/upload-pages-artifact` /
  `actions/deploy-pages` actions. Leave the existing
  `import-season-data.yml` workflow untouched.
- Enable GitHub Pages on the new repo (Settings → Pages → Source: GitHub
  Actions).
- Confirm the deployed site at `https://paul-request.github.io/quids-in/`
  matches local behaviour (participants, Gameweek results, leaderboard,
  player stats all correct), including working deep links (e.g.
  `.../#/players/:id`) after a hard refresh.
- **Done when:** the repo is public under `paul-request` with no
  L&G-authored commits in its history; the app is live at
  `https://paul-request.github.io/quids-in/`; the group can view it
  without anyone running it locally; and `npm run validate` passes
  against the pushed state.

## Phase 11 — Historical seasons import (later phase)

- One-off (not live/automatic) import of previous seasons' data: for each
  past season, pull final scores/results into the same JSON structure
  (one JSON file per season, e.g. `data/season-2024-25.json`, matching the
  existing schema) so past winners and stats are preserved alongside the
  current season.
- This is a **manual/scripted, one-time backfill** per past season, done
  by running a small script locally and committing the resulting JSON —
  not a live or repeated fetch from any API at runtime. It doesn't
  contradict the "no backend / no live FPL API integration" principle,
  since nothing runs automatically or in the deployed app.
- Add a "past seasons"/history view that lets you pick a season and see
  that season's Gameweek winners and leaderboard.
- Add simple cross-season player stats (e.g. total wins across all
  seasons, best/worst Gameweek, appearances) once more than one season's
  data exists.
- **Done when:** at least one previous season's real data has been
  imported and is viewable in the app, and cross-season win totals are
  displayed correctly.

## Explicitly deferred / not planned

- Live/automatic FPL API integration or automatic score fetching while the
  app is running (Phase 11's historical import is a one-off manual backfill
  script, not a live fetch, so it doesn't count as this).
- Any authentication, accounts, or multi-group support.
- Any real payment/money movement (Phase 6 is display-only balance tracking).

These may be revisited later, but are out of scope for the roadmap above.
