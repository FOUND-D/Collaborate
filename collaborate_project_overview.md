# Collaborate Project Overview

Collaborate is a full-stack, AI-powered team collaboration platform built to consolidate project planning, execution, and communication into a single digital workspace. 

## High-Level Architecture
The platform is built as a modern web application:
- **Frontend:** React, Redux (Thunk & Persist), and Vite.
- **Backend:** Node.js and Express.
- **Database:** Supabase (PostgreSQL), shifting from an older MongoDB implementation. Data mapping happens via a repository layer (`server/lib/repo.js`).
- **Real-Time Stack:** Socket.IO for active presence and chat updates; WebRTC for peer-to-peer browser video meetings.
- **AI Integration:** Groq SDK for generating structured project roadmaps using LLMs.
- **Mobile (Work in progress):** A placeholder Flutter mobile shell exists for future cross-platform support.

## Core Data Models & Workflows

The application is structured hierarchically to support robust multi-tenant environments:

1. **Organisations:**
   - The top level of collaboration. Users can create organisations and invite members.
   - Includes deeper administration like roles (owner/admin/member), custom fields, compliance rules, and audit logs.
2. **Teams:**
   - Housed within organisations. They require join-requests and owner approvals for membership.
3. **Projects:**
   - Can be created manually or generated automatically via AI.
   - When using the AI flow, a user inputs a natural language prompt, and the backend utilizes Groq to generate a work breakdown structure containing tasks, subtasks, priorities, and dependencies.
4. **Tasks:**
   - Granular execution items with status tracking, nesting, and assignments. 
   - Uses a slide-in editor ("TaskSideDrawer") for quick updates without losing context.
5. **Real-time Communication:**
   - **Messages:** Supports both direct messaging and team-based chat threads with read receipts.
   - **Meetings:** Dedicated browser-based meeting rooms with WebRTC enabling camera, microphone, and screen-sharing interactions natively.

## Technical Execution & Routing
- **Frontend Routing:** The client maps distinct screens to URLs (e.g., `/dashboard`, `/projects/ongoing`, `/team/:id`, `/organisations`, `/chat`). It features a split layout with a main sidebar for navigation and a docked chat drawer that stays accessible across authenticated routes.
- **API Routing:** The Express backend splits functionality logically across `/api/users`, `/api/teams`, `/api/tasks`, `/api/projects`, `/api/messages`, `/api/organisations` (basic CRUD), and `/api/orgs` (advanced admin flows).
- **Security:** Relies on JWT-based authentication passed from Redux via Axios interceptors, alongside strict organization/team membership middleware gating on the backend to enforce permissions.

## Key Features Built
- Full User Auth & Profile management (with avatars and skill stacks).
- AI Roadmap Generation that directly seeds actionable tasks into the database.
- Complete Project & Task tracking (CRUD operations with parent/child task relationships).
- Organization role-based access control and compliance rule enforcement.
- Real-time signaling for live video collaboration directly in the browser.
