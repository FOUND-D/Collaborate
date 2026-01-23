import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk'; // Use named import
import { composeWithDevTools } from '@redux-devtools/extension';
import {
  userLoginReducer,
  userRegisterReducer,
  userListReducer,
  userDetailsReducer, // Import userDetailsReducer
} from './reducers/userReducers';
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
import { projectCreateWithAIReducer, projectDetailsReducer, projectListReducer, projectDeleteReducer, projectCreateReducer, projectUpdateReducer } from './reducers/projectReducers';

const reducer = combineReducers({
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  userList: userListReducer,
  userDetails: userDetailsReducer, // Add userDetailsReducer
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
});

const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const initialState = {
  userLogin: { userInfo: userInfoFromStorage },
};

const middleware = [thunk]; // Use the named import 'thunk'

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;
