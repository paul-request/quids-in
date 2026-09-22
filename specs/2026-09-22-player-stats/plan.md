# Plan — Player stats (Phase 8)

## 1. Define typed player-stat results

1. Add a focused utility result interface for a known player's score and
   position statistics, including Gameweek arrays for tied highest and lowest
   scores.
2. Represent known players without usable scores and unknown participant IDs
   explicitly; do not return fabricated numeric values.
3. Reuse the existing season-balance result type for season and current
   profit/loss rather than creating a second financial calculation.
4. Keep raw player identities and scores in the existing participant and
   Gameweek models; do not add derived values to season JSON.

## 2. Implement pure Player stats calculations

1. Reuse existing participant, Gameweek, validation, competition-ranking, and
   season-balance rules.
2. Collect only usable recorded scores for the selected participant.
3. Derive total points, average weekly score, highest score and Gameweeks,
   lowest score and Gameweeks, and average league position from those usable
   scores.
4. List tied high and low Gameweeks in ascending order.
5. Exclude Gameweeks with a missing score for the selected player from score
   and average-position calculations.
6. Return a typed no-recorded-score result for a known player with no usable
   scores and an explicit not-found result for invalid or unknown IDs.
7. Keep the functions pure and avoid mutating participants, Gameweeks, score
   maps, or season-balance rows.

## 3. Add hash-route handling and the Player stats screen

1. Parse and react to `/#/players/:participantId` without adding a routing
   dependency.
2. Render the dashboard at `#/` and the Player stats screen on a valid player
   route, including direct load, refresh, and browser history navigation.
3. Add a focused Player stats component with the player and team identity,
   score statistics, average league position, season profit/loss, and current
   profit/loss.
4. Use semantic headings and definition-list or table content that associates
   every label with its value.
5. Format score values and positions with up to two decimal places and GBP
   profit/loss values with two decimal places and clear signs.
6. Render explicit no-recorded-score and unknown-player states, each with a
   clearly labelled dashboard link.
7. Preserve a logical heading hierarchy, labelled landmarks, focus visibility,
   and keyboard operation.

## 4. Combine dashboard player/team identity links

1. Create one reusable route-link helper or component that generates the
   canonical participant hash route from an ID.
2. Replace the separate `Player` and `Team` columns with one `Player/team`
   column in the selected-Gameweek scores, overall standings, `The slugs`,
   average weekly position, and profit/loss tables.
3. Render each combined player/team value as the row's sole Player stats link.
4. Preserve table semantics, winner/slug/chip labels, source order, and
   keyboard reading order.
5. Ensure every link has a meaningful accessible name based on its combined
   visible player/team text.

## 5. Test and validate

1. Add utility tests for totals, decimal averages, missing scores, tied
   highest and lowest scores, average league position, empty seasons, known
   players without scores, and invalid or unknown player IDs.
2. Assert season and current profit/loss exactly match the existing
   season-balance calculation for the same participant.
3. Add presentation tests for every statistic, score/GBP formatting, tied
   Gameweek labels, no-recorded-score and unknown-player states, and the
   dashboard return link.
4. Add routing tests for direct Player stats loading, hash changes, browser
   history, and the single combined player/team link from all five dashboard
   table surfaces.
5. Run `npm run validate`.
6. Manually verify direct hash navigation, refresh, back navigation,
   responsive layout, keyboard use, focus visibility, and no page-level
   horizontal overflow at supported phone, tablet, and desktop widths.
7. Verify the delivered changes satisfy every item in
   [validation.md](./validation.md) before merging.
