# Validation: Squad planner (Phase 16)

- `npm run validate` passes (lint, typecheck, tests, build).
- Projection unit tests cover every position, availability, home/away,
  double and blank Gameweeks, and captain doubling.
- Importer tests cover stubbed bootstrap/fixtures/picks and failure cases.
- Manual: open `#/players/<id>/planner` for a real participant; confirm 5
  Gameweek columns, FDR colours with text, XI total, best C, bench, transfer
  suggestions; check a 375px-wide viewport scrolls horizontally with the
  player column sticky.
- Missing planner data file shows the unavailable message, not a crash.
- Sanity check: projections for top players are in a plausible 3–9 range and
  sums reconcile with the XI total.
