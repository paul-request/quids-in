# Plan — Knockout cups (Phase 12)

Delivery is split so the Quids In Cup is live before Gameweek 15 ends, and
the FPL League Cup import is completed and verified against real data
around Gameweek 34.

## 1. Define the cup data contracts

1. Add typed interfaces in `libs/quids-in/utility/` for:
   - `CupDraw` (committed input): `season`, `generatedAt`, and a list of
     cups, each with `id` (`quids-in-cup`), `name`, `startGameweek` (16),
     `revealAfterGameweek` (15), and `round1Fixtures`, which is an ordered
     list of 8 `{ fixture, participantIds: [id | null, id | null] }`, where
     `null` is a bye.
   - Season snapshot additions (importer output, all optional, so older
     snapshots still load):
     - `Gameweek.ended?: boolean`, which is FPL `finished && data_checked`.
     - `GameweekScore.goalsScored?: number` and
       `GameweekScore.goalsConceded?: number`, recorded only for Quids In Cup
       Gameweeks.
     - `Season.fplCup?: { cupLeagueId: number; matches: Array<FplCupMatch> }`,
       where `FplCupMatch` holds `gameweek`, both entry IDs (the second may be
       `null` for a bye), both points values, `winner`, `isBye`, and
       `knockoutName`.
   - Derived results (never stored): `CupBracket`, `CupRound`, `CupTie`
     (slots, scores, status `hidden | scheduled | provisional | decided |
walkover`, winner, and tie-break reason), and a cup-winner result.
2. Keep the draw in a **separate committed file**,
   `data/cup-draw-2026-27.json`, so the atomic season-snapshot rewrite in the
   importer can never overwrite it.

## 2. Generate and commit the Quids In Cup draw

1. Add `scripts/generate-cup-draw.mjs` and an `npm run generate:cup-draw`
   script:
   - Read participant IDs from `data/season-2026-27.json`.
   - Build 16 slots: 14 participants plus 2 byes. Shuffle with
     `crypto.randomInt` (Fisher–Yates) and reject any arrangement that puts
     two byes in the same fixture.
   - Validate the result: every participant appears exactly once, there are
     exactly 2 byes, and there are exactly 8 fixtures.
   - Write the file atomically, and refuse to overwrite an existing draw
     unless `--force` is passed.
2. Add unit tests for the draw script with an injected random source. Cover
   a valid shape, no bye-vs-bye fixture, every participant exactly once, and
   the overwrite guard.
3. Run the script once, review the output, and commit the draw with the
   phase's changes. This must happen before GW15 ends.

## 3. Extend the importer

1. Fetch `/bootstrap-static/` once and store `ended` on every imported
   Gameweek from `events[].finished && events[].data_checked`.
2. For Quids In Cup Gameweeks (16–19) that exist in the snapshot, fetch
   `/event/{gw}/live/` once per Gameweek and `/entry/{id}/event/{gw}/picks/`
   per participant:
   - Take picks in positions 1–11 (all 15 when Bench Boost is active), then
     apply each `automatic_subs` swap (`element_out` → `element_in`).
   - Sum `goals_scored` and `goals_conceded` across those counting players,
     with no multipliers.
   - Store the totals as `goalsScored` and `goalsConceded` on that
     participant's Gameweek score.
3. For the FPL League Cup, read `league.cup_league` from the classic league
   standings response the importer already fetches. Once it is set, page
   through `/leagues-h2h-matches/league/{cup_league}/?page=N`, de-duplicate
   by match ID, map the matches to `FplCupMatch`, and store them under
   `fplCup`. Omit `fplCup` while `cup_league` is still `null`.
   - _Implementation note:_ this replaces the planned per-entry
     `leagues.cup` read, because that only exposes FPL's overall cup. The
     endpoint and field names cannot be verified until FPL creates the cup,
     so the import is fail-soft: any error logs "Skipping FPL League Cup
     import" and omits `fplCup` rather than blocking the daily deploy.
   - _Superseded:_ after the deep review, a failed cup fetch now fails the
     import (and so the deploy) instead, because every deployment replaces
     the live data and a soft failure would silently drop the cup.
   - The FPL League Cup's reveal Gameweek is derived as its first Gameweek
     minus one.
4. Extend `validateSeasonData` for the new fields, and keep the existing
   retry, timeout, and atomic-write behaviour.
5. Only fetch picks and live data for cup Gameweeks. This keeps the daily run
   to a few extra requests outside those weeks.
6. Add importer tests using stubbed FPL responses. Cover ended flags,
   auto-sub swaps, goal and conceded totals, missing picks, an FPL cup that
   has not been created, FPL cup matches including byes, and de-duplication.

## 4. Implement pure cup logic

Add `libs/quids-in/utility/cups.ts` with colocated tests:

1. `buildQuidsInCupBracket(draw, season)`:
   - Build Round 1 from the draw, and QF, SF, and Final from fixed
     Winner-of links.
   - For each tie in a Gameweek that is present, attach both participants'
     net `points`.
   - Decide the tie only when the Gameweek has `ended`: higher net points,
     then more `goalsScored`, then fewer `goalsConceded`, then a deterministic
     coin toss (a stable string hash of season, cup, round, and sorted IDs).
     Record the deciding reason.
   - A bye is a walkover. A missing score loses, and if both scores are
     missing the coin toss decides.
2. `buildFplCupBracket(season)`: map imported FPL matches into the same
   bracket model. Use FPL's `winner` as authoritative. Derive Winner-of
   placeholders for rounds not yet published, and prefer FPL fixtures when
   they exist.
3. `applyCupReveal(bracket, season)`: if `revealAfterGameweek` has not
   `ended`, return the bracket with Round 1 participants and byes marked
   `obfuscated: true`, no scores, and Winner-of placeholders for later
   rounds. Otherwise, clear the flag, reveal Round 1, and fill in only the
   later-round slots whose feeding tie is decided. The utility decides
   whether a slot is obfuscated. The component only applies the styling.
4. `getCupWinner(bracket)`: return the winner once the final is decided.
5. Keep the functions pure and unit tested. Cover byes, every tie-break
   level, missing scores, provisional (in-progress) rounds, the reveal
   boundary on both sides, full advancement to the champion, and a snapshot
   with no cup data at all.

## 5. Update the money rules

_Implementation note:_ a season only has cups when the committed draw file
belongs to it. Historical seasons (such as the 2025-26 snapshot) therefore
keep the £38 contribution.

1. Change the fixed season contribution in the shared season-balance
   calculation from 3800 to 4000 pennies. Derive it from 38 Gameweeks plus
   the number of configured cups, rather than hard-coding a new literal.
2. Deduct £1 per cup from the current (weekly) balance once the cup's first
   Gameweek is recorded.
3. Credit the whole cup pot (£1 × participant count) to the cup winner once
   the final is decided.
4. Update the season-balance tests: before the cup, during the cup (deducted
   but no pot yet), after the final, both cups, and exact penny totals across
   all participants.
5. Confirm the Profit & loss card and the Player stats profit/loss values
   update through the shared calculation, with no duplicated rules.

## 6. Build the Cups page and navigation

1. Add a `#/cups` route to the existing hash-route handling in `App.svelte`.
2. Add a clearly labelled "🏆 Cups" button-style link to `#/cups` in the
   dashboard header, beside the centred logo. Render the same header on the
   Cups page and Player stats, with the button slot showing a "← Dashboard"
   link to `#/` instead. Both need visible focus.
3. Add `CupsPage.svelte` and a `CupBracket.svelte` component:
   - Show one section per cup with its name, schedule, and status message:
     revealed when GW N ends, draw not yet made, in progress, or the
     champion.
   - Label each round with its Gameweek number. Each tie shows two slots:
     a Player/team link, "Bye", "Winner of Fixture N", or an obfuscated
     slot.
   - Render obfuscated slots as the real name/team text or "Bye" in plain
     text (not a link). Style it with a shared class that applies a CSS
     `filter: blur(...)` and `user-select: none`, with no hover, focus, or
     transition that removes the blur. Mark it `aria-hidden="true"` next to
     a visually hidden "Hidden until Gameweek N ends" alternative. Keep the
     slot size stable, so the layout doesn't shift on reveal.
   - Show scores and the tie-break reason when a tie was decided on a
     tie-break. Mark winners with text and an icon.
   - Use semantic headings and lists so the route to the final can be read
     in order by screen readers.
   - Stack rounds on mobile, and use a horizontal bracket at wider breakpoints
     without page-level overflow.
4. Add component and routing tests covering:
   - the obfuscated state: blur class present, no links, `aria-hidden`, a
     text alternative, and no scores;
   - the revealed Round 1, with the blur class removed and links present;
   - provisional scores, and decided ties with each tie-break reason;
   - byes, Winner-of placeholders, and the champion;
   - the FPL cup's not-yet-created state;
   - the dashboard → Cups link, the Cups → dashboard link, and direct
     `#/cups` loading.

   Check the blur visually by hand, because jsdom does not render CSS
   filters.

## 7. Update documentation

1. Update `README.md` with the season snapshot fields (`ended`,
   `goalsScored`, `goalsConceded`, `fplCup`), the committed cup-draw file,
   and the draw script.
2. Update `specs/mission.md`, `specs/tech-stack.md`, and `specs/roadmap.md`
   if implementation details change from this plan.

## 8. Validate and verify with real data

1. Run `npm run validate`.
2. Run `npm run import:season-data` locally, then check the Cups page in its
   blurred teaser state and in a simulated revealed state (using fixture
   data). Confirm the names can't be read at phone, tablet, and desktop
   widths, or in light and dark colour schemes.
3. After GW15 ends, confirm the daily deploy reveals Round 1 correctly.
4. After each of GW16–19 ends, cross-check winners against FPL scores, and
   check the tie-break inputs when there is a tie.
5. Around GW34/35, confirm FPL's cup league has been created. Verify the
   imported matches, byes, and later-round pairings against the FPL website,
   and adjust the pairing assumption if FPL differs.
6. Tick every item in [validation.md](./validation.md) before merging each
   delivery.

## Delivery slices

| Slice | Contents                                              | Must be live by  |
| ----- | ----------------------------------------------------- | ---------------- |
| A     | Steps 1–2, 3.1–3.2, 4 (Quids In Cup), 5, 6, 7         | Before GW15 ends |
| B     | Steps 3.3 and 4.2 (FPL League Cup import and bracket) | Before GW34 ends |
| C     | Step 8.5 real-data verification and any adjustments   | During GW35–38   |

Slice B can be built ahead of time against stubbed data, but it can only be
fully verified once FPL creates the cup league.
