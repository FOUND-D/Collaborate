# Collaborate

Collaborate is a full-stack team collaboration platform with project planning, AI-assisted task breakdown, team operations, task tracking, chat, and browser-based video meetings.

## Table of Contents
- [Overview](#overview)
- [Current Status](#current-status)
- [Core Implemented Features](#core-implemented-features)
- [Web App Screens and User Flows](#web-app-screens-and-user-flows)
- [Backend API Capabilities](#backend-api-capabilities)
- [Real-Time Architecture (Socket.IO + WebRTC)](#real-time-architecture-socketio--webrtc)
- [Data Model Overview](#data-model-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Known Limitations and Technical Debt](#known-limitations-and-technical-debt)
- [Future Features Roadmap](#future-features-roadmap)
- [Suggested Milestones](#suggested-milestones)

## Overview
Collaborate is designed for teams that want one workspace for:
- Team formation and membership approvals
- Creating projects manually or with AI-generated task roadmaps
- Managing tasks (including parent/sub-task trees)
- Team and direct messaging
- Live team meetings with media controls and screen sharing

The repository is a monorepo with:
- `server/` (Node.js + Express + MongoDB + Socket.IO)
- `client/` (React + Redux + Vite)
- `mobile/` (Flutter starter app)

## Current Status
The project is functional as a web platform with:
- Authentication and profile management
- Team CRUD (owner-scoped actions + join request workflow)
- Project CRUD plus AI project generation
- Task CRUD and project-linked editing
- Real-time meeting rooms with WebRTC signaling
- Team/direct messaging with polling and read receipts

The Flutter app is currently a base scaffold and is not yet feature-parity with the web app.

## Core Implemented Features

### 1. Authentication and User Account
- Register and login using email/password
- JWT-based auth on protected APIs
- Persisted web login via `redux-persist` (`userLogin` slice)
- Logout support from sidebar
- User profile fetch/update (`name`, `email`, `role`, `techStack`, optional password change)
- Token refresh behavior on profile update (new token returned)

### 2. Team Collaboration Management
- Create team (creator becomes owner + first member)
- List teams where user is owner or member
- View single team details (`owner`, `members`, `projects`)
- Join request workflow:
  - User submits join request by team ID
  - Owner can approve or reject
- Owner-only team deletion
- Membership synchronization to user records
- Team card and detail views in UI
- Copy team ID support for invite flow

### 3. Project Management
- List projects available to user (owned or team-accessible)
- Create project manually
- Create project with AI (`/api/projects/ai`)
- View project details including owner/team/task context
- Update project metadata (currently owner-restricted)
- Delete project (owner only)
- Team linkage for projects when assigned to a team

### 4. AI-Assisted Project Breakdown
- AI model call through Groq SDK (`openai/gpt-oss-120b`)
- Prompt enforces structured JSON roadmap generation
- Converts roadmap to persisted task hierarchy:
  - Top-level phases/tasks
  - Nested subtasks (recursive)
  - Dependency mapping by task name
  - Duration, priority, assumptions
- Auto-attaches generated tasks to project
- Optionally links generated tasks/projects to a team

### 5. Task Management
- Create tasks via API and UI
- Task list for current user (assignee or owner)
- Edit task details (status, priority, duration, due date, project, etc.)
- Quick toggle completion from list/details
- Delete task (owner-only in backend)
- Recursive sub-task rendering in project detail view
- Side drawer task editing from project screen

### 6. Team and Direct Messaging
- Team chat messages
- Direct messages (conversation auto-created when needed)
- Message history endpoints by team or conversation
- Mark messages as read (`readBy` updates)
- Chat panel UI with:
  - Team list + direct member list
  - Search/filter tabs
  - Message list + input
  - Polling refresh every 4 seconds for active chat

### 7. Live Meetings and Real-Time Presence
- Start team meeting (member-only, one active meeting per team)
- End meeting and retrieve active meeting state
- Team room presence and participant updates via Socket.IO
- WebRTC signaling:
  - Offer/answer exchange
  - ICE candidate relay
- Media controls:
  - Camera toggle
  - Mic toggle
  - Screen sharing with dynamic track replacement
- Participant status indicators (camera/mic/speaking)
- Join/leave room lifecycle events

### 8. UX and Application Behavior
- Responsive sidebar with mobile toggle
- Docked chat panel with close/back interactions
- Dashboard shortcuts to key flows
- Server offline indicator in app shell
- Consistent loading and message components across screens

## Web App Screens and User Flows
Main routed screens in `client/src/App.jsx`:
- `/` -> Dashboard (Home)
- `/login` -> Login
- `/register` -> Register
- `/teams` -> Team listing, create/join, request approvals
- `/team/:id` -> Team details, member list, meeting controls
- `/team/:id/meeting` -> WebRTC meeting UI
- `/tasks` -> Task list + quick actions
- `/task/create` -> Create task
- `/task/:id/edit` -> Edit task
- `/project/create` -> AI project creation flow
- `/project/:id` -> Project details, progress, nested tasks, task drawer
- `/projects/ongoing` -> Project listing and creation modal
- `/profile` -> User profile and credentials updates

## Backend API Capabilities
Base URL prefix: `/api`

### User Routes (`/api/users`)
- `POST /register`
- `POST /login`
- `GET /` (protected, list users)
- `GET /search?search=...` (protected)
- `GET /profile` (protected)
- `PATCH /profile` (protected)

### Team Routes (`/api/teams`)
- `POST /` (create team)
- `GET /` (list accessible teams)
- `GET /:id` (team details)
- `DELETE /:id` (owner-only)
- `PUT /:id/members` (add member, owner-only)
- `POST /:id/join` (submit join request)
- `PUT /:id/join` (approve/reject join request, owner-only)

### Meeting Routes (`/api/teams/:teamId/meetings`)
- `POST /` (start meeting)
- `GET /` (get active meeting)
- `PUT /:meetingId` (end meeting)

### Project Routes (`/api/projects`)
- `GET /` (list accessible projects)
- `POST /` (manual project create)
- `POST /ai` (AI project create)
- `GET /:id` (project details with task tree)
- `PUT /:id` (owner-only update)
- `DELETE /:id` (owner-only delete)

### Task Routes (`/api/tasks`)
- `POST /` (create task)
- `GET /` (list user tasks)
- `GET /:id` (task details)
- `PUT /:id` (update task)
- `DELETE /:id` (owner-only delete)

### Message Routes (`/api/messages`)
- `POST /` (send message: team/direct/conversation)
- `GET /team/:teamId`
- `GET /conversation/:conversationId`
- `PUT /read` (mark as read)

## Real-Time Architecture (Socket.IO + WebRTC)
Socket server is initialized in `server/index.js` and attached to HTTP server.

### Meeting/Presence Events
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

### WebRTC Signaling Events
- `offer`
- `answer`
- `ice-candidate`

### Chat Events
- `joinConversation`
- `leaveConversation`
- `newMessage`
- `chat message` (legacy/global broadcast handler)

## Data Model Overview
Key MongoDB models:
- `User`: identity, auth fields, role, tech stack, team references
- `Team`: owner, members, pending join requests, linked tasks/projects
- `Project`: name, goal, owner, optional team, tasks, due date
- `Task`: project-linked work item with dependencies, priority, assumptions, parent/subTasks
- `Meeting`: team room with `active|inactive` status and starter
- `Conversation`: direct-message participant set
- `Message`: chat payload linked to team or conversation + `readBy`

## Tech Stack

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT auth (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Groq SDK (AI roadmap generation)
- Socket.IO (realtime layer)

### Frontend
- React (Vite)
- Redux + Redux Thunk
- Redux Persist
- React Router
- Axios
- React Icons + Bootstrap
- Socket.IO client

### Mobile
- Flutter (starter)
- `socket_io_client`, `intl` dependencies declared

## Repository Structure
```text
collaborate/
  client/
    src/
      actions/
      reducers/
      screens/
      components/
      constants/
      utils/
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
  mobile/
    lib/
    ios/
    android/
    web/
    macos/
    windows/
```

## Local Setup

### Prerequisites
- Node.js 18+
- npm
- MongoDB (local or Atlas)
- Groq API key (for AI project generation)

### 1. Backend Setup
```bash
cd server
npm install
```
Create `server/.env`:
```env
NODE_ENV=development
PORT=3002
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```
Run backend:
```bash
npm start
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 3. Mobile (Optional, current scaffold)
```bash
cd mobile
flutter pub get
flutter run
```

## Environment Variables
Used by backend:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `NODE_ENV`

Frontend currently uses a hardcoded API fallback URL in `client/src/utils/api.js`:
- `https://collaborate-arin.onrender.com`

## Known Limitations and Technical Debt
- `client/src/actions/taskActions.js` uses `axios.delete` without importing `axios` (delete task flow risk).
- Task model requires `project`, but create-task UI allows `No Project`; this can cause backend validation errors.
- API status values in model defaults (`pending`) and UI labels (`To Do`, `In Progress`, etc.) are inconsistent.
- Project deletion removes tasks but may leave stale task references on teams.
- Some legacy/duplicate route files exist at `server/*.js` while active routes are in `server/routes/`.
- Chat panel relies on polling; websocket-based live updates are only partially wired.
- Meeting screen contains high-complexity real-time logic in a single component and can be modularized.
- There is a `/settings` sidebar route but no matching screen route in `App.jsx`.

## Future Features Roadmap

### A. Product Features (High Value)
- Role-based access control (admin/owner/member permissions by endpoint)
- Team invitations by email/link (not only Team ID copy/paste)
- Task comments, attachments, and activity timeline
- Kanban board + sprint planning views
- Recurring tasks and reminders
- Global search across users, teams, projects, tasks, and messages
- Notification center (in-app + email) for mentions, assignments, due dates, approvals
- Calendar/timeline visualization (Gantt for dependencies)
- Dashboard analytics (velocity, completion rate, overdue trends)

### B. AI and Automation
- AI re-planning when deadlines slip
- Auto-risk detection and mitigation suggestions
- Story-point estimation and sprint capacity suggestions
- AI-generated standup summaries from completed work
- AI chat assistant over project context (tasks, dependencies, blockers)

### C. Messaging and Meetings
- True websocket live chat updates (replace polling as default)
- Typing indicators, presence states, unread badges
- File/image sharing in chat
- Threaded replies and pinned messages
- Meeting recording metadata and post-meeting notes
- Meeting agenda templates and action-item extraction

### D. Mobile Expansion
- Full Flutter parity with web features
- Push notifications
- Offline task updates with sync
- Mobile-first meeting controls and chat UX

### E. Platform and Engineering
- Centralized validation layer (`zod`/`joi`) for all API payloads
- API versioning and OpenAPI/Swagger docs
- Unit/integration/E2E test suites (backend + frontend)
- CI/CD pipeline with lint/test/build gates
- Observability (structured logging, tracing, performance metrics)
- Security hardening (rate limits, refresh token strategy, CSP, stricter CORS)
- Multi-tenant workspace support

### F. Integrations
- GitHub/GitLab task linking
- Slack/Discord notifications
- Google/Outlook calendar sync
- Jira/Linear import-export bridges
- Cloud storage attachments (S3/GCS)

## Suggested Milestones

### Milestone 1 (Stability)
- Fix current known bugs and schema/UI mismatches
- Add tests for auth, team join, project AI flow, and task CRUD
- Replace chat polling with socket-based subscription updates

### Milestone 2 (Collaboration Depth)
- Add comments, notifications, and improved role permissions
- Add chat quality-of-life features (typing, unread counters, attachments)
- Add project timeline/Gantt visualization

### Milestone 3 (Scale and Ecosystem)
- Launch mobile feature parity
- Add integrations (GitHub, calendars, Slack)
- Add analytics and AI operational assistant
