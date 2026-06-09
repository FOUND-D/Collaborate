import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import { composeWithDevTools } from '@redux-devtools/extension';
import { persistReducer } from 'redux-persist'; // 1. Import persistReducer
import storage from 'redux-persist/lib/storage'; // 2. Import default storage (localStorage)

import {
  userLoginReducer,
  userRegisterReducer,
  userListReducer,
  userDetailsReducer,
  userUpdateProfileReducer,
  userUpdateProfileImageReducer,
} from './reducers/userReducers';
import { serverStatusReducer } from './reducers/serverReducers';

import {
  teamListReducer,
  teamCreateReducer,
  teamJoinReducer,
  teamDeleteReducer,
  teamUpdateJoinRequestReducer,
  teamDetailsReducer,
} from './reducers/teamReducers';
import {
  taskListReducer,
  taskCreateReducer,
  taskUpdateReducer,
  taskDetailsReducer,
  taskDeleteReducer,
} from './reducers/taskReducers';
import { 
  projectCreateWithAIReducer, 
  projectDetailsReducer, 
  projectListReducer, 
  projectDeleteReducer, 
  projectCreateReducer, 
  projectUpdateReducer 
} from './reducers/projectReducers';
import {
  messageListReducer, // Import messageListReducer
  messageMarkReadReducer,
  messageSendReducer, // Import messageSendReducer
} from './reducers/messageReducers'; // Import message reducers
import {
  orgCreateReducer,
  orgListReducer,
  orgDetailsReducer,
  orgUpdateReducer,
  orgDeleteReducer,
  orgInviteReducer,
  orgCurrentReducer,
} from './reducers/organisationReducers';
import {
  skillListReducer,
  userSkillListReducer,
  userSkillCreateReducer,
  userSkillDeleteReducer,
  skillMatchListReducer,
} from './reducers/skillReducers';
import {
  listingListReducer,
  listingDetailsReducer,
  listingCreateReducer,
  listingUpdateReducer,
  listingDeleteReducer,
} from './reducers/listingReducers';
import {
  sessionListReducer,
  sessionDetailsReducer,
  sessionCreateReducer,
  sessionStatusReducer,
} from './reducers/sessionReducers';
import {
  ratingCreateReducer,
  ratingListReducer,
} from './reducers/ratingReducers';
import {
  resourceListReducer,
  resourceCreateReducer,
} from './reducers/resourceReducers';
import {
  announcementListReducer,
  announcementCreateReducer,
} from './reducers/announcementReducers';

// 3. Define the Persist Configuration
const persistConfig = {
  key: 'root',
  storage,
  // IMPORTANT: We only whitelist 'userLogin' so the user stays logged in.
  // We usually don't persist lists (like 'taskList') because we want fresh data from the server.
  whitelist: ['userLogin', 'orgCurrent'], 
};

const rootReducer = combineReducers({
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  userList: userListReducer,
  userDetails: userDetailsReducer,
  userUpdateProfile: userUpdateProfileReducer,
  userUpdateProfileImage: userUpdateProfileImageReducer,
  teamList: teamListReducer,
  teamCreate: teamCreateReducer,
  teamJoin: teamJoinReducer,
  teamDelete: teamDeleteReducer,
  teamUpdateJoinRequest: teamUpdateJoinRequestReducer,
  teamDetails: teamDetailsReducer,
  taskList: taskListReducer,
  taskCreate: taskCreateReducer,
  taskUpdate: taskUpdateReducer,
  taskDetails: taskDetailsReducer,
  taskDelete: taskDeleteReducer,
  projectCreateWithAI: projectCreateWithAIReducer,
  projectDetails: projectDetailsReducer,
  projectList: projectListReducer,
  projectDelete: projectDeleteReducer,
  projectCreate: projectCreateReducer,
  projectUpdate: projectUpdateReducer,
  serverStatus: serverStatusReducer,
  messageList: messageListReducer, // Add messageListReducer
  messageMarkRead: messageMarkReadReducer,
  messageSend: messageSendReducer, // Add messageSendReducer
  orgCreate: orgCreateReducer,
  orgList: orgListReducer,
  orgDetails: orgDetailsReducer,
  orgUpdate: orgUpdateReducer,
  orgDelete: orgDeleteReducer,
  orgInvite: orgInviteReducer,
  orgCurrent: orgCurrentReducer,
  skillList: skillListReducer,
  userSkillList: userSkillListReducer,
  userSkillCreate: userSkillCreateReducer,
  userSkillDelete: userSkillDeleteReducer,
  skillMatchList: skillMatchListReducer,
  listingList: listingListReducer,
  listingDetails: listingDetailsReducer,
  listingCreate: listingCreateReducer,
  listingUpdate: listingUpdateReducer,
  listingDelete: listingDeleteReducer,
  sessionList: sessionListReducer,
  sessionDetails: sessionDetailsReducer,
  sessionCreate: sessionCreateReducer,
  sessionStatus: sessionStatusReducer,
  ratingCreate: ratingCreateReducer,
  ratingList: ratingListReducer,
  resourceList: resourceListReducer,
  resourceCreate: resourceCreateReducer,
  announcementList: announcementListReducer,
  announcementCreate: announcementCreateReducer,
});

// 4. Wrap your root reducer with the persist function
const persistedReducer = persistReducer(persistConfig, rootReducer);

const middleware = [thunk];

// 5. Create the store using the persistedReducer
// Note: We removed 'initialState' because redux-persist handles rehydration now.
const store = createStore(
  persistedReducer,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;
