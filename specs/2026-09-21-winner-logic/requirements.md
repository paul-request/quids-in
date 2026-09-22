# Requirements — Winner Logic (Phase 2)

## Source

This feature implements [Phase 2](../roadmap.md) of the quids-in roadmap:

> Extend the JSON schema so Gameweek results are an ordered array, then add
> tested logic for highest scores, joint winners, fractional wins, and an
> aggregated season leaderboard. No UI is required yet.

## Scope

In scope:

- A typed, array-based Gameweek data structure in
  `data/season-2025-26.json`.
- Stable numeric IDs for all 12 participants.
- Score maps keyed by participant ID.
- Pure TypeScript result functions for:
  - highest score in one Gameweek;
  - all winners, including ties;
  - fractional win shares;
  - lowest score in one Gameweek;
  - all last-place finishers, including ties;
  - aggregate season leaderboard totals and season-last-place detection.
- Explicit handling of missing scores, empty data, and invalid input.
- Vitest unit tests covering single winners, ties, fractional calculations,
  multi-Gameweek aggregation, and ordering.
- Shared interfaces are defined in a dedicated `results.interfaces.ts` module,
  while Gameweek and season calculations live in `results.ts`.

Out of scope:

- Dashboard, participant score display, winner highlighting, or any other new
  UI. Those belong to Phase 3.
- Real 2025-26 scores or official FPL cross-checking. Those belong to Phase 4.
- Live FPL API calls, scraping, authentication, a backend, or a database.
- Season balance tracking, which belongs to Phase 6.
- Historical-season imports, which belong to Phase 11.

## Decisions

- **Participant identity:** Every participant has a stable numeric `id` field,
  using values `1` through `12`. Gameweek score maps use those IDs as keys.
- **Participant display fields:** Existing `name` and `teamName` fields remain
  the source for display data.
- **Gameweek ordering:** `gameweeks` is an array appended to in chronological
  order. The last entry is the latest Gameweek; no separate current-Gameweek
  field is introduced.
- **Proposed Gameweek shape:**

  ```json
  {
    "gameweek": 1,
    "scores": {
      "1": 72,
      "2": 68
    }
  }
  ```

- **Missing scores:** A participant ID absent from a Gameweek's `scores` map
  is treated as scoring zero.
- **Winner ties:** Every participant with the highest score is a winner. A
  winner's share is `1 / numberOfWinners`.
- **Last-place ties:** Every participant with the lowest score is returned as a
  joint-last-place finisher. Last-place status is informational and does not
  create a negative, fractional, or otherwise additional win value.
- **Leaderboard ordering:** Total wins sort descending. Equal totals retain
  the stable participant order from the season data. The first row is the
  season leader; the final row or rows with the minimum total are the season
  bottom, including all participants tied on that minimum.
- **Derived data:** Winners, shares, and leaderboard totals are calculated at
  runtime by pure functions and are not duplicated in the JSON source file.
- **Empty season:** Aggregation returns a valid leaderboard with every known
  participant at zero wins when there are no recorded Gameweeks.
- **Invalid input:** Invalid participant IDs, malformed scores, duplicate
  participant IDs, empty Gameweek score sets, and non-finite scores must
  produce an explicit error rather than a silent fallback.
- **Zero-score Gameweeks:** Missing scores are zero, so a participant with a
  missing score can be a joint last-place finisher when zero is the minimum.

## Context

The app is a small, static, zero-cost scoreboard for one fixed group of 12
friends. The repository JSON is the source of truth and is updated manually
after a Gameweek is finalised on the official FPL site. The rules engine must
therefore be deterministic, easy to test, and independent of network access.

The implementation follows [mission.md](../mission.md) by recording results
without fetching them, and [tech-stack.md](../tech-stack.md) by using
TypeScript, static JSON imported at build time, Vitest for the rules that need
reliable automated coverage, and the documented library-first code
organisation.

This phase intentionally provides the calculation layer that the Phase 3
dashboard will consume; it does not build that dashboard itself.
