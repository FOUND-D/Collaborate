import React, { useEffect, useState } from 'react';
import './ProjectScreen.css';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProjectDetails, updateProject } from '../actions/projectActions';
import { updateTask } from '../actions/taskActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import TaskSideDrawer from '../components/TaskSideDrawer';
import { FaEdit, FaCheckSquare, FaSquare, FaCalendarAlt, FaUser, FaUsers, FaPlus, FaCheck, FaMinus } from 'react-icons/fa'; // Added FaCalendarAlt, FaUser, FaPlus

const calculateProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

const TaskItem = ({ task, onCheck, onEdit, level = 0 }) => {
  const [subtasksVisible, setSubtasksVisible] = useState(false);
  const isCompleted = task.status === 'Completed';

  // Define a mapping for status to a simpler class name for the pills
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'completed';
      case 'In Progress': return 'inprogress';
      case 'Blocked': return 'blocked';
      case 'To Do':
      default:
        return 'pending';
    }
  };

  return (
    <>
      <li className="task-list-item" style={{ paddingLeft: `${level * 32}px` }}>
        <div className="task-checkbox-container">
          <div className={`task-checkbox ${isCompleted ? 'checked' : ''}`} onClick={() => onCheck(task)}>
            {isCompleted && <FaCheck size="0.8em" />}
          </div>
        </div>
        <div className="task-details-main" onClick={() => onEdit(task._id)}>
          <span className={`task-name ${isCompleted ? 'completed' : ''}`}>
            {task.name}
          </span>
          {task.description && <p className="task-description">{task.description}</p>}
        </div>
        <div className="task-metadata-group">
          {task.priority && (
            <span className="task-priority-indicator">
              {/* This could be styled based on priority, e.g., using colors or icons */}
              {task.priority}
            </span>
          )}
          <span className={`task-status-pill ${getStatusClass(task.status)}`}>
            {task.status}
          </span>
        </div>
        <div className="task-actions-group">
          {task.subTasks && task.subTasks.length > 0 && (
            <button className="task-action-btn" onClick={() => setSubtasksVisible(!subtasksVisible)}>
              {subtasksVisible ? <FaMinus /> : <FaPlus />}
            </button>
          )}
          <button className="task-action-btn" onClick={() => onEdit(task._id)}>
            <FaEdit />
          </button>
        </div>
      </li>
      {subtasksVisible && task.subTasks && (
        <ul className="modern-task-list" style={{ margin: 0, padding: 0, boxShadow: 'none' }}>
          {task.subTasks.map(subtask => (
            <TaskItem key={subtask._id} task={subtask} onCheck={onCheck} onEdit={onEdit} level={level + 1} />
          ))}
        </ul>
      )}
    </>
  );
};

const ProjectScreen = () => {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState('');

  const projectDetails = useSelector((state) => state.projectDetails);
  const { loading, error, project } = projectDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const taskUpdate = useSelector((state) => state.taskUpdate);
  const { success: successUpdate } = taskUpdate;

  const projectUpdate = useSelector((state) => state.projectUpdate);
  const { success: successProjectUpdate } = projectUpdate;

  useEffect(() => {
    if (!userInfo || !userInfo.token || userInfo.token.trim() === '') {
      navigate('/login');
    } else {
      dispatch(getProjectDetails(projectId));
      if (successProjectUpdate) {
        setIsEditing(false);
      }
    }
  }, [dispatch, projectId, userInfo, navigate, successUpdate, successProjectUpdate]);

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
    }
  }, [project]);

  const handleTaskCheck = (task) => {
    const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    dispatch(updateTask({ ...task, status: newStatus }));
  };

  const handleEditTask = (taskId) => {
    setSelectedTaskId(taskId);
    setIsCreatingTask(false);
    setIsDrawerOpen(true);
  };

  const handleAddTask = () => {
    setSelectedTaskId(null);
    setIsCreatingTask(true);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTaskId(null);
    setIsCreatingTask(false);
    dispatch(getProjectDetails(projectId));
  };

  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
  };

  const handleSaveProjectName = () => {
    dispatch(updateProject({ _id: projectId, name: projectName }));
  };

  const progress = project ? calculateProgress(project.tasks) : 0;

  return (
    <div className="project-details-page">
      <Link to="/projects/ongoing" className="btn btn-secondary btn-small back-button">
        Go Back
      </Link>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        project && (
          <>
            <div className="project-hero-header">
              <div className="project-hero-title-and-action">
                {isEditing ? (
                  <div className="edit-project-name">
                    <input
                      type="text"
                      value={projectName}
                      onChange={handleProjectNameChange}
                    />
                    <button onClick={handleSaveProjectName}>Save</button>
                    <button onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <h1 className="project-detail-title">{project.name}</h1>
                    <button onClick={() => setIsEditing(true)}>
                      <FaEdit />
                    </button>
                  </>
                )}
                <button className="btn btn-primary btn-small add-task-btn" onClick={handleAddTask}>
                  <FaPlus /> Add Task
                </button>
              </div>
              <p className="project-detail-goal">{project.goal}</p>
              <div className="project-metadata-badges">
                {project.dueDate && (
                  <span className="metadata-badge">
                    <FaCalendarAlt /> {new Date(project.dueDate).toLocaleDateString()}
                  </span>
                )}
                {project.owner && (
                  <span className="metadata-badge">
                    <FaUser /> {project.owner.name}
                  </span>
                )}
                {project.team && (
                  <span className="metadata-badge">
                    <FaUsers /> {project.team.name}
                  </span>
                )}
              </div>
              <div className="project-progress-bar">
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="progress-text">{progress}% Completed</span>
              </div>
            </div>

            <h2 className="section-title mt-4">Tasks</h2>
            {project.tasks && project.tasks.length === 0 ? (
              <Message variant="info">
                No tasks generated for this project.
                <button className="btn btn-primary btn-small ml-2" onClick={handleAddTask}>
                  Add First Task
                </button>
              </Message>
            ) : (
              <ul className="modern-task-list">
                {project.tasks && project.tasks.map((task) => (
                  <TaskItem key={task._id} task={task} onCheck={handleTaskCheck} onEdit={handleEditTask} />
                ))}
              </ul>
            )}
          </>
        )
      )}

      {isDrawerOpen && (
        <TaskSideDrawer
          taskId={selectedTaskId}
          projectId={projectId}
          isCreatingTask={isCreatingTask}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
};

export default ProjectScreen;