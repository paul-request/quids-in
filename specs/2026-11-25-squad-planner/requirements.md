# Requirements: Squad planner (Phase 16)

## Source

A new per-participant page showing predicted points and fixture difficulty
for the next five Gameweeks, laid out as in the supplied screenshot (a
"Fpl Planner" table: one row per player, one column per Gameweek, each cell
showing opponent, venue and projected points, with a sum column).

## Context

- The site is a static Svelte app on GitHub Pages using hash routes
  (`#/`, `#/cups`, `#/players/:id`) handled in
  `libs/quids-in/feature-shell/App.svelte`.
- FPL data is imported at build time by `scripts/import-season-data.mjs`;
  the browser never calls FPL directly (direct browser integration is
  deferred).
- The importer already reads `bootstrap-static` and per-entry endpoints.
  Squad picks are currently fetched only for cup Gameweeks.

## Scope

In scope:

- Route `#/players/:id/planner`, linked from the player stats page.
- Table of the participant's current 15 (Starting XI, then Bench), columns
  for the next 5 unfinished Gameweeks plus a Sum column.
- Each cell: opponent short name, H/A, projected points, background colour
  by fixture difficulty (FDR 1–5, with accessible text, not colour alone).
- Footer rows: XI total (captain doubled), and best captain per Gameweek
  (the starting player with the highest projected points that Gameweek, with
  their projection; the XI total doubles this player, not the real FPL
  captain).
- Transfer suggestions: highest-projected players by position, based on the
  5-Gameweek sum. Budget and selling price are not considered.
- Importer outputs a separate `data/planner-<season>.json` so existing
  snapshots stay valid and the season file is untouched.

Projection model (derived, not fetched), per player per fixture:

- Inputs: xG, xA and xGC per 90, minutes share (expected minutes), availability
  (`chance_of_playing_*`, status), and the opponent's attack/defence
  strength with home/away split.
- Expected points = appearance points + position-weighted goal and assist
  points from xG/xA scaled by opponent defence strength + clean-sheet
  probability from team xGC and opponent attack strength + defender/GK
  goals-conceded penalty, all multiplied by availability. Bonus is estimated
  from a fixed per-position factor.
- Double Gameweeks sum fixtures; blank Gameweeks show an empty cell.

Out of scope: chip planning, live in-browser FPL calls, auth, editing the
real FPL team.

## Decisions

- Horizon: 5 Gameweeks (constant, easy to change).
- Projection logic lives in pure, tested utility code; the importer only
  supplies raw per-player and per-team inputs.
- Rounding: one decimal place for display; unrounded values are summed.

