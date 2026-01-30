# Frontend Codebase Audit & Issues List

This document outlines the issues, potential bugs, and areas for improvement identified during the analysis of the frontend codebase (`client/src`).

## 1. 🚨 Critical Clean-up & Bug Fixes

### Duplicate Logic in Constants Folder
**Severity:** High
**Location:** `client/src/constants/`
**Issue:** The following files contain Redux action logic (functions with async/await, API calls) instead of just constant definitions. They duplicate files found in `client/src/actions/`.
- `client/src/constants/projectActions.js`
- `client/src/constants/taskActions.js`
- `client/src/constants/teamActions.js`
**Risk:** Importing from the wrong file can lead to confusing bugs. Having two sources of truth for actions is unmaintainable.
**Fix:** Delete these files from the `constants` folder and ensure all components import actions from `client/src/actions/`.

### OngoingProjectsScreen Reliability
**Severity:** Medium
**Location:** `client/src/screens/OngoingProjectsScreen.jsx`
*   **Component Structure:** The `ProjectListItem` component is defined inside the main screen file. This hurts readability and performance. **Fix:** Extract to `client/src/components/ProjectListItem.jsx`.
*   **Error Handling:** The user log reports a **500 Internal Server Error** when fetching `/api/users/profile`. While this is a backend error, the frontend must handle it casually (e.g., using a try-catch block or error boundary) so the entire page doesn't break or hang.

### Broken/Unused Imports
**Severity:** Low
**Location:** General
*   `client/src/constants/taskActions.js` (and potentially others) uses `axios` but might not import it correctly (in the duplicated files).
*   **Fix:** Once the duplicate files are removed, run a linter to catch any other unresolved imports in the main `actions/` folder.

## 2. 🎨 UI/UX Styling & Consistency

### Inconsistent Task Interfaces
**Severity:** Medium
**Locations:** `ProjectScreen.jsx` vs `TaskScreen.jsx`
*   `ProjectScreen.jsx`: Uses a "Modern List View" with custom CSS, pill badges, and `react-icons`.
*   `TaskScreen.jsx`: Uses a legacy table-based layout (`<table>`), `LinkContainer` from `react-router-bootstrap`, and FontAwesome icon classes (`<i className="fas ...">`).
*   **Fix:** Refactor `TaskScreen.jsx` to use the same `TaskItem` component and CSS classes (`modern-task-list`) used in the Project view for a unified experience.

### Icon System Mismatch
**Severity:** Low
**Issue:** The project mixes two different icon strategies:
1.  **React Icons** (`<FaPlus />`) - *Preferred (Modern, Modular)*
2.  **FontAwesome Classes** (`<i className="fas fa-plus"></i>`) - *Legacy*
**Fix:** Standardize on `react-icons` across the entire app for better performance (tree-shaking) and consistency.

### Fragmentation of CSS
**Severity:** Low
**Location:** `client/src/index.css`
**Issue:** Over 10 separate CSS files are imported. Basic styles (buttons, inputs) are redefined in multiple places.
**Fix:** Consolidate shared styles into `global.css` or a design system file. Ensure color variables (e.g., `--primary-color`) are used consistently instead of hex codes.

## 3. 🏗️ Code Quality & Refactoring

### DRY (Don't Repeat Yourself) Violations
**Severity:** Low
*   **Progress Calculation:** `calculateProgress` logic is duplicated in `ProjectScreen.jsx` and `OngoingProjectsScreen.jsx`. **Fix:** Move to `client/src/utils/projectUtils.js`.
*   **Status Badges:** Hardcoded logic for status colors exists in multiple files. **Fix:** Create a reusable `<StatusBadge status={...} />` component.

### Legacy Dependencies
**Severity:** Low
**Issue:** Usage of `react-router-bootstrap`.
**Fix:** Since `react-router-dom` v6 is in use, `LinkContainer` is largely obsolete. Use standard `<Link>` or `useNavigate` for navigation.

## 4. 📹 Meeting Screen Architecture

### Monolithic WebRTC Logic
**Severity:** Medium
**Location:** `client/src/screens/MeetingScreen.jsx`
**Issue:** detailed WebRTC negotiation, socket listeners, and UI rendering are all crammed into one file (~600 lines).
**Fix:** 
1.  Create a custom hook `useWebRTC` to handle the peer connections and socket events.
2.  Extract `VideoPlayer` to its own component file.

### Hardcoded Environment Configuration
**Severity:** Medium
**Location:** `MeetingScreen.jsx`
**Issue:** `http://localhost:3002` and STUN/TURN servers are hardcoded.
**Fix:** Move these to `.env` variables (e.g., `VITE_SOCKET_URL`).

## 5. Summary of Recommended Actions

1.  **[Immediate]** Delete action files from `client/src/constants/`.
2.  **[High Priority]** Extract `ProjectListItem` and fix error handling in `OngoingProjectsScreen`.
3.  **[Medium Priority]** Refactor `TaskScreen` to match the design of `ProjectScreen`.
4.  **[Low Priority]** Standardize Icons and verify all imports.
