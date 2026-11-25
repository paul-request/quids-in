# Plan: Squad planner (Phase 19)

## 1. Data contracts

1. Add `libs/quids-in/utility/planner.interfaces.ts`: `PlannerData`
   (`season`, `generatedAt`, `gameweeks` upcoming, `teams`, `players`,
   `fixtures`, `squads` by participant), `PlayerProjectionInput`,
   `TeamStrength`, `ProjectedCell`, `PlannerRow`, `PlannerTable`.
2. Keep the file separate from the season snapshot; all fields optional-safe
   so a missing file shows an "unavailable" state.

## 2. Importer

1. Extend `scripts/import-season-data.mjs` (or a sibling
   `scripts/import-planner-data.mjs` with an npm script, preferred to keep the
   season importer small) to fetch `bootstrap-static` (players, teams,
   strengths, events), `/fixtures/?future=1`, and each participant's latest
   picks (`/entry/{id}/event/{gw}/picks/`).
2. Store per-player: position, team, price, status, chance of playing, minutes,
   xG/xA/xGC per 90, starts, plus per-team strengths and upcoming fixtures
   with FDR.
3. Reuse the season importer's retry and timeout fetch helper and write
   atomically. Malformed data fails the planner import; the workflow step is
   `continue-on-error`, so a planner failure deploys the committed (dated)
   planner file rather than blocking the site.
4. Wire into the deploy workflow's data step; tests with stubbed responses
   (blank/double GWs, missing picks, unavailable players).

## 3. Pure projection logic

`libs/quids-in/utility/planner.ts` with colocated tests:

1. `projectFixture(player, opponent, isHome)`: expected points per the model in
   the requirements.
2. `buildPlannerTable(data, participantId)`: rows for XI and bench, cell per
   Gameweek (sum for doubles, empty for blanks), row sums, XI total with
   captain doubled, best captain per Gameweek.
3. `suggestTransfers(table, data)`: top projected candidates by position (no budget constraint).
4. Tests: each position's points formula, availability scaling, home/away,
   double/blank GWs, captain doubling.

## 4. UI

1. `PlannerPage.svelte` + `PlannerTable.svelte`: sticky header and first
   column, horizontal scroll on mobile, FDR colour classes with text labels,
   semantic table markup.
2. Add route in `App.svelte`, "Planner" link on the player stats page, and
   Header action ("← Player" back link).
3. Loading/unavailable/unknown participant states; component tests.

## 5. Docs and roadmap

Add Phase 19 to `specs/roadmap.md`; note the data file and model in README.
FPL can publish zero attack/defence strengths; the importer then derives them
from the 1-5 overall strengths.
