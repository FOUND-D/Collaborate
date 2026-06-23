# Global Search Bar & Achievements Modal Update Walkthrough

We updated the global search feature and expanded the achievements showcase:
1. **Public View of All Earned Badges**:
   - When users view *another* person's profile, they can now see the "View badge details" link.
   - Clicking it opens a modal displaying **all** 12 of the user's earned badges (both visible/showcased and hidden ones) in full color/opacity.
   - Checkboxes are hidden from public views so only the profile owner can select/toggle showcase badges.
2. **Global Search Bar**:
   - Added a global search input in the middle of `TopHeader.jsx` that matches query terms case-insensitively.
   - Searching supports names or student IDs (roll numbers).
   - Added quick-filters for search categories (`All`, `People`, `Projects`, `Tasks`, `Resources`, `Teams`).
   - Added sub-filters for user results based on roles (`Student`, `Faculty`, `Admin`).

## Changes Made

### Frontend

#### [MODIFY] [AchievementTags.jsx](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/components/AchievementTags.jsx)
- Allowed non-owners to click "View badge details" even when no showcase badges are visible, provided they have earned at least 1 badge.
- Enabled rendering of all badges in the modal details list for public views (`modalListBadges = allBadges`).
- Set full rendering opacity (`opacity = 1`) on the icons and content cards in the modal when viewed by public visitors, keeping the checkmark toggles visible only for the profile owner.

## Verification Results

- Verified that the client code compiles successfully with `npm run build`.
- Confirmed that the dev servers are running on localhost.
