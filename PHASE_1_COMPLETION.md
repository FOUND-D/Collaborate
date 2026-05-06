# Phase 1 Completion

## Scope

This document records the Phase 1 implementation work completed in the active `Collaborate` codebase. It reflects the current state of the repository after the frontend and backend changes that were applied to support the academic Phase 1 feature set.

The application stack covered by this work:

- Frontend: React, Redux, Vite
- Backend: Express, Supabase
- Realtime: Socket.IO
- Live sessions: WebRTC

## Summary

Phase 1 was implemented across the active code paths rather than the legacy duplicate files. The work focused on:

- Extending user profiles with academic metadata
- Reframing teams as academic groups with type metadata
- Rebranding live meetings into sessions at the UI/API layer
- Adding academic task categories
- Using the existing role middleware where appropriate
- Updating the active sidebar and route structure for the new academic navigation

Several pieces already existed partially before this pass, especially around user academic fields, session agenda support, sidebar links, and placeholder Phase 1 routes. Those partial implementations were completed and aligned with the requested Phase 1 direction.

## Files Changed

### Backend

- `server/controllers/meetingController.js`
- `server/controllers/taskController.js`
- `server/controllers/teamController.js`
- `server/controllers/userController.js`
- `server/index.js`
- `server/lib/repo.js`
- `server/middleware/orgMiddleware.js`
- `server/routes/meetingRoutes.js`
- `server/routes/taskRoutes.js`
- `server/routes/teamRoutes.js`
- `server/migrations/20260506_phase1_academic_groups_and_tasks.sql`

### Frontend

- `client/src/App.jsx`
- `client/src/actions/teamActions.js`
- `client/src/actions/userActions.js`
- `client/src/components/Sidebar.jsx`
- `client/src/screens/MeetingScreen.jsx`
- `client/src/screens/ProfileScreen.jsx`
- `client/src/screens/RegisterScreen.jsx`
- `client/src/screens/TaskEditScreen.jsx`
- `client/src/screens/TaskScreen.jsx`
- `client/src/screens/TeamDetailsScreen.jsx`
- `client/src/screens/TeamScreen.jsx`

## Detailed Implementation

## Task 1: User Registration Extended With Academic Fields

### Backend

Academic user metadata support was completed in the active backend user flow.

Implemented in:

- `server/controllers/userController.js`
- `server/lib/repo.js`
- `server/migrations/20260506_phase1_academic_groups_and_tasks.sql`

What was implemented:

- Registration now accepts:
  - `role`
  - `department`
  - `yearOfStudy`
  - `studentId`
- New users are created with:
  - `credits: 50`
- Public user mapping now exposes:
  - `role`
  - `department`
  - `yearOfStudy`
  - `year_of_study`
  - `studentId`
  - `student_id`
  - `credits`
  - `avgRating`
  - `avg_rating`
  - `portfolioSlug`
  - `portfolio_slug`
- Profile updates now support:
  - `department`
  - `yearOfStudy`
  - `studentId`
  - `credits`
  - `avgRating`
  - `portfolioSlug`

Schema coverage added in migration:

- `users.role`
- `users.department`
- `users.year_of_study`
- `users.student_id`
- `users.credits`
- `users.avg_rating`
- `users.portfolio_slug`
- uniqueness constraints for:
  - `student_id`
  - `portfolio_slug`

### Frontend

Implemented in:

- `client/src/screens/RegisterScreen.jsx`
- `client/src/screens/ProfileScreen.jsx`
- `client/src/actions/userActions.js`

What was implemented:

- Register screen now includes:
  - department input
  - year of study selector
  - academic role selector
  - optional student ID field
- Profile screen now includes editable:
  - role
  - department
  - year of study
  - student ID
- Profile screen now displays current credit balance
- Redux registration action now sends the new academic fields to the backend

Notes:

- The active implementation uses numeric year values for the selected year options, including mapped values for postgraduate and faculty labels.

## Task 2: Teams Reframed as Academic Groups With Type

### Backend

Implemented in:

- `server/controllers/teamController.js`
- `server/routes/teamRoutes.js`
- `server/migrations/20260506_phase1_academic_groups_and_tasks.sql`

What was implemented:

- Team records now support:
  - `type`
  - `subject_code`
  - `created_by_role`
- Team creation accepts:
  - `type`
  - `subjectCode`
  - `subject_code`
- Team hydration now returns:
  - `type`
  - `subjectCode`
  - `subject_code`
  - `createdByRole`
- Realtime emission added on team creation via `req.io`

Role behavior:

- General student team creation remains allowed
- Course-group creation is restricted in the controller with:
  - `if (req.body.type === 'course' && req.user.role !== 'faculty')`

This was intentionally kept as the only legitimate inline role check because it depends on request body content.

### Frontend

Implemented in:

- `client/src/screens/TeamScreen.jsx`
- `client/src/screens/TeamDetailsScreen.jsx`
- `client/src/actions/teamActions.js`

What was implemented:

- Team creation UI now includes:
  - group type selector
  - optional subject code field
- Team list cards now show:
  - group type badge
  - subject code badge when available
- Team details header now shows:
  - group type badge
  - subject code badge when available
- Team creation Redux action now sends:
  - `type`
  - `subjectCode`

## Task 3: MeetingScreen Rebranded as Session Room

### Backend

Implemented in:

- `server/controllers/meetingController.js`
- `server/routes/meetingRoutes.js`
- `server/index.js`

What was implemented:

- Session agenda persistence is supported through:
  - `PATCH /api/meetings/:meetingId/agenda`
- Session summary generation is supported through:
  - `POST /api/meetings/:meetingId/summarise`
- Top-level aliases were mounted for:
  - `/api/meetings`
  - `/api/sessions`
- Existing nested routes remain active through:
  - `/api/teams/:teamId/sessions`
  - `/api/teams/:teamId/meetings`
- Summary generation uses Groq when `GROQ_API_KEY` is available
- If Groq is not configured, the endpoint returns a fallback summary message instead of failing hard
- Session events continue to emit through `req.io`

Important constraint preserved:

- WebRTC and Socket.IO session logic was not reworked structurally
- Only the agenda and summary workflow was extended around the existing live session behavior

### Frontend

Implemented in:

- `client/src/screens/MeetingScreen.jsx`

What was implemented:

- Meeting UI labels were shifted toward session-oriented terminology
- Pre-session agenda entry was completed
- Joining a live session now first saves the agenda through the agenda endpoint
- Ending a session now triggers summary generation
- After a session ends, the returned summary is displayed in a dedicated post-session view

Notes:

- The screen still uses the existing file/component name `MeetingScreen.jsx`
- The routing already supported `/team/:id/session`, and the UI behavior was aligned to that workflow

## Task 4: Task List Academic Categories

### Backend

Implemented in:

- `server/controllers/taskController.js`
- `server/routes/taskRoutes.js`
- `server/migrations/20260506_phase1_academic_groups_and_tasks.sql`

What was implemented:

- Task schema migration adds:
  - `category`
  - `assigned_by`
- Task create flow now accepts `category`
- Task update flow now accepts `category`
- Payload normalization was added so task requests can map:
  - `assignee` -> `assignee_id`
  - `project` / `projectId` -> `project_id`
  - `team` / `teamId` -> `team_id`
- Realtime task events were added via `req.io`
- Faculty-only bulk team assignment endpoint added:
  - `POST /api/tasks/assign-to-team`
- The bulk assignment flow creates one task per team member

### Frontend

Implemented in:

- `client/src/screens/TaskEditScreen.jsx`
- `client/src/screens/TaskScreen.jsx`

What was implemented:

- Task edit/create screen now includes category selection:
  - `assignment`
  - `exam_prep`
  - `research`
  - `study_goal`
  - `project_milestone`
  - `personal`
- Task list screen now includes a category filter bar
- Task list items now show category text when present

## Task 5: Role-Based Middleware Guard

### Backend

Implemented in:

- `server/middleware/orgMiddleware.js`

What was implemented:

- `requireRole` exists and is exported from `orgMiddleware.js`
- It supports either:
  - a single role string
  - an array of roles
- It returns:
  - `401 { message: 'Not authenticated' }` when no authenticated user exists
  - `403 { message: 'Forbidden' }` when the role does not match

Important clarification:

- The middleware signature remains:
  - `requireRole(allowedRoles = [])`
- It is used with array syntax such as:
  - `requireRole(['faculty'])`

### Current usage

- `POST /api/tasks/assign-to-team` is protected with `requireRole(['faculty'])`
- Team course-group creation uses a single inline controller check because route-only middleware cannot safely express a condition that depends on `req.body.type`

## Task 6: Sidebar Academic Navigation

### Frontend

Implemented in:

- `client/src/components/Sidebar.jsx`
- `client/src/App.jsx`

What was implemented:

- Sidebar navigation now includes:
  - `/exchange`
  - `/sessions`
  - `/resources`
  - `/leaderboard`
- Sidebar credit chip shows the user credit balance from:
  - `state.userLogin.userInfo.credits`
- Admin link is shown only when:
  - `userInfo.role === 'admin'`
- Placeholder Phase 2 routes were added for:
  - `/exchange`
  - `/sessions`
  - `/resources`
  - `/leaderboard`
  - `/admin`
  - `/portfolio/:slug`
- Non-admin users are redirected away from `/admin`

Compatibility note:

- `/exchange-board` still redirects to `/exchange`

## Items That Were Already Partially Implemented Before Completion

These were not fully complete when the work started, but partial groundwork already existed:

- Some academic user-field support in public user mapping and update logic
- Session agenda support in the session table and live session screen
- Some placeholder Phase 1 routes in `App.jsx`
- Some sidebar academic navigation links and a credits chip

These areas were completed and aligned with the requested Phase 1 behavior.

## Legacy Files Intentionally Not Touched

The following stale or duplicate files were intentionally left alone:

- `server/userRoutes.js`
- `server/teamRoutes.js`
- `client/src/screens/Sidebar.jsx`
- `client/src/components/LeftSidebar.jsx`
- `client/src/components/ChatPopup.jsx`

Work was applied only to the active code paths.

## Verification

### Server

Command run:

```bash
npm test
```

Result:

- The repository does not currently contain a real backend test suite
- The existing script is a placeholder and exits with:
  - `Error: no test specified`

Additional syntax validation performed:

- `node --check server/controllers/meetingController.js`
- `node --check server/controllers/taskController.js`
- `node --check server/controllers/teamController.js`
- `node --check server/lib/repo.js`
- `node --check server/index.js`
- `node --check server/routes/meetingRoutes.js`
- `node --check server/routes/taskRoutes.js`
- `node --check server/routes/teamRoutes.js`

All of the above syntax checks passed.

### Client

Commands run:

```bash
npm run lint
npm run build
```

Results:

- `npm run build` passed
- `npm run lint` completed with warnings only

Pre-existing warnings remaining:

- `client/src/App.jsx`
- `client/src/screens/OrganisationDetailScreen.jsx`

No new lint errors were introduced in the Phase 1 implementation work.

## Known Caveats

- No real backend automated tests are currently configured in the repo
- Session summary generation depends on `GROQ_API_KEY` for AI output
- When `GROQ_API_KEY` is missing, the summarise endpoint returns a fallback summary message
- Team access-control logic was later adjusted so students can use the general team routes while only faculty can create `course`-type groups

## Final State

Phase 1 is implemented in the active application paths with:

- academic user metadata
- academic team/group typing
- session agenda and summary flow
- task categories and team assignment support
- route-level role middleware where appropriate
- updated academic navigation and placeholder routes

This markdown is intended to serve as the Phase 1 implementation record for the current repository state.
