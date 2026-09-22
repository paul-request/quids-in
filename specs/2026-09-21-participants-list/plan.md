# Plan — Participants List (Phase 1)

## 1. Load the season data

1. Import `data/season-2025-26.json` at build time.
2. Use the stable participant `id`, `name`, and `teamName` fields from the
   imported data rather than duplicating display values in the component.

## 2. Render the participant cards

1. Render all participants from the JSON file in the feature-shell component.
2. Show each participant's name and FPL team name.
3. Use a responsive card grid that remains readable on phone, tablet, and
   desktop widths.
4. Keep Gameweek calculations and dashboard views out of this phase.

## 3. Add the app header

1. Create a reusable feature-shell header component containing the quids-in
   logo and app title.
2. Position the header at the top-left of the page.
3. Render the logo at a standard compact app-header size of `3rem` by `3rem`
   (48px by 48px), preserving its aspect ratio.
4. Make the brand link keyboard accessible and identify it as the home link.

## 4. Verify the phase

1. Add component tests proving the header brand and all 12 participants render.
2. Run lint, type checking, unit tests, and the production build.
3. Manually check the header and participant layout at phone, tablet, and
   desktop widths.
