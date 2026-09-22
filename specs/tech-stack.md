# Tech Stack

## Guiding constraint: £0 cost, no backend

Everything below is chosen so that quids-in costs nothing to run and needs
no server we have to maintain, pay for, or keep alive.

## Repo visibility

- The GitHub repo is **public**, on a personal (non-work) GitHub account.
  This is required because GitHub Pages is only free for public
  repositories — private repos need a paid GitHub plan to use Pages.
- This project is being built from scratch on personal time with public
  npm dependencies only (Svelte, Vite, etc.) — no work-related code,
  credentials, or references should ever be committed here. `npm install`
  resolves these public packages from the public npm registry
  (`registry.npmjs.org`), so `package-lock.json` only ever records public
  package names/versions/URLs and is safe to commit (see "Dependency
  locking" below).
- The GitHub repository is public, but `package.json` remains
  `"private": true` because this project is not intended to be published as
  an npm package.

## Frontend

- **Framework:** [Svelte](https://svelte.dev) with [Vite](https://vitejs.dev)
  as the build tool (`vite` + `@sveltejs/vite-plugin-svelte`, not SvelteKit —
  we don't need SSR or a routing dependency for this small static site).
- **Language:** TypeScript for type safety around the data shapes (people,
  gameweeks, results).
- **Styling:** Plain CSS (or a single small CSS file). No CSS framework
  needed for 12 friends and a handful of views. Layouts should follow
  responsive design from the start, with mobile-friendly spacing,
  fluid sizing, and simple breakpoints where a view needs them.
- **State/data:** No state management library needed. The season data is a
  static JSON file imported at build time; Svelte's reactivity is enough.
- **Table interaction:** Numeric dashboard-table headings use local Svelte
  state to toggle ascending and descending order; sorting remains client-side
  and derives from the existing build-time season snapshot.
- **Routing:** Player stats uses hash routes in the form
  `/#/players/:participantId`. Hash routing keeps direct and refreshed links
  compatible with GitHub Pages without server-side fallback configuration.
- **Dependency locking:** `package-lock.json` is committed to the repo (not
  gitignored) so `npm install` is reproducible across machines and in the
  GitHub Actions deploy workflow. See "Repo visibility" above for why this
  is safe to do publicly.

## Data storage

- **No database. No backend.**
- Each season's data lives in its own **JSON file committed to the repo**
  (e.g. `data/season-2025-26.json`), containing:
  - The list of 12 participants (name, FPL team name).
  - Per-Gameweek raw results (each person's score). Winners, shares, and
    leaderboard totals are derived at runtime and are not stored in JSON.
  - Average-position, season-balance, Gameweek-stat, and player-stat values
    are derived at runtime and are not stored in JSON.
- Updating a Gameweek's results = editing the JSON file and committing it
  (directly or via a small PR). This is a manual, deliberate step taken
  once a Gameweek is finalised on the official FPL site.
- **Phase 4 import tooling:** A shared local command will fetch the public
  FPL league data for league `869128` and produce a static snapshot. It will
  retain Gameweek points, transfer deduction, and chip-use fields for review.
  The importer subtracts the authoritative transfer cost from recorded points
  to calculate the scoreboard score. The browser does not recalculate
  deductions.
- **Scheduled import artifact:** GitHub Actions will run the same command
  every Tuesday and on manual dispatch, uploading a timestamped JSON artifact
  only. It does not commit generated data to `main` and does not deploy the
  app. Deployment integration is deferred to Phase 10.
- Each season JSON file is loaded at build time (bundled into the static site),
  so there's no runtime fetch, no CORS concerns, and no server to query.

## Hosting / deployment

- **For now: local only.** While the app is being built and refined, it
  just runs locally via `npm run dev` (Vite dev server). No hosting or
  deployment setup yet — see [roadmap.md](./roadmap.md) for when this is
  picked up.
- **Planned for later:** [GitHub Pages](https://pages.github.com), served
  from the `quids-in` GitHub repo as a **project site**, deployed at the
  default `https://<username>.github.io/quids-in/` URL, via a GitHub
  Actions workflow building the Vite app and deploying the static output
  on push to `main`.
- **Note on the existing personal GitHub Pages site:** a separate repo
  already serves a personal user site (with a custom domain pointed at
  `https://<username>.github.io`). GitHub Pages is configured per
  repository, so this is unaffected — `quids-in` is deployed as an
  independent project site under the same account, at its own
  `/quids-in/` subpath. No custom domain is used for quids-in; it stays on
  the free default project-site URL, keeping things simple (a subdomain
  such as `quids-in.yourdomain.com` could be added later if ever wanted,
  but isn't planned).
- **Optional future upgrade — a brand-new custom domain:** if a separate
  domain (not the one already used for the personal site) is bought later
  purely for quids-in, it could point at this project site instead of the
  default URL — either as an apex domain (`A`/`ALIAS` records to GitHub's
  IPs) or a subdomain (`CNAME` record to `<username>.github.io`), with the
  domain then added in the `quids-in` repo's Pages settings. GitHub Pages
  hosting and HTTPS remain free either way; the only cost would be the
  domain registration itself (roughly £8-12/year). This is purely a
  nice-to-have for later, not part of the current plan.
- Because the app is served from a subpath (`/quids-in/`) rather than the
  domain root, Vite's `base` config option will need to be set to
  `/quids-in/` when this phase is implemented, so built asset paths
  resolve correctly.
- This choice is deferred, not abandoned — GitHub Pages remains the plan
  once the app is ready to be shared with the group.

## Testing

- **Vitest** for unit tests (pairs naturally with Vite), used for the
  "derive winners/fractional wins/leaderboard from JSON" logic — this is
  the one part of the app with real rules worth testing (tie handling,
  fractional wins, leaderboard totals).
- **Local validation:** `npm run validate` is the standard pre-commit
  validation command. It runs ESLint, then the Vitest unit test suite, then
  the Vite production build. Vitest currently allows an empty test suite so
  Phase 0 and Phase 1 can validate before the Phase 2 rules-engine tests are
  introduced; once tests exist, failing tests must fail validation.
- No E2E testing framework for MVP — the app is small and low-risk enough
  that manual checks after each deploy are sufficient. Can reconsider if
  the app grows.

## Explicitly out of scope (tech-wise)

- No FPL API integration (even though it's free/public, we've chosen
  browser-side live FPL integration. Phase 4's local and GitHub Actions
  importer is a build-time/static-data tool, not a runtime app dependency.
- No authentication/login system.
- No database (SQL or NoSQL), no serverless functions, no third-party
  backend-as-a-service.
- No payment processing (season balance tracking, when added, is purely
  informational and does not move real money through the app).

## Code organisation

Application and domain code lives in `libs/`, following the Nx library-first
convention even though this project currently uses Vite directly rather than
the Nx CLI:

- `libs/quids-in/feature-shell/` contains the Svelte app shell and its
  presentation tests.
- `libs/quids-in/utility/` contains framework-independent domain utilities,
  typed data contracts, and their unit tests.
- `src/main.ts` is only the Vite bootstrap entrypoint; new application or
  domain logic should not be added there.

Future feature work should add code under the most specific library and
subfolder that matches its responsibility. Keep presentational components in
feature or UI libraries, calculation/data-access code in utility or
data-access libraries, and tests beside the code they cover.

## Repo layout (indicative)

```
quids-in/
  specs/              # this constitution (mission, tech-stack, roadmap)
  data/               # season JSON file(s), one per season
  libs/quids-in/
    feature-shell/    # Svelte app shell and feature entry components
    utility/          # reusable domain logic and data contracts
  src/main.ts         # Vite bootstrap only
  .github/workflows/  # (later) GitHub Actions build & deploy to GitHub Pages
```
