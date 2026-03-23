# Collaborate

Collaborate is a full-stack team collaboration platform for planning work, managing teams, tracking tasks, generating AI-assisted project roadmaps, chatting in real time, and running browser-based meetings.

This repository is a monorepo with three apps:
- `server/` for the Node.js + Express + MongoDB backend
- `client/` for the React + Redux + Vite web app
- `mobile/` for a Flutter starter app

## What This README Covers

This document is intended to be the main source of truth for how the codebase works.
It explains:
- the overall architecture
- how the frontend is wired
- how the backend is wired
- authentication and request flow
- data models
- API routes
- realtime Socket.IO and WebRTC behavior
- local setup
- environment variables
- deployment notes
- common failure points and debugging tips

## Architecture Overview

The app is split into a client and server:

- The React client renders pages, dispatches Redux actions, and calls the API through Axios.
- The Express server handles authentication, CRUD operations, AI roadmap generation, messaging, meetings, and organisation management.
- MongoDB stores users, teams, projects, tasks, conversations, messages, meetings, and organisations.
- Socket.IO is used for presence, meeting signaling, and chat notifications.

The most important flow is:
1. The frontend sends a request to the backend using `client/src/utils/api.js`.
2. The backend authenticates the request with `server/middleware/authMiddleware.js`.
3. The controller performs database work through Mongoose models.
4. The response is returned to Redux and then rendered in the UI.

## Frontend Architecture

### Core Frontend Stack
- React
- Vite
- React Router
- Redux
- Redux Thunk
- Redux Persist
- Axios
- Socket.IO client
- React Icons

### Frontend State Flow

The Redux store is defined in [client/src/store.js](client/src/store.js).

Important slices:
- `userLogin` stores the logged-in user and JWT
- `teamList`, `teamCreate`, `teamJoin`, `teamDelete`, `teamDetails`
- `projectList`, `projectCreate`, `projectUpdate`, `projectDelete`, `projectDetails`, `projectCreateWithAI`
- `taskList`, `taskCreate`, `taskUpdate`, `taskDelete`, `taskDetails`
- `orgCreate`, `orgList`, `orgDetails`, `orgUpdate`, `orgDelete`, `orgInvite`, `orgCurrent`
- `messageList`, `messageSend`, `messageMarkRead`
- `serverStatus` tracks whether the API appears online

Redux persistence currently keeps:
- `userLogin`
- `orgCurrent`

### API Client

All client API calls go through [client/src/utils/api.js](client/src/utils/api.js).

Behavior:
- Axios `baseURL` comes from `client/src/config/runtime.js`
- JWT is injected automatically from the Redux store in a request interceptor
- server offline / online state is updated based on response success or network failure

This means most feature actions do not need to manually attach the token, although some actions still do for parity.

### App Shell and Routing

Main app routing is in [client/src/App.jsx](client/src/App.jsx).

The app shell is:
- a fixed left sidebar on authenticated routes
- a main content area to the right
- a public landing page at `/`

Important route groups:
- Public: `/`, `/login`, `/register`, `/invite/accept`
- Auth protected: `/dashboard`, `/projects`, `/teams`, `/tasks`, `/chat`, `/settings`, `/organisations/*`
- Project detail and task detail pages are also routed in the main app shell

### Main Frontend Screens

Key screens in `client/src/screens/`:
- `LandingPage.jsx` for the marketing homepage
- `LoginScreen.jsx` and `RegisterScreen.jsx` for auth
- `HomeScreen.jsx` for the dashboard
- `OngoingProjectsScreen.jsx` and `ProjectScreen.jsx` for project browsing and detail
- `TaskScreen.jsx` and `TaskEditScreen.jsx` for task management
- `TeamScreen.jsx` and `TeamDetailsScreen.jsx` for teams
- `OrganisationsScreen.jsx`, `CreateOrganisationScreen.jsx`, `OrganisationDetailScreen.jsx`
- `ChatScreen.jsx` for chat
- `MeetingScreen.jsx` for video meetings
- `ProfileScreen.jsx` and `SettingsScreen.jsx`

### Shared UI Components

Useful shared components live in `client/src/components/`:
- `Sidebar.jsx` for the app navigation
- `OrgSwitcher.jsx` for selecting the active organisation
- `ChatDocked.jsx`, `ChatPanel.jsx`, `ChatSidebar.jsx`, `MessageList.jsx`, `MessageInput.jsx`
- `TaskSideDrawer.jsx` and `ProjectCreateModal.jsx`
- `GoalModal.jsx`, `UserGuideModal.jsx`, `Loader.jsx`, `Message.jsx`

## Backend Architecture

### Core Backend Stack
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Socket.IO
- Groq SDK

### Server Entry Point

The backend entry file is [server/index.js](server/index.js).

It is responsible for:
- creating the Express app
- creating the HTTP server
- mounting Socket.IO
- installing middleware
- mounting API routes
- attaching the global error handler
- connecting to MongoDB before listening

The server currently uses:
- `express.json()`
- `express.urlencoded({ extended: true })`
- `cors()`
- request logging middleware
- `notFound` and `errorHandler`

### Middleware

Important middleware files:
- [server/middleware/authMiddleware.js](server/middleware/authMiddleware.js)
- [server/middleware/asyncHandler.js](server/middleware/asyncHandler.js)
- [server/middleware/errorMiddleware.js](server/middleware/errorMiddleware.js)

Auth middleware responsibilities:
- read the JWT from `Authorization: Bearer <token>`
- verify the token using `JWT_SECRET`
- fetch the user from MongoDB
- attach `req.user`
- return `401` if the token or user is invalid

Async handler responsibilities:
- wrap async route handlers
- forward rejected promises to Express error middleware

### Global Error Handling

The error middleware returns JSON errors instead of a blank HTML response.
This is critical for debugging production failures.

## Data Models

### User

[server/models/User.js](server/models/User.js)

Fields:
- `name`
- `email`
- `password`
- `role`
- `profileImage`
- `techStack`
- `teams`
- `organisations`
- `reputationScore`

Notes:
- password is hashed before save
- `matchPassword()` compares user input against the stored hash
- `profileImage` is persisted and returned in auth/profile responses

### Team

[server/models/Team.js](server/models/Team.js)

Fields:
- `name`
- `members`
- `tasks`
- `projects`
- `owner`
- `organisation`
- `pendingJoinRequests`

Notes:
- teams can exist with or without an organisation for backward compatibility

### Organisation

[server/models/Organisation.js](server/models/Organisation.js)

Fields:
- `name`
- `slug`
- `description`
- `logo`
- `owner`
- `members`
- `teams`
- `pendingInvites`
- `settings`

Notes:
- `slug` is generated from the name and kept unique
- `owner` is required
- `settings` has a default object so new orgs can be created without extra payload

### Project

[server/models/Project.js](server/models/Project.js)

Fields:
- `name`
- `goal`
- `owner`
- `team`
- `organisation`
- `tasks`
- `dueDate`

Notes:
- `organisation` is optional for compatibility
- AI-generated projects create a project document first, then associated tasks

### Task

[server/models/Task.js](server/models/Task.js)

Task concepts:
- task metadata
- duration
- priority
- status
- assignee
- dependencies
- parent / subtask hierarchy
- project link
- team link

### Messaging and Meetings

Additional models:
- [server/models/Message.js](server/models/Message.js)
- [server/models/Conversation.js](server/models/Conversation.js)
- [server/models/Meeting.js](server/models/Meeting.js)

## API Routes

All API routes are mounted under `/api`.

### Users

[server/routes/userRoutes.js](server/routes/userRoutes.js)

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users`
- `GET /api/users/search`
- `GET /api/users/profile`
- `PATCH /api/users/profile`
- `PATCH /api/users/profile/image`

### Teams

[server/routes/teamRoutes.js](server/routes/teamRoutes.js)

- `POST /api/teams`
- `GET /api/teams`
- `GET /api/teams/:id`
- `DELETE /api/teams/:id`
- `PUT /api/teams/:id/members`
- `POST /api/teams/:id/join`
- `PUT /api/teams/:id/join`

### Projects

[server/routes/projectRoutes.js](server/routes/projectRoutes.js)

- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/ai`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Tasks

[server/routes/taskRoutes.js](server/routes/taskRoutes.js)

- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Messages

[server/routes/messageRoutes.js](server/routes/messageRoutes.js)

- `POST /api/messages`
- `GET /api/messages/team/:teamId`
- `GET /api/messages/conversation/:conversationId`
- `PUT /api/messages/read`

### Meetings

[server/routes/meetingRoutes.js](server/routes/meetingRoutes.js)

- `POST /api/teams/:teamId/meetings`
- `GET /api/teams/:teamId/meetings`
- `PUT /api/teams/:teamId/meetings/:meetingId`

### Organisations

[server/routes/organisationRoutes.js](server/routes/organisationRoutes.js)

- `POST /api/organisations`
- `GET /api/organisations`
- `GET /api/organisations/:id`
- `PUT /api/organisations/:id`
- `DELETE /api/organisations/:id`
- `GET /api/organisations/:id/members`
- `POST /api/organisations/:id/members/invite`
- `PUT /api/organisations/:id/members/:userId/role`
- `DELETE /api/organisations/:id/members/:userId`
- `GET /api/organisations/:id/teams`
- `GET /api/organisations/invite/accept`

## Request Flow by Feature

### Login
1. User submits email and password.
2. `loginUser` validates credentials.
3. Server returns a JWT and user payload.
4. Frontend stores `userInfo` in Redux and persistence.

### Create Project
1. User enters project name, goal, due date, and optional team.
2. Frontend dispatches `createProject` or `createProjectWithAI`.
3. Backend creates the project and optionally links it to a team.
4. AI project creation additionally generates a roadmap from Groq and persists tasks recursively.

### Create Organisation
1. User submits the organisation form.
2. Frontend dispatches `createOrganisation`.
3. Backend generates a unique slug.
4. Backend creates the organisation document.
5. Backend adds the owner to the org members list.
6. Backend adds the org to the user’s `organisations` array.

### Create Team
1. User submits team name and optional organisation.
2. Backend creates the team.
3. If organisation is supplied, the team is attached to that organisation.
4. The team is added to the owner’s `teams` array.

### Start Meeting
1. A team member starts a meeting.
2. The backend saves the meeting state.
3. Socket.IO broadcasts meeting state and participant changes.

## Realtime System

Socket.IO is initialized in [server/index.js](server/index.js).

### Main Socket Events
- `joinTeamRoom`
- `startMeeting`
- `endMeeting`
- `userJoined`
- `userLeft`
- `participantsUpdated`
- `user-connected`
- `user-disconnected`
- `toggle-camera`
- `toggle-mic`
- `camera-toggled`
- `mic-toggled`
- `joinConversation`
- `leaveConversation`
- `newMessage`
- `chat message`
- `offer`
- `answer`
- `ice-candidate`

### How Meeting Signaling Works
The app uses Socket.IO as the signaling transport and the browser WebRTC API for peer-to-peer media exchange.

Flow:
1. Users join the team room.
2. The app exchanges offers and answers over Socket.IO.
3. ICE candidates are relayed.
4. Media tracks are attached to the peer connections.
5. Camera and mic toggles are broadcast to the room.

### How Chat Works
Chat uses a mixture of:
- backend message persistence
- Redux actions
- periodic polling in the UI
- socket events for newer room updates

## Environment Variables

### Backend
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `NODE_ENV`

### Frontend
- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `VITE_MCP_GATEWAY_URL`
- `VITE_API_TIMEOUT_MS`

If frontend env vars are not set, [client/src/config/runtime.js](client/src/config/runtime.js) falls back to the production URLs in [client/src/config/productionUrls.js](client/src/config/productionUrls.js).

## Local Setup

### Backend
```bash
cd server
npm install
npm start
```

Example `server/.env`:
```env
PORT=3002
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### Mobile
```bash
cd mobile
flutter pub get
flutter run
```

## Deployment Notes

### Render
The backend is designed to run on Render with:
- `npm start` as the start command
- `node index.js` as the entrypoint in [server/package.json](server/package.json)
- `MONGO_URI` configured in Render environment variables
- `JWT_SECRET` configured in Render environment variables

### Vercel
The frontend is configured to hit the Render API URL in production through `client/src/config/productionUrls.js`.

## Common Failure Points

These are the areas that typically break first:

- `protect` middleware failures when the JWT or secret is missing
- MongoDB connection issues from an invalid `MONGO_URI`
- Missing or stale client auth state in Redux Persist
- Validation failures when required model fields are not supplied
- CORS / origin mismatches between the Vercel frontend and Render backend
- UI pages relying on older CSS class names or duplicate legacy styles

## Known Technical Debt

- Some legacy route files still exist alongside the newer `server/routes/` versions.
- Some screen files are duplicated between `client/src/components/` and `client/src/screens/`.
- Chat still has polling behavior in parts of the UI.
- The meeting screen is large and could be split into smaller modules.
- Some page styles are still being migrated from older layout systems to the newer dark design language.

## Recommended Next Steps

1. Add automated tests for auth, project creation, organisation creation, and team creation.
2. Add request logging around all protected create endpoints.
3. Replace remaining legacy duplicate screen/component files with a single canonical version.
4. Add API docs or an OpenAPI spec.
5. Add a short troubleshooting section for Render deployment and auth failures.
