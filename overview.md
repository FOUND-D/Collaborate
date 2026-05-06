# Collaborate Overview

This file is the single-pass map of the repository.
It explains what each file does, how the frontend and backend connect, and which files are active, duplicated, or historical.

## Important Reality Check

- The active backend uses Supabase/Postgres through `server/lib/supabase.js` and `server/lib/repo.js`.
- Several top-level docs still describe the project as MongoDB/Mongoose-based. Treat those docs as historical or aspirational, not as the current runtime truth.
- `server/routes/*.js` are the active Express route files. The root-level `server/*.js` route files are legacy duplicates.
- The mobile app is only a starter shell right now. `mobile/lib/main.dart` is not a finished integration with the backend.
- The root `index.html` is a standalone static landing prototype. The active Vite app entrypoint is `client/index.html`.

## How The App Connects

```text
React screen -> Redux action -> api.js -> Express route -> auth/org middleware -> controller -> Supabase -> response -> reducer -> screen

Meeting/chat screen -> socket.io-client -> server/index.js -> in-memory room state / signaling -> other clients
```

The main pattern is:

- UI reads state from Redux.
- User interaction dispatches an action.
- The action calls the REST API through `client/src/utils/api.js`.
- The server authenticates with `server/middleware/authMiddleware.js`.
- The controller reads or writes Supabase rows through `server/lib/repo.js`.
- The response is stored back into Redux and rendered.

Realtime features use Socket.IO separately:

- Meetings use room membership plus WebRTC signaling.
- Chat uses message persistence plus polling and socket events.
- Server-side socket state is in memory, so it resets on restart.

## Root Docs And Entry Files

- `README.md` is the broad repo description, but parts of it are stale compared with the current Supabase/Postgres implementation.
- `PROJECT_DESCRIPTION_FOR_AI.md` is a long portfolio/resume style description of the product.
- `PROJECT_TIMELINE.md` is a dated change log for frontend work.
- `RECAP_2026_01_28.md` is a historical recap of a design pass.
- `Preoject_reading.md` is a brainstorming / planning note, not runtime code.
- `GEMINI.md` is a working note describing a task-focused UI change.
- `index.html` is a standalone static landing page prototype, separate from the Vite app.
- `client/index.html` is the real Vite HTML shell that mounts `client/src/main.jsx`.
- `client/README.md` is the default Vite template README and is mostly boilerplate.
- `client/GEMINI.md` is a debugging note about a profile request and project visibility.
- `server/GEMINI.md` is a debugging note focused on meeting and socket behavior.
- `server/package.json` defines the backend start script and runtime dependencies.
- `client/package.json` defines the frontend scripts and dependencies.
- `client/vite.config.js` configures the React plugin and dev-server proxies for `/api` and `/socket.io`.
- `client/vercel.json` defines the Vercel rewrite and legacy redirect rules.
- `client/eslint.config.js` defines the flat ESLint configuration for the frontend.

## Server

### Entry Point And Shared Infrastructure

- `server/index.js` creates the Express app, the HTTP server, and the Socket.IO server.
- `server/index.js` mounts all API routers, attaches `req.io`, installs logging, and starts the server after the Supabase readiness check.
- `server/config/db.js` is not a database pool. It is a Supabase connection check that touches the `users` table and logs readiness.
- `server/lib/supabase.js` creates the Supabase client from `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- `server/lib/repo.js` is the server-side data adapter layer. It maps raw Supabase rows into the public `_id`-based shape used by the frontend and provides helper CRUD functions.
- `server/utils/generateToken.js` signs JWTs for 30 days.

### Middleware

- `server/middleware/authMiddleware.js` reads `Authorization: Bearer <token>`, verifies the JWT, loads the user from Supabase, and attaches `req.user`.
- `server/middleware/asyncHandler.js` wraps async route handlers so thrown errors reach Express error middleware.
- `server/middleware/errorMiddleware.js` provides the 404 handler and the JSON error response handler.
- `server/middleware/orgMiddleware.js` is the organisation policy layer. It checks membership, permissions, and compliance rules.

`server/middleware/orgMiddleware.js` matters because it gates the deep organisation admin routes:

- `requireOrgMember` blocks users who are not in the organisation.
- `requireOrgPermission(flag)` blocks users who do not have the named permission.
- `requireOrgCompliance` and `enforceOrgCompliance` check profile completeness against org rules.

### Controllers

- `server/controllers/userController.js` handles register, login, user search, profile retrieval, profile updates, and profile image updates.
- `server/controllers/teamController.js` handles team creation, listing, membership management, join requests, deletion, and hydrated team detail responses.
- `server/controllers/taskController.js` handles task CRUD and task dependency inserts.
- `server/controllers/projectController.js` handles project CRUD, access checks, project deletion cleanup, and AI-assisted project generation.
- `server/controllers/messageController.js` handles team chat, direct conversations, and read receipts.
- `server/controllers/meetingController.js` handles starting, fetching, and ending meetings.
- `server/controllers/organisationController.js` handles the simpler organisation flow: create org, list my orgs, get org, update org, delete org, invite member, accept invite placeholder, remove member, update member role, list org members, and list org teams.
- `server/controllers/orgController.js` handles the deeper organisation admin flow: member provisioning, temp-password reset, role creation and editing, compliance rules, custom fields, and audit logs.

The split between `organisationController.js` and `orgController.js` is deliberate:

- `organisationController.js` serves `/api/organisations`.
- `orgController.js` serves `/api/orgs`.

### Routes

- `server/routes/userRoutes.js` is the active `/api/users` router.
- `server/routes/teamRoutes.js` is the active `/api/teams` router.
- `server/routes/taskRoutes.js` is the active `/api/tasks` router.
- `server/routes/projectRoutes.js` is the active `/api/projects` router.
- `server/routes/messageRoutes.js` is the active `/api/messages` router.
- `server/routes/meetingRoutes.js` is the nested meetings router used under teams.
- `server/routes/organisationRoutes.js` is the simpler organisation router used for org CRUD, invites, member listing, and team listing.
- `server/routes/orgRoutes.js` is the advanced org administration router for provisioning, permissions, roles, compliance, custom fields, and audit log.

The route prefixes are:

- `/api/users`
- `/api/teams`
- `/api/tasks`
- `/api/projects`
- `/api/messages`
- `/api/organisations`
- `/api/orgs`

### Legacy Duplicate Route Files

- `server/userRoutes.js` duplicates the active user routes.
- `server/teamRoutes.js` duplicates the active team routes.
- `server/taskRoutes.js` duplicates the active task routes.
- `server/projectRoutes.js` duplicates the active project routes.
- `server/messageRoutes.js` duplicates the active message routes.
- `server/meetingRoutes.js` duplicates the nested meetings router.

These root-level duplicates are not the ones mounted by `server/index.js`. The active code lives under `server/routes/`.

### Data Adapter Layer

- `server/lib/repo.js` maps raw table rows to the frontend shape.
- `toPublicUser` converts `users` rows to `{ _id, name, email, role, profileImage, techStack, reputationScore, ... }`.
- `toPublicOrganisation` converts `organisations` rows to the public org shape.
- `toPublicOrgRole`, `toPublicOrgMember`, `toPublicComplianceRules`, `toPublicCustomField`, `toPublicAuditLog`, and `toPublicMeeting` do the same for the admin data types.
- `getUserById`, `getUserByEmail`, `createUser`, `verifyUserPassword`, and `updateUser` centralise user access.
- `uniqueSlug` guarantees organisation slugs do not collide.

### SQL And Migrations

- `server/supabase-schema.sql` is the main schema definition for users, organisations, roles, memberships, tasks, projects, messages, conversations, meetings, and triggers.
- `server/supabase.sql` is an older schema snapshot for context only.
- `server/alteration1.sql` adds the org-role hierarchy, compliance tables, audit log, and provisioning-related columns.
- `server/backfill_org_owner_roles.sql` backfills owner/admin/member system roles and assigns owner memberships for existing organisations.
- `server/migrations/20260326_org_roles_insert_policy.sql` enables row-level security for `org_roles` and adds an insert policy.
- `server/prompt.md` is a draft prompt improvement document for AI project generation. It is not the prompt currently used by `createProjectWithAI`.

### What The Server Actually Stores

- Users
- Teams
- Organisations
- Organisation roles
- Organisation members
- Organisation pending invites
- Organisation compliance rules
- Organisation custom fields
- Organisation audit logs
- Projects
- Tasks
- Task dependencies
- Conversations
- Messages
- Message reads
- Meetings

## Client

### App Bootstrap

- `client/src/main.jsx` mounts React, Redux, and the Redux Persist gate.
- `client/src/App.jsx` owns the route tree, shell layout, sidebar visibility, mobile behavior, chat dock, theme provider, and server status banner.
- `client/src/store.js` builds the Redux store, combines all reducers, adds thunk, and persists only `userLogin` and `orgCurrent`.
- `client/src/index.css` is the global style aggregator. It imports the main theme and shared component styles.

### Runtime And API Helpers

- `client/src/config/runtime.js` resolves backend and socket URLs from env vars, then falls back to the production defaults.
- `client/src/config/productionUrls.js` holds the production API/socket/MCP URLs.
- `client/src/utils/api.js` creates the Axios client, injects the JWT automatically, and flips the server online/offline state.
- `client/src/utils/socket.js` wraps `socket.io-client` with the shared socket URL.
- `client/src/hooks/useMediaQuery.js` is a reusable responsive breakpoint hook.
- `client/src/context/ThemeContext.jsx` stores dark/light theme preference, applies the body/html classes, and persists the setting to localStorage.
- `client/src/selectors/membershipSelectors.js` exposes `selectHasOrg` and `selectHasTeam` for gating UI.
- `client/public/user-guide-book-blue.png` is the sidebar guide illustration asset.
- `client/public/vite.svg` is the default Vite favicon / starter asset.

### Redux Actions

- `client/src/actions/userActions.js` handles login, logout, register, user list, user details, profile update, profile image update, and membership bootstrap.
- `client/src/actions/teamActions.js` handles team list, team details, team create, join request creation, delete, and join request approval/rejection.
- `client/src/actions/projectActions.js` handles project list, project details, create, update, delete, and AI-assisted project creation.
- `client/src/actions/taskActions.js` handles task list, task details, create, update, and delete.
- `client/src/actions/messageActions.js` handles message send, message list, and mark-as-read.
- `client/src/actions/organisationActions.js` handles organisation create, list, details, update, delete, invites, and the current organisation selector.
- `client/src/actions/serverActions.js` marks the API as online or offline.

### Redux Constants

- `client/src/constants/userConstants.js` defines auth, profile, user list, and membership action types.
- `client/src/constants/teamConstants.js` defines team action types.
- `client/src/constants/projectConstants.js` defines project action types.
- `client/src/constants/taskConstants.js` defines task action types.
- `client/src/constants/messageConstants.js` defines message action types.
- `client/src/constants/organisationConstants.js` defines organisation action types and the current-organisation state.
- `client/src/constants/serverConstants.js` defines server connectivity action types.

### Redux Reducers

- `client/src/reducers/userReducers.js` stores auth state, user lists, profile data, and profile update state.
- `client/src/reducers/teamReducers.js` stores team lists, details, create state, join state, delete state, and join-request review state.
- `client/src/reducers/projectReducers.js` stores project lists, details, create/update/delete state, and AI generation state.
- `client/src/reducers/taskReducers.js` stores task lists, details, create/update/delete state.
- `client/src/reducers/messageReducers.js` stores sent messages, the current message list, and mark-read state.
- `client/src/reducers/organisationReducers.js` stores organisation lists, details, create/update/delete state, invite state, and the active organisation.
- `client/src/reducers/serverReducers.js` stores the online/offline server status.

### Screens

- `client/src/screens/LandingPage.jsx` and `LandingPage.css` render the public marketing homepage, theme toggle, and CTA flow.
- `client/src/screens/LoginScreen.jsx` and `LoginScreen.css` render the sign-in page.
- `client/src/screens/RegisterScreen.jsx` and `RegisterScreen.css` render the sign-up page with optional profile image upload.
- `client/src/screens/HomeScreen.jsx` and `HomeScreen.css` render the dashboard, stats, onboarding banners, and quick actions.
- `client/src/screens/OngoingProjectsScreen.jsx` and `ProjectScreen.css` render the project list page and open the project-create modal.
- `client/src/screens/ProjectScreen.jsx` and `ProjectScreen.css` render the project detail page, task progress, goal modal, and task drawer launch points.
- `client/src/screens/ProjectCreateScreen.jsx` renders the AI project creation page.
- `client/src/screens/TaskScreen.jsx` and `TaskScreen.css` render the global task list and filters.
- `client/src/screens/TaskEditScreen.jsx` renders the full-page create/edit task form.
- `client/src/screens/TeamScreen.jsx` and `TeamScreen.css` render team listing, create/join modals, and join request handling.
- `client/src/screens/TeamDetailsScreen.jsx` and `TeamDetailsScreen.css` render a single team, its meeting controls, member list, and ongoing projects.
- `client/src/screens/ChatScreen.jsx` and `ChatScreen.css` render the full chat page with sidebar and panel.
- `client/src/screens/MeetingScreen.jsx` and `MeetingScreen.css` render the browser meeting room with WebRTC and Socket.IO.
- `client/src/screens/OrganisationsScreen.jsx` and `OrganisationScreens.css` render the organisation list.
- `client/src/screens/CreateOrganisationScreen.jsx` and `OrganisationScreens.css` render the create-organisation form.
- `client/src/screens/OrganisationDetailScreen.jsx` and `OrganisationDetailScreen.css` render the organisation detail page and admin controls.
- `client/src/screens/OrgManagementPages.jsx` and `OrgManagementPages.css` provide `ProvisionMemberModal`, `MembersPage`, `RolesPage`, `CompliancePage`, `CustomFieldsPage`, `AuditLogPage`, and `CompleteProfilePage`.
- `client/src/screens/ProfileScreen.jsx` and `ProfileScreen.css` render the profile editor.
- `client/src/screens/SettingsScreen.jsx` and `SettingsScreen.css` render the control center / preference page.
- `client/src/screens/AcceptInviteScreen.jsx` handles invite acceptance routing.
- `client/src/screens/AuthLayout.jsx` and `client/src/screens/AuthLayout.css` are an alternate auth layout component, but the login and register pages currently render their own layout instead of using it.
- `client/src/screens/Message.jsx` is a legacy React-Bootstrap alert helper.
- `client/src/screens/Loader.jsx` re-exports the shared loader component.
- `client/src/screens/Sidebar.jsx` and `client/src/screens/Sidebar.css` are an older sidebar implementation that is not used by `App.jsx`.
- `client/src/screens/FormContainer.jsx` and `client/src/screens/FormContainer.css` are a form wrapper used by some screen flows.
- `client/src/screens/GoalModal.jsx` and `client/src/screens/GoalModal.css` are an older goal modal variant.
- `client/src/screens/ProjectCreateModal.jsx` and `client/src/screens/ProjectCreateModal.css` are an older modal variant for project creation.
- `client/src/screens/TaskSideDrawer.jsx` and `client/src/screens/TaskSideDrawer.css` re-export the shared task drawer.

### Shared Components

- `client/src/components/Sidebar.jsx` and `Sidebar.css` are the active authenticated shell sidebar and organisation switcher entry point.
- `client/src/components/OrgSwitcher.jsx` lets the user pick or create the active organisation.
- `client/src/components/ChatDocked.jsx` is the docked chat drawer opened from the sidebar.
- `client/src/components/ChatPanel.jsx` and `ChatPanel.css` render the main chat panel.
- `client/src/components/ChatSidebar.jsx` and `ChatSidebar.css` render the team/member picker for chat.
- `client/src/components/ChatMessage.jsx` renders individual chat bubbles and read receipts.
- `client/src/components/ChatPlaceholder.jsx` renders the empty chat state.
- `client/src/components/MessageList.jsx` renders the message feed and marks messages as read.
- `client/src/components/MessageInput.jsx` handles message submission and optionally emits socket events.
- `client/src/components/Message.jsx` and `Message.css` are the active custom alert component and its styling.
- `client/src/components/Loader.jsx` and `Loader.css` render the loading spinner.
- `client/src/components/FormContainer.jsx` and `FormContainer.css` wrap auth and modal forms in a centered container.
- `client/src/components/GoalModal.jsx` and `GoalModal.css` render the project-goal modal.
- `client/src/components/ProjectCreateModal.jsx` and `ProjectCreateModal.css` render the AI/manual project creation modal used by the ongoing-projects page.
- `client/src/components/ProjectListItem.jsx` renders a single project card in the project list.
- `client/src/components/TaskSideDrawer.jsx` and `TaskSideDrawer.css` render the slide-in task editor and creator.
- `client/src/components/UserGuideModal.jsx` and `UserGuideModal.css` render the in-app user guide overlay.
- `client/src/components/LeftSidebar.jsx` and `LeftSidebar.css` are a small experimental sidebar variant that is not wired into `App.jsx`.
- `client/src/components/ChatPopup.jsx` and `ChatPopup.css` are an alternate popup-style chat UI, not the main chat flow.
- `client/src/components/AuthLayout.jsx` and `AuthLayout.css` are a minimal auth layout variant that is currently unused by the auth pages.
- `client/src/components/MessageInput.css` styles the chat message composer.
- `client/src/components/LeftSidebar.css` styles the experimental sidebar variant.

### Shared Styling

- `client/src/theme.css` defines theme tokens and shared color variables.
- `client/src/light-theme.css` defines the light theme overrides.
- `client/src/styles/auth.css` styles the login and register experience.
- `client/src/styles/workspace.css` styles the authenticated workspace, cards, panels, and meeting/chat surfaces.
- `client/src/global.css` holds global base styles.
- `client/src/miscellaneous.css` contains extra shared layout rules.
- `client/src/animations.css` contains motion and entrance animations.
- `client/src/App.css` holds app-shell layout rules that complement `components/Sidebar.css`.
- `client/src/assets/react.svg` is the default Vite/React starter asset.

### What The Client Routes Map To

- `/` -> landing page
- `/login` -> login screen
- `/register` -> register screen
- `/dashboard` -> home screen
- `/projects` and `/projects/ongoing` -> project list
- `/project/:id` -> project detail
- `/project/create` -> AI project creation
- `/teams` -> team list
- `/team/:id` -> team detail
- `/team/:id/meeting` -> meeting room
- `/tasks` -> task list
- `/task/create` and `/task/:id/edit` -> task editor
- `/chat` and `/chat/:id` -> chat UI
- `/organisations` -> organisation list
- `/organisations/create` and `/organisations/new` -> create organisation
- `/organisations/:id` -> organisation detail
- `/organisations/:id/settings/*` -> org management subpages
- `/organisations/:id/complete-profile` -> mandatory onboarding page
- `/invite/accept` -> invite acceptance flow

### Important Client Behaviors

- `App.jsx` hides the sidebar on public routes.
- `App.jsx` keeps a docked chat drawer available on authenticated routes.
- `App.jsx` listens for `storage` events so login/logout state can sync across tabs.
- `App.jsx` calls `fetchMembershipStatus()` once a token exists so the app knows whether the user has organisations or teams.
- `utils/api.js` automatically attaches the JWT from Redux to API requests.
- `serverStatus` is used to show an offline banner when the backend stops responding.
- `ThemeContext` controls both auth and landing theme toggles.

## Mobile

- `mobile/pubspec.yaml` defines the Flutter package, dependencies, version, and platform setup.
- `mobile/pubspec.lock` is the Flutter dependency lockfile.
- `mobile/analysis_options.yaml` defines lint rules for Dart.
- `mobile/README.md` is the default Flutter starter README.
- `mobile/lib/main.dart` is the current Dart entrypoint. It is only a placeholder scaffold and does not yet connect to the backend.
- `mobile/test/widget_test.dart` is the default Flutter test template.

### Mobile Platform Scaffold

- `mobile/web/index.html`, `mobile/web/manifest.json`, and `mobile/web/icons/*` are the Flutter web shell and icon assets.
- `mobile/ios/*` contains the Xcode runner, launch screen, app icons, workspace metadata, and iOS tests.
- `mobile/macos/*` contains the macOS runner, entitlements, app icons, workspace metadata, and tests.
- `mobile/windows/*` contains the Win32 runner, resource files, plugin registration, and window helpers.

These platform folders are generated scaffolding. They are mostly boilerplate until the Flutter app is actually built out.

## Legacy, Duplicate, And Stale Files

- `server/userRoutes.js`, `server/teamRoutes.js`, `server/taskRoutes.js`, `server/projectRoutes.js`, `server/messageRoutes.js`, and `server/meetingRoutes.js` are root-level duplicates of the active route files.
- `client/src/screens/Sidebar.jsx` is an older sidebar implementation. The active sidebar is `client/src/components/Sidebar.jsx`.
- `client/src/screens/Message.jsx` is a legacy alert helper. The active alert component is `client/src/components/Message.jsx`.
- `client/src/screens/AuthLayout.jsx` and `client/src/components/AuthLayout.jsx` are alternate auth layout variants, but the active auth screens currently render their own page structure.
- `client/src/screens/ProjectCreateModal.jsx` and `client/src/screens/GoalModal.jsx` are older modal variants next to the active component versions.
- `client/src/screens/Loader.jsx` and `client/src/screens/TaskSideDrawer.jsx` are wrapper exports around shared components.
- `client/src/components/LeftSidebar.jsx` and `client/src/components/ChatPopup.jsx` are alternate chat/navigation experiments not wired into `App.jsx`.
- `README.md`, `PROJECT_DESCRIPTION_FOR_AI.md`, `RECAP_2026_01_28.md`, and `Preoject_reading.md` contain useful context, but they are not the current source of runtime truth.

## Key Data And Flow Notes

- Organisation creation seeds owner/admin/member roles and a compliance row.
- Team creation is organisation-aware and permission gated.
- Project creation is organisation-aware, and team assignment is optional but validated.
- Task detail and project detail pages are responsible for launching the shared task drawer.
- Chat uses `messages`, `conversations`, and `message_reads`.
- Meetings use `meetings` plus Socket.IO room state.
- The schema and the UI do not always use the same status strings, so status mapping is handled in the client UI.
- Some client screens still mirror older route or layout assumptions, so verify invite and legacy wrapper flows against the active `/api/...` backend prefixes before extending them.

## If You Want The Short Version

Collaborate is a React + Redux + Vite frontend, an Express + Supabase backend, and a placeholder Flutter mobile shell. The app is organised around users, organisations, teams, projects, tasks, chat, and meetings, with realtime behavior handled by Socket.IO and video calling handled by WebRTC in the meeting screen.
