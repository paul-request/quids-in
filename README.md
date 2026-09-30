# quids-in

quids-in is a small Svelte/Vite scoreboard for a private group of 14 friends
who play Fantasy Premier League together. Its dashboard shows the selected
Gameweek at full width, with overall standings and `The slugs` underneath on
desktop. `The slugs` ranks participants by last-place Gameweek finishes and
omits anyone with no weekly losses.

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Run the complete validation suite:

```bash
npm run validate
```

The validation suite runs ESLint, Svelte and TypeScript type checking, Vitest,
and a production Vite build.

Other useful commands:

```bash
npm run test   # Run unit tests
npm run lint   # Check lint rules
npm run typecheck # Check Svelte and TypeScript types
npm run format # Format source files with Prettier
npm run build  # Create the production bundle
```

## Code organisation

Application and domain code belongs under `libs/quids-in/`, following the
library-first convention documented in
[specs/tech-stack.md](./specs/tech-stack.md):

- `libs/quids-in/feature-shell/` contains Svelte application-shell code.
- `libs/quids-in/utility/` contains reusable domain logic, interfaces, and
  colocated unit tests.
- `src/main.ts` is only the Vite bootstrap entrypoint.

Season data is stored in `data/`, with one JSON file per season. The browser
never calls FPL and there is no backend: every deployment imports fresh FPL
data at build time and bundles it into the static site. The checked-in
snapshot is a development and test baseline (and an emergency fallback), not
what the live site normally serves.

## Import season data

Run the importer to fetch every FPL league standings page and every member's
Gameweek history:

```bash
npm run import:season-data
```

It validates the complete response before atomically replacing
`data/season-2026-27.json`. The importer uses the FPL standings entry ID as
the participant ID, subtracting transfer cost from FPL's recorded points to
produce the net score, and preserving transfers, transfer cost, and any
recorded chip. Review the generated file and the dashboard before committing
it.

The `deploy-pages.yml` GitHub Actions workflow runs the same command before
**every** deployment: on each merge to `main`, every day at midnight UTC, and
when started manually. It builds and deploys the site directly with the
freshly imported snapshot, so merging a pull request never rolls the live
site back to the checked-in data. It does not commit or modify `main`.

The import is retried up to 3 times (waiting 60s, then 120s) via
`scripts/retry.sh`, on top of the importer's own per-request retries. If
every attempt fails, the workflow fails before building, and the live site
keeps its last successful deployment rather than falling back to the
checked-in snapshot. Deployments share one `pages` concurrency group and are
never cancelled mid-run.

**Emergency option:** if FPL is down and a code fix must ship, start the
workflow manually with **Use committed snapshot** ticked. It skips the import,
deploys the checked-in snapshot, and adds a warning to the run. The site then
shows that snapshot's older "Data last refreshed" time until the next
successful import.

## Weekly data update workflow

No manual step is needed for the live site: the daily deployment picks up
each finished Gameweek. After a Gameweek ends, check the live site against the
official FPL results.

Refreshing the checked-in snapshot is optional and only keeps local
development and tests close to reality:

1. Run `npm run import:season-data` from the repository root.
2. Run `npm run validate` and inspect the dashboard with `npm run dev`.
3. Commit the refreshed snapshot if you want it as the new baseline.

Season snapshots are stored in `data/`, with one JSON file per season. Each
snapshot has this shape:

```json
{
  "season": "2026-27",
  "participants": [],
  "gameweeks": []
}
```

Append completed Gameweeks to the `gameweeks` array in ascending order; the
last entry is the current/latest recorded Gameweek. Each participant score
contains:

- `points`: the net scoreboard score after transfer deductions;
- `transferCost`: the transfer deduction in points;
- `transfers`: the number of transfers made in that Gameweek;
- `chip`: the optional chip used in that Gameweek;
- `squadValue`: the optional FPL squad value for that Gameweek, in tenths of
  a million pounds (e.g. `1015` is £101.5m);
- `bank`: the optional unspent FPL bank balance for that Gameweek, in the
  same tenths-of-a-million-pounds unit as `squadValue`.

`squadValue` and `bank` are omitted when the FPL history response does not
include them; missing values must not be treated as zero.

Each Gameweek may also include `fplAverage`, FPL's overall average score
across every team (`average_entry_score` from `bootstrap-static`). It is
recorded only once the Gameweek has ended, and the `Gameweek stats` card
shows it with the league's signed variance from it. FPL does not document
whether this average deducts transfer costs, so the comparison is
approximate.

### Knockout cups (Phase 12)

See [specs/2026-09-29-knockout-cups](./specs/2026-09-29-knockout-cups/requirements.md).
The cups are shown at `#/cups`, linked from the dashboard. The importer adds
these optional fields:

- `gameweeks[].ended`: `true` once FPL marks the Gameweek `finished` and
  `data_checked`;
- `goalsScored` and `goalsConceded` on scores in Quids In Cup Gameweeks
  (16–19), used for tie-breaks;
- top-level `fplCup`: the official FPL League Cup matches, present once FPL
  creates the cup. If FPL has created the cup but its matches cannot be
  fetched, the import fails rather than deploying without the cup.

The Quids In Cup draw lives in `data/cup-draw-2026-27.json`. It is generated
once with `npm run generate:cup-draw` and committed, and must never be
regenerated or hand-edited after it is committed (the script refuses to
overwrite an existing draw unless given `--force`).

The importer is the source of truth for these values. Do not hand-edit
derived scoreboard values as part of the normal weekly workflow. Every
deployment (merge, scheduled, or manual) uploads a timestamped artifact and
deploys the app using the freshly generated snapshot; it does not commit to
`main` or change the checked-in season data.
