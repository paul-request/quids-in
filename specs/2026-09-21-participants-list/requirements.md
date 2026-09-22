# Requirements — Participants List (Phase 1)

## Scope

In scope:

- Build-time import of `data/season-2025-26.json`.
- Rendering the 12 participants from that file.
- Displaying each participant's `name` and `teamName`.
- Responsive participant cards in the feature shell.
- A reusable header component with the logo and `quids-in` app title.
- A compact 48px by 48px logo positioned at the top-left of the page.
- Component tests and type-safe validation.

Out of scope:

- Winner or last-place calculations; these are provided by the Phase 2
  utility layer for later dashboard work.
- Gameweek detail pages, season standings, or winner highlighting.
- Live FPL data, authentication, backend services, or deployment.

## Decisions

- The JSON file is the source of truth; participant names and team names must
  not be hardcoded in the component.
- Participant IDs are used as Svelte each-block keys.
- The JSON is imported at build time, consistent with the static, zero-cost
  architecture.
- The logo and app title are owned by the reusable header component rather than
  being repeated in the page content.
- The header brand is a keyboard-accessible home link.
