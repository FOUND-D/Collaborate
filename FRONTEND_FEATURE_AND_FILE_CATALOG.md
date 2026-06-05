# Frontend Feature and File Catalog

Scope: frontend only. This catalog covers the React/Vite client in `client/`, including all source screens, components, Redux files, config, styles, and frontend root files present in this workspace.

## Frontend Stack

- App framework: React 19 with Vite.
- Routing: `react-router-dom`.
- State: Redux, Redux Thunk, Redux Persist.
- API client: Axios via `client/src/utils/api.js`.
- Realtime: Socket.IO client via `client/src/utils/socket.js` and direct `io(...)` usage in some screens/components.
- Styling: global CSS, theme CSS, screen CSS, component CSS, and shared phase/workspace CSS.
- Animation/icons: Framer Motion and React Icons.

## Runtime Targets

- Production API URL: `https://collaborate-1.onrender.com`.
- Production Socket.IO URL: `https://collaborate-1.onrender.com`.
- Runtime URL resolution lives in `client/src/config/runtime.js`.
- Production URL constants live in `client/src/config/productionUrls.js`.
- Production Vite env values live in `client/.env.production`.
- Local env values live in `client/.env` in this workspace.

## Application Shell Features

- Root React mount and Redux persistence.
- Browser routing with protected routes and admin-only route wrapper.
- Responsive authenticated layout with collapsible sidebar.
- Top header on authenticated routes.
- Docked chat drawer available from authenticated layout.
- Server offline banner when Axios detects network/server failure.
- Theme provider with dark/light mode support.
- Lazy loading for heavier feature screens.

Primary files:
- `client/src/main.jsx`
- `client/src/App.jsx`
- `client/src/store.js`
- `client/src/context/ThemeContext.jsx`
- `client/src/components/Sidebar.jsx`
- `client/src/components/TopHeader.jsx`
- `client/src/components/ChatDocked.jsx`

## Route and Screen Catalog

### Public Routes

- `/` - Landing page. File: `client/src/screens/LandingPage.jsx`.
- `/login` - Login screen with provisioned-user redirect support. File: `client/src/screens/LoginScreen.jsx`.
- `/register` - Registration screen. File: `client/src/screens/RegisterScreen.jsx`.
- `/invite/accept` - Invite acceptance placeholder/flow entry. File: `client/src/screens/AcceptInviteScreen.jsx`.

### Authenticated Dashboard and Workspace Routes

- `/dashboard` - Home/dashboard. File: `client/src/screens/HomeScreen.jsx`.
- `/projects` - Ongoing projects list. File: `client/src/screens/OngoingProjectsScreen.jsx`.
- `/projects/ongoing` - Ongoing projects alias. File: `client/src/screens/OngoingProjectsScreen.jsx`.
- `/project/create` - Project creation screen. File: `client/src/screens/ProjectCreateScreen.jsx`.
- `/project/:id` - Project detail screen. File: `client/src/screens/ProjectScreen.jsx`.
- `/tasks` - Task board/list. File: `client/src/screens/TaskScreen.jsx`.
- `/task/create` - Task create form. File: `client/src/screens/TaskEditScreen.jsx`.
- `/task/:id/edit` - Task edit form. File: `client/src/screens/TaskEditScreen.jsx`.
- `/teams` - Teams list, create team, join team, join request management. File: `client/src/screens/TeamScreen.jsx`.
- `/team/:id` - Team detail screen. File: `client/src/screens/TeamDetailsScreen.jsx`.
- `/team/:id/meeting` - Live meeting/session room. File: `client/src/screens/MeetingScreen.jsx`.
- `/team/:id/session` - Session-room alias. File: `client/src/screens/MeetingScreen.jsx`.
- `/chat` - Chat screen. File: `client/src/screens/ChatScreen.jsx`.
- `/chat/:id` - Chat conversation/team route. File: `client/src/screens/ChatScreen.jsx`.
- `/profile` - User profile. File: `client/src/screens/ProfileScreen.jsx`.
- `/settings` - User settings/profile editing. File: `client/src/screens/SettingsScreen.jsx`.

### Organisation Routes

- `/organisations` - Organisation list. File: `client/src/screens/OrganisationsScreen.jsx`.
- `/organisations/create` - Organisation create form. File: `client/src/screens/CreateOrganisationScreen.jsx`.
- `/organisations/new` - Organisation create alias. File: `client/src/screens/CreateOrganisationScreen.jsx`.
- `/organisations/:id` - Organisation detail and admin controls. File: `client/src/screens/OrganisationDetailScreen.jsx`.
- `/organisations/:id/settings/members` - Organisation member management. File: `client/src/screens/OrgManagementPages.jsx`.
- `/organisations/:id/settings/roles` - Organisation role management. File: `client/src/screens/OrgManagementPages.jsx`.
- `/organisations/:id/settings/compliance` - Compliance rules. File: `client/src/screens/OrgManagementPages.jsx`.
- `/organisations/:id/settings/custom-fields` - Custom fields. File: `client/src/screens/OrgManagementPages.jsx`.
- `/organisations/:id/settings/audit-log` - Audit log. File: `client/src/screens/OrgManagementPages.jsx`.
- `/organisations/:id/complete-profile` - Provisioned member onboarding/compliance completion. File: `client/src/screens/OrgManagementPages.jsx`.

### Skill Exchange and Session Routes

- `/exchange` - Skill exchange board with filters and listing creation. File: `client/src/screens/ExchangeBoardScreen.jsx`.
- `/exchange-board` - Redirect to `/exchange`.
- `/exchange/:id` - Listing detail and booking. File: `client/src/screens/ListingDetailScreen.jsx`.
- `/skills` - User skill profile and skill matches. File: `client/src/screens/SkillProfileScreen.jsx`.
- `/sessions` - User session list, booking modal, rating prompt entry. File: `client/src/screens/SessionsScreen.jsx`.
- `/sessions/:id` - Session detail, confirm/cancel/complete, rating prompt. File: `client/src/screens/SessionDetailScreen.jsx`.

### Placeholder or Utility Routes

- `/resources` - Resources placeholder. File: `client/src/screens/ResourcesScreen.jsx`.
- `/leaderboard` - Leaderboard placeholder. File: `client/src/screens/LeaderboardScreen.jsx`.
- `/admin` - Admin placeholder, gated by admin role. File: `client/src/screens/PhaseOnePlaceholderScreen.jsx`.
- `/portfolio/:slug` - Portfolio placeholder. File: `client/src/screens/PhaseOnePlaceholderScreen.jsx`.
- `*` - Redirects to `/`.

## Feature Catalog

### Landing and Marketing

- Product landing page with navigation and marketing sections.
- Responsive landing styles.
- Public login/register links.

Files:
- `client/src/screens/LandingPage.jsx`
- `client/src/screens/LandingPage.css`
- `client/src/index.html` via `client/index.html`

### Authentication

- Login.
- Register.
- Provisioned account login messaging with email prefill and redirect support.
- Persisted auth state.
- Logout.
- Authenticated route protection.
- Admin route protection.
- Profile refresh after updates.

Files:
- `client/src/screens/LoginScreen.jsx`
- `client/src/screens/RegisterScreen.jsx`
- `client/src/screens/AuthLayout.jsx`
- `client/src/components/AuthLayout.jsx`
- `client/src/actions/userActions.js`
- `client/src/reducers/userReducers.js`
- `client/src/constants/userConstants.js`
- `client/src/styles/auth.css`

### Dashboard

- Authenticated home dashboard.
- Project/team/task overview cards and quick actions.
- Membership-aware prompts based on organisation/team state.

Files:
- `client/src/screens/HomeScreen.jsx`
- `client/src/screens/HomeScreen.css`
- `client/src/selectors/membershipSelectors.js`

### Organisations

- List user's organisations.
- Create organisation.
- Organisation detail view.
- Current organisation selection.
- Organisation sidebar switcher.
- Invite member by email.
- Provision organisation member account.
- Member list and search.
- Member status and role updates.
- Custom organisation roles and permissions.
- Compliance rule configuration.
- Custom field management.
- Audit log view.
- Complete profile onboarding for provisioned users.

Files:
- `client/src/screens/OrganisationsScreen.jsx`
- `client/src/screens/CreateOrganisationScreen.jsx`
- `client/src/screens/OrganisationDetailScreen.jsx`
- `client/src/screens/OrgManagementPages.jsx`
- `client/src/components/OrgSwitcher.jsx`
- `client/src/actions/organisationActions.js`
- `client/src/reducers/organisationReducers.js`
- `client/src/constants/organisationConstants.js`
- `client/src/screens/OrganisationScreens.css`
- `client/src/screens/OrganisationDetailScreen.css`
- `client/src/screens/OrgManagementPages.css`

### Teams

- Team list.
- Organisation-aware team creation.
- Join team by ID.
- Owner join request approval/rejection.
- Team cards with member/project metadata.
- Team detail page.
- Team project/task/session overview.
- Start live team session.

Files:
- `client/src/screens/TeamScreen.jsx`
- `client/src/screens/TeamDetailsScreen.jsx`
- `client/src/actions/teamActions.js`
- `client/src/reducers/teamReducers.js`
- `client/src/constants/teamConstants.js`
- `client/src/screens/TeamScreen.css`
- `client/src/screens/TeamDetailsScreen.css`

### Projects

- Project list.
- Ongoing projects screen.
- Project creation screen.
- Project creation modal.
- AI-assisted project creation state.
- Project detail screen.
- Project update and delete flows.
- Project list item component.

Files:
- `client/src/screens/OngoingProjectsScreen.jsx`
- `client/src/screens/ProjectCreateScreen.jsx`
- `client/src/screens/ProjectScreen.jsx`
- `client/src/screens/ProjectCreateModal.jsx`
- `client/src/components/ProjectCreateModal.jsx`
- `client/src/components/ProjectListItem.jsx`
- `client/src/actions/projectActions.js`
- `client/src/reducers/projectReducers.js`
- `client/src/constants/projectConstants.js`
- `client/src/screens/ProjectScreen.css`
- `client/src/components/ProjectCreateModal.css`

### Tasks

- Task list/board.
- Task create and edit screen.
- Task status, priority, category, duration, assignee, due date fields.
- Task side drawer component.
- Task CRUD Redux flows.

Files:
- `client/src/screens/TaskScreen.jsx`
- `client/src/screens/TaskEditScreen.jsx`
- `client/src/screens/TaskSideDrawer.jsx`
- `client/src/components/TaskSideDrawer.jsx`
- `client/src/actions/taskActions.js`
- `client/src/reducers/taskReducers.js`
- `client/src/constants/taskConstants.js`
- `client/src/screens/TaskScreen.css`
- `client/src/screens/TaskSideDrawer.css`
- `client/src/components/TaskSideDrawer.css`

### Chat and Messaging

- Full chat screen.
- Docked chat drawer.
- Chat panel.
- Chat popup/sidebar support.
- Message list and message item rendering.
- Message input with session request payload support.
- Realtime Socket.IO updates.
- Read receipts.
- Mark messages read.

Files:
- `client/src/screens/ChatScreen.jsx`
- `client/src/components/ChatDocked.jsx`
- `client/src/components/ChatPanel.jsx`
- `client/src/components/ChatPopup.jsx`
- `client/src/components/ChatSidebar.jsx`
- `client/src/components/ChatMessage.jsx`
- `client/src/components/Message.jsx`
- `client/src/components/MessageInput.jsx`
- `client/src/components/MessageList.jsx`
- `client/src/screens/Message.jsx`
- `client/src/actions/messageActions.js`
- `client/src/reducers/messageReducers.js`
- `client/src/constants/messageConstants.js`
- `client/src/screens/ChatScreen.css`
- `client/src/components/ChatPanel.css`
- `client/src/components/ChatPopup.css`
- `client/src/components/ChatSidebar.css`
- `client/src/components/Message.css`
- `client/src/components/MessageInput.css`

### Live Meetings and Team Sessions

- Browser-based live team room.
- Socket.IO room join.
- WebRTC offer/answer/ICE handling.
- Camera and microphone toggles.
- Participant updates.
- Session start/end events.
- Team meeting/session route aliases.

Files:
- `client/src/screens/MeetingScreen.jsx`
- `client/src/screens/MeetingScreen.css`
- `client/src/utils/socket.js`

### Skill Exchange

- Skill profile with can-teach and wants-to-learn skills.
- Add/remove user skills.
- Skill match listing.
- Exchange board with filters.
- Create listing modal.
- Listing detail screen.
- Listing create/update/delete Redux flows.
- Booking from listing detail.

Files:
- `client/src/screens/SkillProfileScreen.jsx`
- `client/src/screens/ExchangeBoardScreen.jsx`
- `client/src/screens/ListingDetailScreen.jsx`
- `client/src/components/ListingCreateModal.jsx`
- `client/src/actions/skillActions.js`
- `client/src/actions/listingActions.js`
- `client/src/reducers/skillReducers.js`
- `client/src/reducers/listingReducers.js`
- `client/src/constants/skillConstants.js`
- `client/src/constants/listingConstants.js`
- `client/src/screens/SkillExchange.css`

### Booked Sessions and Ratings

- My sessions list.
- Upcoming/past session tabs.
- Book session modal by skill/team/date/time.
- Session detail view.
- Confirm session.
- Cancel session.
- Complete session.
- Rating prompt modal.
- Rating submission state.

Files:
- `client/src/screens/SessionsScreen.jsx`
- `client/src/screens/SessionDetailScreen.jsx`
- `client/src/components/BookSessionModal.jsx`
- `client/src/components/RatingPromptModal.jsx`
- `client/src/actions/sessionActions.js`
- `client/src/actions/ratingActions.js`
- `client/src/reducers/sessionReducers.js`
- `client/src/reducers/ratingReducers.js`
- `client/src/constants/sessionConstants.js`
- `client/src/constants/ratingConstants.js`
- `client/src/screens/SkillExchange.css`

### Profile and Settings

- Profile view.
- Profile image rendering with backend URL prefix support.
- Settings screen for profile fields.
- Profile update and profile image update actions.

Files:
- `client/src/screens/ProfileScreen.jsx`
- `client/src/screens/SettingsScreen.jsx`
- `client/src/actions/userActions.js`
- `client/src/reducers/userReducers.js`
- `client/src/screens/ProfileScreen.css`
- `client/src/screens/SettingsScreen.css`

### Navigation, Layout, Theme, and Shared UI

- Sidebar navigation.
- Top header.
- Organisation switcher.
- Theme toggle.
- Form containers.
- Loaders.
- Empty states.
- User guide modal.
- Goal modal.
- Shared animations.
- Global dark/light theme tokens.

Files:
- `client/src/components/Sidebar.jsx`
- `client/src/components/TopHeader.jsx`
- `client/src/components/OrgSwitcher.jsx`
- `client/src/components/ThemeToggle.jsx`
- `client/src/components/FormContainer.jsx`
- `client/src/components/Loader.jsx`
- `client/src/components/UserGuideModal.jsx`
- `client/src/components/GoalModal.jsx`
- `client/src/screens/FormContainer.jsx`
- `client/src/screens/Loader.jsx`
- `client/src/screens/GoalModal.jsx`
- `client/src/screens/PhaseOnePlaceholderScreen.jsx`
- `client/src/screens/ResourcesScreen.jsx`
- `client/src/screens/LeaderboardScreen.jsx`
- `client/src/animations.css`
- `client/src/global.css`
- `client/src/index.css`
- `client/src/theme.css`
- `client/src/light-theme.css`
- `client/src/miscellaneous.css`
- `client/src/styles/workspace.css`
- `client/src/styles/figma-enhancement.css`

### API, Realtime, State, and Config

- Axios instance with token injection.
- Server online/offline state.
- Socket connection helper.
- Vite runtime configuration.
- Redux root reducer/store.
- Redux persistence for `userLogin` and `orgCurrent`.
- Domain-specific actions, reducers, and constants.

Files:
- `client/src/utils/api.js`
- `client/src/utils/socket.js`
- `client/src/store.js`
- `client/src/config/runtime.js`
- `client/src/config/productionUrls.js`
- `client/src/actions/*.js`
- `client/src/reducers/*.js`
- `client/src/constants/*.js`

## Complete Frontend File Index

### Client Root Files

- `client/.env` - Local Vite environment values in this workspace.
- `client/.env.production` - Production Vite environment values.
- `client/.gitignore` - Frontend ignore rules.
- `client/eslint.config.js` - ESLint configuration.
- `client/GEMINI.md` - Frontend notes/instructions.
- `client/index.html` - Vite HTML entry.
- `client/instructions.md` - Frontend project instructions.
- `client/package-lock.json` - Locked dependency tree.
- `client/package.json` - Frontend scripts and dependencies.
- `client/README.md` - Frontend README.
- `client/vercel.json` - Vercel deployment configuration.
- `client/vite-dev.err.log` - Local Vite error log file.
- `client/vite-dev.out.log` - Local Vite output log file.
- `client/vite.config.js` - Vite configuration.

### `client/src` Root Files

- `client/src/App.jsx` - Main router, layout shell, protected routes, lazy-loaded feature routes.
- `client/src/App.css` - App-level CSS.
- `client/src/animations.css` - Shared animation CSS.
- `client/src/global.css` - Global UI styling.
- `client/src/index.css` - Root index CSS.
- `client/src/light-theme.css` - Light theme variables/styles.
- `client/src/main.jsx` - React entry point.
- `client/src/miscellaneous.css` - Miscellaneous shared styles.
- `client/src/store.js` - Redux store, reducers, persistence.
- `client/src/theme.css` - Main theme variables/styles.

### `client/src/actions`

- `client/src/actions/listingActions.js` - Listing list/detail/create/update/delete async actions.
- `client/src/actions/messageActions.js` - Message send/list/socket receive/read actions.
- `client/src/actions/organisationActions.js` - Organisation create/list/detail/update/delete/invite/current actions.
- `client/src/actions/projectActions.js` - Project list/detail/create/update/delete and AI project actions.
- `client/src/actions/ratingActions.js` - Rating create/list actions.
- `client/src/actions/serverActions.js` - Server online/offline actions.
- `client/src/actions/sessionActions.js` - Session list/detail/create/confirm/cancel/complete actions.
- `client/src/actions/skillActions.js` - Skill list/user skill/match actions.
- `client/src/actions/taskActions.js` - Task list/detail/create/update/delete actions.
- `client/src/actions/teamActions.js` - Team list/detail/create/join/delete/request actions.
- `client/src/actions/userActions.js` - Login/logout/register/profile/user list/membership actions.

### `client/src/assets`

- `client/src/assets/react.svg` - Default React SVG asset.

### `client/src/components`

- `client/src/components/AuthLayout.jsx` - Auth layout wrapper component.
- `client/src/components/AuthLayout.css` - Auth layout styles.
- `client/src/components/BookSessionModal.jsx` - Skill/team session booking modal.
- `client/src/components/ChatDocked.jsx` - Docked chat drawer container.
- `client/src/components/ChatMessage.jsx` - Chat message and session-request card rendering.
- `client/src/components/ChatPanel.jsx` - Chat panel container.
- `client/src/components/ChatPanel.css` - Chat panel styles.
- `client/src/components/ChatPlaceholder.jsx` - Empty chat placeholder.
- `client/src/components/ChatPopup.jsx` - Chat popup component.
- `client/src/components/ChatPopup.css` - Chat popup styles.
- `client/src/components/ChatSidebar.jsx` - Chat sidebar/conversation list.
- `client/src/components/ChatSidebar.css` - Chat sidebar styles.
- `client/src/components/FormContainer.jsx` - Shared form container.
- `client/src/components/FormContainer.css` - Form container styles.
- `client/src/components/GoalModal.jsx` - Goal capture modal.
- `client/src/components/GoalModal.css` - Goal modal styles.
- `client/src/components/LeftSidebar.jsx` - Legacy/simple left sidebar component.
- `client/src/components/LeftSidebar.css` - Left sidebar styles.
- `client/src/components/ListingCreateModal.jsx` - Exchange listing create modal.
- `client/src/components/Loader.jsx` - Loader component.
- `client/src/components/Loader.css` - Loader styles.
- `client/src/components/Message.jsx` - Simple message component.
- `client/src/components/Message.css` - Message styles.
- `client/src/components/MessageInput.jsx` - Message composer and session request sender.
- `client/src/components/MessageInput.css` - Message input styles.
- `client/src/components/MessageList.jsx` - Message list renderer.
- `client/src/components/OrgSwitcher.jsx` - Current organisation selector.
- `client/src/components/ProjectCreateModal.jsx` - Project create modal.
- `client/src/components/ProjectCreateModal.css` - Project create modal styles.
- `client/src/components/ProjectListItem.jsx` - Project list item/card.
- `client/src/components/RatingPromptModal.jsx` - Session rating modal.
- `client/src/components/Sidebar.jsx` - Main authenticated sidebar.
- `client/src/components/Sidebar.css` - Sidebar styles.
- `client/src/components/TaskSideDrawer.jsx` - Task side drawer.
- `client/src/components/TaskSideDrawer.css` - Task drawer styles.
- `client/src/components/ThemeToggle.jsx` - Theme toggle control.
- `client/src/components/ThemeToggle.css` - Theme toggle styles.
- `client/src/components/TopHeader.jsx` - Authenticated top header.
- `client/src/components/TopHeader.css` - Top header styles.
- `client/src/components/UserGuideModal.jsx` - User guide/help modal.
- `client/src/components/UserGuideModal.css` - User guide modal styles.

### `client/src/config`

- `client/src/config/productionUrls.js` - Production API/socket/MCP URLs.
- `client/src/config/runtime.js` - Runtime URL normalization and exported targets.

### `client/src/constants`

- `client/src/constants/listingConstants.js` - Listing action type constants.
- `client/src/constants/messageConstants.js` - Message action type constants.
- `client/src/constants/organisationConstants.js` - Organisation action type constants.
- `client/src/constants/projectConstants.js` - Project action type constants.
- `client/src/constants/ratingConstants.js` - Rating action type constants.
- `client/src/constants/serverConstants.js` - Server status constants.
- `client/src/constants/sessionConstants.js` - Session action type constants.
- `client/src/constants/skillConstants.js` - Skill action type constants.
- `client/src/constants/taskConstants.js` - Task action type constants.
- `client/src/constants/teamConstants.js` - Team action type constants.
- `client/src/constants/userConstants.js` - User/auth action type constants.

### `client/src/context`

- `client/src/context/ThemeContext.jsx` - Theme provider and theme hook.

### `client/src/hooks`

- `client/src/hooks/useMediaQuery.js` - Media query React hook.

### `client/src/reducers`

- `client/src/reducers/listingReducers.js` - Listing Redux reducers.
- `client/src/reducers/messageReducers.js` - Message Redux reducers.
- `client/src/reducers/organisationReducers.js` - Organisation Redux reducers.
- `client/src/reducers/projectReducers.js` - Project Redux reducers.
- `client/src/reducers/ratingReducers.js` - Rating Redux reducers.
- `client/src/reducers/serverReducers.js` - Server online/offline reducer.
- `client/src/reducers/sessionReducers.js` - Session Redux reducers.
- `client/src/reducers/skillReducers.js` - Skill Redux reducers.
- `client/src/reducers/taskReducers.js` - Task Redux reducers.
- `client/src/reducers/teamReducers.js` - Team Redux reducers.
- `client/src/reducers/userReducers.js` - User/auth/profile Redux reducers.

### `client/src/screens`

- `client/src/screens/AcceptInviteScreen.jsx` - Invite acceptance screen.
- `client/src/screens/AuthLayout.jsx` - Screen-level auth layout wrapper.
- `client/src/screens/AuthLayout.css` - Screen-level auth layout styles.
- `client/src/screens/ChatScreen.jsx` - Main chat screen.
- `client/src/screens/ChatScreen.css` - Chat screen styles.
- `client/src/screens/CreateOrganisationScreen.jsx` - Organisation creation screen.
- `client/src/screens/EmptyState.css` - Empty state styles.
- `client/src/screens/ExchangeBoardScreen.jsx` - Skill exchange board.
- `client/src/screens/FormContainer.jsx` - Screen-level form container wrapper.
- `client/src/screens/GoalModal.jsx` - Screen-level goal modal.
- `client/src/screens/GoalModal.css` - Screen-level goal modal styles.
- `client/src/screens/HomeScreen.jsx` - Dashboard/home screen.
- `client/src/screens/HomeScreen.css` - Dashboard styles.
- `client/src/screens/LandingPage.jsx` - Public landing page.
- `client/src/screens/LandingPage.css` - Landing page styles.
- `client/src/screens/LeaderboardScreen.jsx` - Leaderboard placeholder screen.
- `client/src/screens/ListingDetailScreen.jsx` - Exchange listing detail screen.
- `client/src/screens/Loader.jsx` - Screen-level loader wrapper.
- `client/src/screens/LoginScreen.jsx` - Login screen.
- `client/src/screens/LoginScreen.css` - Login screen legacy/specific styles.
- `client/src/screens/MeetingScreen.jsx` - Live meeting/session room screen.
- `client/src/screens/MeetingScreen.css` - Meeting room styles.
- `client/src/screens/Message.jsx` - Screen-level message wrapper.
- `client/src/screens/OngoingProjectsScreen.jsx` - Ongoing projects screen.
- `client/src/screens/OrganisationDetailScreen.jsx` - Organisation detail/admin screen.
- `client/src/screens/OrganisationDetailScreen.css` - Organisation detail styles.
- `client/src/screens/OrganisationScreens.css` - Organisation list/create shared styles.
- `client/src/screens/OrganisationsScreen.jsx` - Organisation list screen.
- `client/src/screens/OrgManagementPages.jsx` - Organisation members/roles/compliance/custom fields/audit/onboarding screens.
- `client/src/screens/OrgManagementPages.css` - Organisation management styles.
- `client/src/screens/PhaseOnePlaceholderScreen.jsx` - Generic placeholder screen.
- `client/src/screens/ProfileScreen.jsx` - User profile screen.
- `client/src/screens/ProfileScreen.css` - Profile styles.
- `client/src/screens/ProjectCreateModal.jsx` - Screen-level project create modal.
- `client/src/screens/ProjectCreateScreen.jsx` - Project creation screen.
- `client/src/screens/ProjectScreen.jsx` - Project detail screen.
- `client/src/screens/ProjectScreen.css` - Project detail styles.
- `client/src/screens/RegisterScreen.jsx` - Register screen.
- `client/src/screens/RegisterScreen.css` - Register screen styles.
- `client/src/screens/ResourcesScreen.jsx` - Resources placeholder screen.
- `client/src/screens/SessionDetailScreen.jsx` - Booked session detail screen.
- `client/src/screens/SessionsScreen.jsx` - Sessions list and booking screen.
- `client/src/screens/SettingsScreen.jsx` - Settings screen.
- `client/src/screens/SettingsScreen.css` - Settings styles.
- `client/src/screens/Sidebar.jsx` - Legacy/screen sidebar.
- `client/src/screens/Sidebar.css` - Legacy/screen sidebar styles.
- `client/src/screens/SkillExchange.css` - Shared skill exchange/session styles.
- `client/src/screens/SkillProfileScreen.jsx` - User skill profile screen.
- `client/src/screens/TaskEditScreen.jsx` - Task create/edit screen.
- `client/src/screens/TaskScreen.jsx` - Task list/board screen.
- `client/src/screens/TaskScreen.css` - Task screen styles.
- `client/src/screens/TaskSideDrawer.jsx` - Screen-level task drawer placeholder/wrapper.
- `client/src/screens/TaskSideDrawer.css` - Screen-level task drawer styles.
- `client/src/screens/TeamDetailsScreen.jsx` - Team detail screen.
- `client/src/screens/TeamDetailsScreen.css` - Team detail styles.
- `client/src/screens/TeamScreen.jsx` - Teams list/create/join screen.
- `client/src/screens/TeamScreen.css` - Teams screen styles.

### `client/src/selectors`

- `client/src/selectors/membershipSelectors.js` - Membership state selectors.

### `client/src/styles`

- `client/src/styles/auth.css` - Shared auth screen styles.
- `client/src/styles/figma-enhancement.css` - Additional visual enhancement styles.
- `client/src/styles/workspace.css` - Authenticated workspace styles.

### `client/src/utils`

- `client/src/utils/api.js` - Axios client, auth header injection, server status handling.
- `client/src/utils/socket.js` - Socket.IO connection helper.

