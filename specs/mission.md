# Mission

## What is quids-in?

quids-in is a small, just-for-fun companion app for a group of 14 friends who
play Fantasy Premier League (FPL) together, but with our own weekly twist
on top of the normal FPL rules. The app uses a custom logo to give the
project a clear identity and make the weekly leaderboard feel branded and
recognisable.

## The rules we play by

- Everyone plays their own normal FPL team as usual.
- Each Gameweek (GW), whoever's FPL team scores the **highest points that
  GW** is the "winner" of that week.
- If two (or more) people tie for the highest score in a GW, they are
  **joint winners**:
  - Each joint winner is credited with a **fractional win** for that GW
    (e.g. 2-way tie = 0.5 win each, 3-way tie = 1/3 win each).
  - Any prize money for that GW is split as equally as possible in whole
    pennies between the joint winners.
- Over the course of a season, we track:
  - Who won each individual Gameweek (including joint wins).
  - A running season leaderboard of total wins (fractional wins included).
  - Weekly losses, where every participant tied for the lowest score in a
    Gameweek receives one loss.
  - Each participant's average finishing position across recorded Gameweeks.
  - Each participant's net season balance after prize winnings and the fixed
    season payment (£38 for the Gameweeks, rising to £40 with the two
    knockout cups).
  - (Planned) Two knockout cups, each with one Gameweek per round:
    - the **Quids In Cup**, which starts in GW16 and uses our own random draw;
    - the official **FPL League Cup**, which starts in GW35 and uses FPL's
      draw and results.

    Each tie is won by the higher net score (points minus transfer cost).
    Level scores are decided by FPL's cup rules: most goals scored, then
    fewest goals conceded, then a coin toss. Everyone pays £1 per cup, and
    the cup winner takes the pot. Pairings are shown blurred as a teaser
    until the preceding Gameweek has ended.

  - (Planned) Player-level total points, average weekly score, and best and
    worst recorded scores with their Gameweeks.

## Why this app exists

We already know the scores from the official FPL site — quids-in's job is
just to **record who won each week and keep the season leaderboard**, so we
don't have to keep a spreadsheet or argue about who's winning. It's purely
a scoreboard/record-keeper, not a fantasy football engine.

## Who it's for

A private group of 14 friends. Not a public product. No need for accounts,
sign-up, or general users beyond this group.

## What quids-in is NOT

- The **running app** is **not** a live FPL data puller — it never calls the
  FPL API from the browser, has no backend, and has no login/authentication
  with FPL. It only reads static JSON bundled at build time. Each
  deployment (on merge, daily, or manual) runs an import script that fetches
  a fresh snapshot from FPL's public endpoints, validates it, and bundles it
  into the static site. The snapshot committed to the repo is a development
  and test baseline, not the live data.
- It is **not** a general-purpose fantasy football platform.
- It does not need to support arbitrary leagues, arbitrary numbers of
  players, or multiple concurrent groups. It is built for this one group
  of 14 friends.

## Core principles

1. **Zero cost.** The app must not require any paid service, database, or
   backend. Everything must run on free tiers (or entirely free, static
   hosting).
2. **Lightweight.** Small group, small problem, small app. Avoid
   over-engineering — no need for scalability, multi-tenancy, or complex
   infrastructure.
3. **Responsive by default.** The web UI should work comfortably on phones,
   tablets, and desktop screens, because most viewing will happen casually
   on personal devices.
4. **Automated, validated data.** Gameweek results reach the site through a
   build-time import from FPL's public API that runs on every deployment and
   fails the deploy rather than publishing incomplete data. The running app
   makes no live API calls and does no scraping.
5. **FPL is the source of truth.** Scores come from FPL at build time; the
   app derives everything else. The committed JSON snapshot is a baseline for
   development, tests, and emergency deploys.