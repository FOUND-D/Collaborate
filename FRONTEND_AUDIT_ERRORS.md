# Frontend Codebase Audit & Issues List

This document outlines the issues, potential bugs, and areas for improvement identified during the analysis of the frontend codebase (`client/src`).

## Current Status

As of 2026-03-31:

* Removed or fixed in the current codebase:
  * Duplicate Redux action files under `client/src/constants/` are gone.
  * `ProjectListItem` has been extracted into `client/src/components/ProjectListItem.jsx`.
  * `TaskScreen.jsx` now uses the modern task list layout instead of the older table-based pattern.
  * The old `react-router-bootstrap` usage is no longer present in the frontend source.
  * The frontend now consistently uses `react-icons` instead of legacy FontAwesome class markup.
  * Chat styling has been aligned to the site theme across the main chat, popup chat, sidebar, and message alerts.
  * The sidebar now opens the User Guide, and the guide itself is a step-by-step app walkthrough rather than a feature list.
  * Meeting payloads and socket events are normalized between the client and server.
  * Shared workspace styles now cover the common panel, button, and title primitives used by the meeting and project screens.
* Partially addressed:
  * The `/api/users/profile` fetch is now wrapped by `getUserDetails()` error handling and server-status tracking, so the page should not hard-crash from that request alone.
  * `MeetingScreen.jsx` now uses the shared runtime config and the meeting flow is more stable, but the WebRTC logic still lives in one large screen file.
  * Frontend runtime defaults still point to the production backend unless env vars are supplied, so local stack setup is still not fully self-contained.
* Still persisting:
  * Two non-blocking hook dependency warnings remain in `App.jsx` and `OrganisationDetailScreen.jsx`.
  * CSS fragmentation has been reduced, but more shared tokens/components can still be centralized.
  * DRY violations such as repeated `calculateProgress()` logic.
  * A few remaining app lint issues, mostly unrelated hook dependency warnings.

## 1. 🚨 Critical Clean-up & Bug Fixes

### Duplicate Logic in Constants Folder
**Severity:** High
**Location:** `client/src/constants/`
**Status:** Removed.
**Issue:** The following files used to contain Redux action logic (functions with async/await, API calls) instead of just constant definitions. They duplicated files found in `client/src/actions/`.
- `client/src/constants/projectActions.js`
- `client/src/constants/taskActions.js`
- `client/src/constants/teamActions.js`
**Current state:** These files are no longer present in the repository, so the duplicate source-of-truth problem is fixed.

### OngoingProjectsScreen Reliability
**Severity:** Medium
**Location:** `client/src/screens/OngoingProjectsScreen.jsx`
**Status:** Partially addressed.
*   **Component Structure:** The `ProjectListItem` component used to live inside the screen file. This is now fixed by the extracted component in `client/src/components/ProjectListItem.jsx`.
*   **Error Handling:** The profile fetch path is now handled through `getUserDetails()` and the API interceptor layer, so the frontend does not rely on that request succeeding to keep rendering. The upstream `500 Internal Server Error` can still happen on `/api/users/profile`, so the backend-side failure itself is not gone.

### Broken/Unused Imports
**Severity:** Low
**Location:** General
**Status:** Still persisting in other files.
*   The duplicate action-file import issue is gone with the removed constants copies.
*   The frontend still has unrelated lint failures for unused variables/imports in several screen and component files, including the chat flow.

## 2. 🎨 UI/UX Styling & Consistency

### Inconsistent Task Interfaces
**Severity:** Medium
**Locations:** `ProjectScreen.jsx` vs `TaskScreen.jsx`
**Status:** Removed.
*   `ProjectScreen.jsx` uses a modern list view with custom CSS, pill badges, and `react-icons`.
*   `TaskScreen.jsx` now also uses `modern-task-list` and `task-list-item` styling rather than the older table-based layout.

### Icon System Mismatch
**Severity:** Low
**Status:** Removed from the frontend source.
**Issue:** The project used to mix two different icon strategies:
1.  **React Icons** (`<FaPlus />`) - *Preferred (Modern, Modular)*
2.  **FontAwesome Classes** (`<i className="fas fa-plus"></i>`) - *Legacy*
**Current state:** The source now uses `react-icons` consistently; no legacy FontAwesome class markup remains in `client/src`.

### Fragmentation of CSS
**Severity:** Low
**Location:** `client/src/index.css`
**Status:** Partially addressed.
**Issue:** Over 10 separate CSS files are still imported, but the repeated chat/guide palette values and the shared workspace panel/button/title styles have been moved into [`client/src/theme.css`](/Users/bhavya_agarwal/Desktop/Collaborate/client/src/theme.css) and [`client/src/styles/workspace.css`](/Users/bhavya_agarwal/Desktop/Collaborate/client/src/styles/workspace.css).
**Fix:** Continue centralizing shared component tokens and utility patterns into the shared theme files or a small design-system layer.

## 3. 🏗️ Code Quality & Refactoring

### DRY (Don't Repeat Yourself) Violations
**Severity:** Low
**Status:** Still persisting.
*   **Progress Calculation:** `calculateProgress` logic is duplicated in `ProjectScreen.jsx`, `OngoingProjectsScreen.jsx`, and `TeamDetailsScreen.jsx`. **Fix:** Move to `client/src/utils/projectUtils.js`.
*   **Status Badges:** Hardcoded logic for status colors exists in multiple files. **Fix:** Create a reusable `<StatusBadge status={...} />` component.

### Legacy Dependencies
**Severity:** Low
**Status:** Mostly removed, but the package still remains in `client/package.json`.
**Issue:** Usage of `react-router-bootstrap`.
**Current state:** No `LinkContainer` imports are present in `client/src`, but the dependency is still installed and could be removed if you want to trim the package graph.

## 4. 📹 Meeting Screen Architecture

### Monolithic WebRTC Logic
**Severity:** Medium
**Location:** `client/src/screens/MeetingScreen.jsx`
**Status:** Still persisting, but reduced.
**Issue:** detailed WebRTC negotiation, socket listeners, and UI rendering still live in one file, even though the implementation is now smaller and more stable than before.
**Fix:** 
1.  Create a custom hook `useWebRTC` to handle the peer connections and socket events.
2.  Extract `VideoPlayer` to its own component file.

### Hardcoded Environment Configuration
**Severity:** Medium
**Location:** `MeetingScreen.jsx` and `client/src/config/runtime.js`
**Status:** Partially addressed.
**Issue:** `MeetingScreen.jsx` now reads URLs from runtime config, but the frontend still falls back to production URLs when env vars are missing, which makes local stack setup less predictable.
**Fix:** Add a checked-in `.env.example` and make the local backend/socket targets explicit for development.

## 5. Summary of Recommended Actions

1.  **Removed**: delete action files from `client/src/constants/` is already done.
2.  **Removed**: `ProjectListItem` extraction and the TaskScreen list refactor are already done.
3.  **Done**: chat styling and the user guide walkthrough are updated.
4.  **Done**: shared theme tokens now reduce chat and guide CSS duplication.
5.  **Still open**: reduce the remaining non-blocking hook dependency warnings.
6.  **Still open**: extract meeting WebRTC logic and centralize shared utilities/styles.
