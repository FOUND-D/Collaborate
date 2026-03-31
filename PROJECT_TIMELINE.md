# Project Timeline

This document tracks the frontend work completed on the repository and the remaining items that still matter.

## Timeline

### 2026-03-31

Completed today:
* Removed the duplicate Redux action files from `client/src/constants/`.
* Extracted `ProjectListItem` into its own component.
* Replaced the old table-based task layout with the modern task list UI.
* Removed legacy `react-router-bootstrap` usage from the frontend source.
* Standardized icon usage on `react-icons`.
* Restyled chat surfaces so the main chat, popup, sidebar, and message states match the app theme.
* Rewrote the User Guide as a step-by-step walkthrough and wired it into the sidebar.
* Normalized meeting payloads and socket events between client and server.
* Centralized shared workspace panel, button, and title styles.
* Reduced CSS duplication by introducing shared theme files.
* Kept auth screens dark by default and added a top-right theme toggle so users can switch manually.
* Refined the light theme into a calmer cream-and-green direction.
* Removed the remaining blue/purple accents from the landing and auth light-mode path.

## Current State

As of 2026-03-31:

* Auth screens now open in the existing dark theme, with a top-right toggle that can switch to light mode.
* The site-wide light theme is smoother and more professional, with white/cream and green as the main palette.
* Shared CSS is cleaner, but more consolidation is still possible across the remaining screens.
* The meeting screen is more stable, but the WebRTC logic still lives in one large file.
* A few non-blocking lint warnings still remain in the frontend.

## Still Open

* Extract `calculateProgress()` into a shared utility.
* Split `MeetingScreen.jsx` into smaller pieces.
* Reduce the remaining hook dependency warnings in `App.jsx` and `OrganisationDetailScreen.jsx`.
* Add explicit local development env examples so the frontend does not rely on production fallbacks.
* Continue centralizing repeated styles into shared theme and workspace primitives.

## Notes

* The canonical branch for the current work is `master`.
* The frontend work completed today has been pushed there in separate commits.
