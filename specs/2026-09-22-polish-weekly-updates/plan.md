# Plan: Weekly update workflow and responsive polish

1. **Document the weekly season-data workflow**
   - Review the importer, season interfaces, validation behaviour, and existing
     README guidance.
   - Add a concise step-by-step weekly update section to `README.md`.
   - Document the JSON shape, append-only Gameweek ordering, imported field
     meanings, review expectations, validation commands, and artifact-only
     scheduled workflow.

2. **Audit the dashboard at supported widths**
   - Inspect the current dashboard, player stats screen, tables, cards,
     selectors, links, and responsive CSS.
   - Exercise the app at phone, tablet, and desktop widths to identify
     overflow, cramped controls, unreadable table content, or focus/keyboard
     issues.
   - Keep a bounded list of issues tied to the existing Phase 9 scope; do not
     redesign unrelated product areas.

3. **Apply targeted responsive and usability refinements**
   - Update the relevant Svelte markup and CSS to resolve confirmed issues.
   - Preserve semantic structure, accessible names, keyboard interaction,
     visible focus, existing links/routes, and current calculated values.
   - Add or update component tests where markup or interaction behaviour
     changes.

4. **Verify the weekly update journey and regressions**
   - Add or update tests for the documented data/update assumptions where
     practical.
   - Run focused tests for affected components and utilities.
   - Run linting, type checking, the full test suite, and the production build.
   - Perform browser checks at phone, tablet, and desktop widths for the
     dashboard and `#/players/:participantId`, including keyboard navigation,
     table usability, sorting, Gameweek selection, and back navigation.

