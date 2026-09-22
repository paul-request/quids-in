# Mission

## What is quids-in?

quids-in is a small, just-for-fun companion app for a group of 12 friends who
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
    £38 season payment.
  - (Planned) Player-level total points, average weekly score, and best and
    worst recorded scores with their Gameweeks.

## Why this app exists

We already know the scores from the official FPL site — quids-in's job is
just to **record who won each week and keep the season leaderboard**, so we
don't have to keep a spreadsheet or argue about who's winning. It's purely
a scoreboard/record-keeper, not a fantasy football engine.

## Who it's for

A private group of 12 friends. Not a public product. No need for accounts,
sign-up, or general users beyond this group.

## What quids-in is NOT

- The **running app** is **not** a live FPL data puller — it never calls the
  FPL API, has no login/authentication with FPL, and only ever reads the
  static JSON already committed to the repo. A separate, offline import
  script (and a scheduled GitHub Actions job) may fetch a fresh snapshot
  from FPL's public endpoints, but that snapshot only reaches the app's
  data if a person reviews it and commits it — automation never updates
  the live app's data on its own.
- It is **not** a general-purpose fantasy football platform.
- It does not need to support arbitrary leagues, arbitrary numbers of
  players, or multiple concurrent groups. It is built for this one group
  of 12 friends.

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
4. **Manual data entry, on purpose.** Gameweek results reach the repo by
   hand (by one person) once a Gameweek is finalised on the official FPL
   site. An offline import script may pull a fresh snapshot from FPL's
   public API to prepare that JSON, but nothing commits or deploys
   automatically — a person always reviews and commits the update. The
   running app itself makes no live API calls and does no scraping.
5. **Source of truth lives in the repo.** Weekly scores/results are stored
   as a JSON file committed to the git repository. Updating the JSON and
   pushing/merging is how the season's data is updated.
