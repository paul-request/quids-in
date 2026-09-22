# quids-in

quids-in is a small Svelte/Vite scoreboard for a private group of 12 friends
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

Season data is stored in `data/`, with one JSON file per season. The data is
imported locally and committed after review; the application does not fetch
live FPL data.

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

The scheduled GitHub Actions workflow runs the same command every Tuesday and
can be started manually. It uploads a timestamped artifact only; it does not
commit, deploy, or modify `main`.

## Weekly data update workflow

Use this workflow when a new Gameweek has finished:

1. Run `npm run import:season-data` from the repository root.
2. Review `data/season-2026-27.json` and confirm the participant list and
   appended Gameweek scores match the official FPL results.
3. Run `npm run validate`.
4. Inspect the dashboard locally with `npm run dev`, including the selected
   Gameweek, standings, summary cards, and player stats.
5. Commit the reviewed season snapshot and any intentional source changes.

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

The importer is the source of truth for these values. Do not hand-edit
derived scoreboard values as part of the normal weekly workflow. Review the
generated snapshot before committing it. The scheduled workflow and manual
workflow-dispatch run upload a timestamped artifact for review; they do not
commit to `main`, deploy the app, or change the checked-in season data.
