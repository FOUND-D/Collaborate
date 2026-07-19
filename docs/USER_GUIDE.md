# Collaborate User Guide

**Note:** This file tracks the live features of the Collaborate platform. It should be updated whenever a screen or route is added, renamed, or removed.

## Table of Contents
- [Dashboard](#dashboard)
- [Projects](#projects)
- [Teams](#teams)
- [Tasks](#tasks)
- [Meetings / Session Room](#meetings--session-room)
- [Exchange Board](#exchange-board)
- [My Sessions](#my-sessions)
- [Resources](#resources)
- [Leaderboard](#leaderboard)
- [My Ratings](#my-ratings)
- [Chat](#chat)
- [Organisations](#organisations)
- [Profile](#profile)
- [Settings](#settings)
- [Admin Dashboard](#admin-dashboard)
- [Admin Complaints](#admin-complaints)
- [Coming Soon](#coming-soon)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## Dashboard
**Sidebar Label:** Dashboard  
**Route:** `/dashboard`

The Dashboard is your home base. It displays a workspace summary showing recent activity, a quick task overview, your Dev Score, and quick links to your most important areas.

## Projects
**Sidebar Label:** Projects  
**Routes:** `/projects`, `/project/:id`, `/project/create`

Create and manage projects. Each project has a task list with status tracking (To Do, In Progress, Completed, Blocked), metadata (due date, owner, team), and a completion progress bar. Create new projects or open existing ones to manage tasks.

## Teams
**Sidebar Label:** Teams  
**Routes:** `/teams`, `/team/:id`

Create teams, invite members, and view team details. Each team page shows members and has a Git Activity section to track linked GitHub repositories.

## Tasks
**Sidebar Label:** Tasks  
**Routes:** `/tasks`, `/task/create`, `/task/:id/edit`

A global task view to see all your tasks across projects. Add, edit, filter by status, and mark tasks complete.

## Meetings / Session Room
**Routes:** `/team/:id/meeting`, `/team/:id/session`

Browser-based video meetings launched from a team page. Includes camera, microphone, and screen sharing controls via WebRTC.

## Exchange Board
**Sidebar Label:** Exchange Board  
**Routes:** `/exchange`, `/exchange/:id`

A marketplace where users create skill-sharing listings (offer to teach or request to learn). Browse listings, view details, and book sessions with other users using credits.

## My Sessions
**Sidebar Label:** My Sessions  
**Routes:** `/sessions`, `/sessions/:id`

View all your booked skill-exchange sessions (as teacher or learner). See session details, status, and join when it's time.

## Resources
**Sidebar Label:** Resources  
**Route:** `/resources`

A shared file and resource library. Upload, browse, and download documents, notes, and other materials shared within your workspace.

## Leaderboard
**Sidebar Label:** Leaderboard  
**Route:** `/leaderboard`

Ranks developers by their combined Dev Score. Only users with BOTH GitHub and LeetCode accounts connected appear. Scores are calculated as (GitHub Score + LeetCode Score) / 2 and refresh automatically daily.

## My Ratings
**Sidebar Label:** My Ratings  
**Route:** `/my-ratings`

View all peer ratings you've received and given. See your average rating and individual feedback.

## Chat
**Routes:** `/chat`, `/chat/:id`

Real-time messaging with team members. Use the docked chat panel for quick messages or the full-screen chat view for longer conversations.

## Organisations
**Sidebar Label:** Organisations  
**Routes:** `/organisations`, `/organisations/:id`, etc.

Create and manage organisations. Invite members, assign roles, set compliance rules, manage custom fields, and view audit logs. Use the org switcher in the sidebar to move between organisations.

## Profile
**Routes:** `/profile`, `/profile/:userId`

View and edit your profile. Shows your skills, GitHub/LeetCode integration with contribution calendars, showcased projects, Dev Score breakdown, badges, and social links. Visit other users' profiles to rate them or book sessions.

## Settings
**Sidebar Label:** Settings  
**Route:** `/settings`

Manage account preferences: display name, theme, timezone, language, date format, notification settings, and connected accounts.

## Admin Dashboard
**Route:** `/admin`

Admin-only. Overview of platform statistics, user management, and system health.

## Admin Complaints
**Route:** `/admin/complaints`

Admin-only. Review and manage user-submitted complaints and reports.

## Coming Soon

- **Skill Sharing** (`/skill-sharing`) - AI-powered skill group matching. Currently a placeholder screen.
- **Portfolio** (`/portfolio/:slug`) - Public portfolio pages. Coming in a future phase.

## Keyboard Shortcuts

- **Toggle Sidebar:** `Ctrl/Cmd + B`
