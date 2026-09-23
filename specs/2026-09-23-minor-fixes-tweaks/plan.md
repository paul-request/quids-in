# Plan: Minor fixes and tweaks

1. **Define the daily deployment path**
   - Schedule the workflow to run daily at midnight UTC.
   - Use the existing importer to write the fresh snapshot into the build
     workspace.
   - Define the Pages artifact and deployment permissions.

2. **Standardise Gameweek selector presentation**
   - Update the selector styling in `app.css` to remove browser-native
     arrow differences while preserving the existing select semantics.
   - Verify the arrow colour, spacing, focus ring, option readability, and
     responsive width at mobile and desktop breakpoints.
   - Keep the existing `App.svelte` label, binding, Gameweek ordering, and
     result updates unchanged unless a small integration adjustment is
     required by the styling approach.

3. **Implement direct import and deployment**
   - Run the existing import command from the daily midnight schedule and
     the manual dispatch path.
   - Build the app using the freshly generated snapshot.
   - Upload the build as a Pages artifact and deploy it in the same workflow.
   - Keep the checked-in season snapshot and `main` branch unchanged.
   - Surface import, validation, build, and deployment errors explicitly.

4. **Add regression coverage**
   - Extend workflow checks for the daily schedule, fresh-data build path, and
     import/deployment failures.
   - Add component or browser-facing coverage for selector rendering,
     accessible naming, keyboard focus, selected-value updates, and mobile
     layout constraints.
   - Keep existing dashboard and import behaviour covered.

5. **Validate the phase for merge**
   - Run the focused import tests and frontend tests.
   - Run lint, type-check, and the repository validation command.
   - Exercise scheduled-equivalent and manual workflow paths with mocked or
     fixture data.
   - Verify the direct Pages deployment receives the freshly imported data
     and that `main` remains untouched.
