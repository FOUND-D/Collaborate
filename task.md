# Tasks: Skills Architecture Simplification

- [x] Clean up wants_to_learn records from database
- [x] Update backend matching algorithm and validation
  - [x] Modify `server/lib/repo.js` `getPeerMatches` logic
  - [x] Modify `server/controllers/skillController.js` validation to reject/ignore wants_to_learn
- [x] Update frontend routing and navigation
  - [x] Delete `client/src/screens/SkillProfileScreen.jsx`
  - [x] Modify `client/src/App.jsx` to remove routes/imports
  - [x] Modify `client/src/components/Sidebar.jsx` to remove navigation link
  - [x] Modify `client/src/components/TopHeader.jsx` to remove titles reference
  - [x] Modify `client/src/components/ListingCreateModal.jsx` and `client/src/screens/HomeScreen.jsx` links
- [x] Integrate inline skill management on the Profile Screen
  - [x] Update `client/src/screens/ProfileScreen.jsx` UI and state management
  - [x] Update `client/src/screens/ProfileScreen.css`
- [x] Verify changes
  - [x] Run compilation checks
  - [x] Manually verify adding and deleting skills on Profile
  - [x] Manually verify matches on Dashboard
