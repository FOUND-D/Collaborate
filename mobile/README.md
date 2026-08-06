# Collaborate Mobile

Flutter mobile client for the [Collaborate](https://github.com/FOUND-D/Collaborate) platform.

## Features

Matches the web app workspace:

- Authentication (login, register, forgot/reset password, org invite accept)
- Dashboard with dev score, ratings, and quick actions
- Projects (list, create, AI create, detail)
- Teams (list, create, detail, sessions, meetings)
- Tasks (list, create, edit, delete)
- Exchange board (listings)
- Booking sessions
- Resources (with AI summarise)
- Leaderboard
- My ratings
- Skill sharing (add/remove skills, matches)
- Real-time chat (teams + DMs) via REST + Socket.IO
- Profile & badges
- Settings (theme, bio, GitHub/LeetCode)
- Organisations (create, members, teams, roles, audit log)
- Admin dashboard & complaints (admin role)
- Push-style notifications via Socket.IO

## API

The app uses the deployed Render backend (same as the web client):

```
https://collaborate-1.onrender.com
```

Configured in `lib/config/app_config.dart`.

## Getting started

```bash
cd mobile
flutter pub get
flutter run
```

### Build

```bash
flutter build apk
flutter build ios
```

## Project structure

```
lib/
  config/          # API URLs and app constants
  core/            # Theme, network, storage, utilities
  services/        # ApiService (all /api/* routes)
  providers/       # Auth & theme state
  features/        # Feature screens
  router/          # go_router navigation
  widgets/         # Shared UI (app shell, cards)
```

## Design

Uses the same design tokens as the web app (`client/src/theme.css`):

- Primary teal `#14b8a6`
- DM Sans typography
- Light/dark themes
- Dev score orange gradient cards
