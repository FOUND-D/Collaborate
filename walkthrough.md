# Badge Display & Interactive Showcase Control Fix

We redesigned how user badges are displayed on the profile page:
1. **Side-by-Side Left-Aligned Layout**: Changed the badge layout from centered to left-aligned/start-aligned, placing badges side-by-side (first badge at the extreme left, followed by the next badge to its right).
2. **Interactive Details Link & Modal**: Added a "View badge details" link below the badge row. Clicking this link opens a beautiful modal containing a detailed list of all badges earned by the user, alongside clear explanations/descriptions of *why* each achievement was rewarded.
3. **Showcase Visibility Checkboxes (Tick Mark Theory)**: 
   - When viewing their own profile, next to each badge in the modal, users will see a custom checkmark checkbox.
   - Users can click on a badge card (or the checkbox) to toggle its visibility on their public profile.
   - Checked badges are shown publicly on their profile card, while unchecked/hidden badges are hidden from all public views (cards, lists, public profiles).
   - This state is synced to the database dynamically using a `_hidden` suffix on the badge type column, allowing it to work seamlessly on the existing remote schema.
4. **Default Visibility Limit (Up to 3 Showcase Badges)**:
   - When a badge is awarded, the backend automatically checks how many visible badges the user has. If they already have 3 or more visible badges, the newly awarded badge defaults to hidden (`_hidden` suffix added automatically).
   - This prevents cluttering public layouts while allowing the user to select their preferred top 3 badges to showcase.
5. **No Duplicate or Broken Badges**: Removed the redundant compact badges section, avoiding duplicate badge renderings.
6. **UX Deadlock Prevention (Empty/Unchecked Badges)**:
   - If a user unchecks all of their badges, a placeholder label `"No badges showcased"` is displayed instead of the blank space.
   - Below it, the action button switches dynamically to `"Select badges to showcase"`, which opens the modal and allows the user to re-select badges to showcase at any time.
   - This keeps the interface interactive and prevents the user from being locked out of the modal.

## Changes Made

### Frontend

#### [MODIFY] [ProfileScreen.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/screens/ProfileScreen.jsx)
- Added React state `badges` to fetch and store the full detailed badges list.
- Implemented a `toggleBadgeVisibility` handler callback that issues a `PUT /api/badges/:id/visibility` request, updates the local badges checklist state, and re-fetches the user profile so the header card reflects changes immediately.
- Passed `allBadges`, `isOwn`, and `onToggleBadge` props to the `<AchievementTags>` component.

#### [MODIFY] [AchievementTags.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/components/AchievementTags.jsx)
- Refactored the inline badge rendering to clean the `_hidden` suffix (e.g. `resource_sharer_hidden` renders as the "Resource Sharer" tag, but is hidden from public display).
- Added visibility checkbox controls next to each achievement item in the modal (only shown when `isOwn` is true).
- Wired checkbox interactions to trigger the `onToggleBadge` callback.
- Added visual focus state styling and help cursors for interactive badge cards.
- Handled empty showcase scenario (`badges.length === 0`) by rendering a `"No badges showcased"` placeholder and switching the button to `"Select badges to showcase"` if `isOwn` is true.

### Backend

#### [MODIFY] [repo.js](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/server/lib/repo.js)
- Updated `getUserById`, matches selection, and `enrichListings` helper methods to filter out hidden badges (types ending with `_hidden`) from all public lists and user card objects.

#### [MODIFY] [badgeRoutes.js](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/server/routes/badgeRoutes.js)
- Implemented a protected `PUT /api/badges/:id/visibility` endpoint that verifies ownership of the badge, appends/removes the `_hidden` type suffix in the database, and returns the updated badge object.

#### [MODIFY] [badgeService.js](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/server/services/badgeService.js)
- Modified `awardBadgeIfEarned` and `recalculateTopTeachers` to enforce the default limit of 3 showcased badges, defaulting any additional badges earned to hidden.

### Testing / Seeding

- Updated the database for the test user `123456789@gmail.com` to make exactly 3 badges visible (showcased) by default, while the remaining 9 are hidden (contain `_hidden` suffix).

## Verification Results

- Verified that the codebase builds correctly with `npm run build` in the `client` folder.
- Verified that the dev servers are running on localhost with `npm run dev` and `npm start`.
