# Skills Architecture Simplification Plan

We will simplify the platform's skills architecture by removing the "wants to learn" concept and the dedicated Skill Profile screen. Instead, users will manage their "can teach" skills directly on their Profile page. The dashboard matching algorithm will be updated to recommend potential teachers based on department and expertise.

## User Review Required

> [!IMPORTANT]
> - The dedicated `/skills` page, route, and sidebar navigation link will be removed.
> - Inline skill management will be added to `ProfileScreen` for own profiles.
> - The database will be cleared of all existing `wants_to_learn` skills.

## Proposed Changes

### Database & Backend

#### [MODIFY] [repo.js](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/server/lib/repo.js)
- Update `getPeerMatches` to use **Option 1: Department + Expertise recommendations**.
  - Query other users who have at least one `'can_teach'` skill.
  - Calculate compatibility match scores:
    - Same department: base 40% (vs 10% for different department).
    - Average user rating component: up to 30% (`(avg_rating / 5) * 30`).
    - Number of skills component: up to 30% (`min(skills.length * 10, 30)`).
  - Return users sorted by highest compatibility score.

#### [MODIFY] [skillController.js](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/server/controllers/skillController.js)
- Restrict `createUserSkill` validation to only allow `'can_teach'` type. Default to `'can_teach'` if type is not specified.

---

### Frontend

#### [DELETE] [SkillProfileScreen.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/screens/SkillProfileScreen.jsx)
- Delete this screen file since skill management is moving inline to the Profile page.

#### [MODIFY] [App.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/App.jsx)
- Remove lazy import and route path for `/skills`.

#### [MODIFY] [Sidebar.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/components/Sidebar.jsx)
- Remove the "Skill Profile" link from the sidebar menu.

#### [MODIFY] [TopHeader.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/components/TopHeader.jsx)
- Remove `/skills` from page title resolution logic.

#### [MODIFY] [ListingCreateModal.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/components/ListingCreateModal.jsx)
- Update the empty state redirect link from `/skills` to `/profile`.

#### [MODIFY] [HomeScreen.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/screens/HomeScreen.jsx)
- Update the empty state redirect link from `/skills` to `/profile`.

#### [MODIFY] [ProfileScreen.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/screens/ProfileScreen.jsx)
- Import `listSkills`, `createUserSkill`, and `deleteUserSkill` actions.
- Retrieve the general skill taxonomy (`state.skillList`) and user skills (`state.userSkillList`).
- Add states `isEditingSkills` and `skillDraft` (containing `query`, `level`, `selectedSkill`, etc.).
- When `isOwnProfile` is true, display a "Manage Skills" button next to the Skills header.
- Implement the autocomplete input, suggestions dropdown, level selector, and "Add" button inline.
- Display all user skills as chips showing level and endorsement badge.
- If in editing mode, show a "Remove" button next to each skill chip, and a "Done" button in the header.
- Import `SkillExchange.css` to reuse autocomplete styles.

## Verification Plan

### Automated Tests
- Run `npm run build` inside `client` to verify React compilation.

### Manual Verification
- Run a clean-up query or script to delete all `type = 'wants_to_learn'` rows from the `user_skills` table.
- Verify that navigating to `/profile` shows only the "Skills & Expertise" section.
- Click "Manage Skills" to open the inline editing form.
- Search for a skill, select a level, and click "Add" to verify it updates dynamically.
- Click "Remove" next to an existing skill to verify deletion.
- Verify matches on the Home page display compatible peers with their correct match score percentage.
