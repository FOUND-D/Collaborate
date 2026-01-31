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

// 3. Define the Persist Configuration
const persistConfig = {
  key: 'root',
  storage,
  // IMPORTANT: We only whitelist 'userLogin' so the user stays logged in.
  // We usually don't persist lists (like 'taskList') because we want fresh data from the server.
  whitelist: ['userLogin'], 
};

const rootReducer = combineReducers({
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  userList: userListReducer,
  userDetails: userDetailsReducer,
  userUpdateProfile: userUpdateProfileReducer,
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
