import React, { useEffect, useState, useMemo } from 'react';
import './TaskScreen.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiCalendar, FiActivity } from 'react-icons/fi';

import Message from '../components/Message';
import Loader from '../components/Loader';
import TaskSideDrawer from '../components/TaskSideDrawer';

import { listTasks, updateTask } from '../actions/taskActions';
import { TASK_DELETE_SUCCESS } from '../constants/taskConstants';

const TaskScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Drawer state
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Redux state
  const taskList = useSelector((state) => state.taskList);
  const { loading, error, tasks = [] } = taskList;

  const taskDelete = useSelector((state) => state.taskDelete);
  const { loading: loadingDelete, error: errorDelete, success: successDelete } = taskDelete;

  const taskUpdate = useSelector((state) => state.taskUpdate);
  const { success: successUpdate } = taskUpdate;

  const taskCreate = useSelector((state) => state.taskCreate);
  const { success: successCreate } = taskCreate;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // Filters
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const categoryOptions = ['All Categories', 'assignment', 'exam_prep', 'research', 'study_goal', 'project_milestone', 'personal'];

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }

    if (successDelete || successUpdate || successCreate) {
      if (successDelete) dispatch({ type: TASK_DELETE_SUCCESS });
      dispatch(listTasks());
    } else {
      dispatch(listTasks());
    }
  }, [dispatch, navigate, userInfo, successDelete, successUpdate, successCreate]);

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    const taskId = e.dataTransfer.getData('taskId');
    const taskToUpdate = tasks.find(t => t._id === taskId || t.id === taskId);
    if (taskToUpdate && taskToUpdate.status !== status) {
      dispatch(updateTask({ ...taskToUpdate, status }));
    }
  };

  // Filter tasks by category
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      return activeCategory === 'All Categories' ? true : task.category === activeCategory;
    });
  }, [tasks, activeCategory]);

  // Group tasks by status for columns
  const boardColumns = useMemo(() => {
    const cols = {
      'To Do': [],
      'In Progress': [],
      'Blocked': [],
      'Completed': []
    };
    
    filteredTasks.forEach(task => {
      const status = task.status || 'To Do';
      if (cols[status]) {
        cols[status].push(task);
      } else {
        cols['To Do'].push(task); // Fallback
      }
    });
    
    return cols;
  }, [filteredTasks]);

  const openEditDrawer = (taskId) => {
    setSelectedTaskId(taskId);
    setIsCreatingTask(false);
    setIsDrawerOpen(true);
  };

  const openCreateDrawer = () => {
    setSelectedTaskId(null);
    setIsCreatingTask(true);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTaskId(null);
    setIsCreatingTask(false);
  };

  return (
    <div className="task-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tasks</h1>
          <p>Organise and track your work items on the board.</p>
        </div>
        <button className="btn-primary" onClick={openCreateDrawer}>
          <FiPlus /> Create Task
        </button>
      </div>

      {/* Category filters */}
      <div className="task-filters">
        {categoryOptions.map((option) => (
          <button
            key={option}
            className={`task-filter-btn ${activeCategory === option ? 'active' : ''}`}
            onClick={() => setActiveCategory(option)}
          >
            {option === 'All Categories' ? option : option.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loadingDelete && <Loader />}
      {errorDelete && <Message variant="danger">{errorDelete}</Message>}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : tasks.length === 0 ? (
        <div className="task-empty-state">
          <div className="task-empty-state-icon-wrapper">
            <FiActivity size={40} />
          </div>
          <h3 className="task-empty-state-heading">No Tasks Yet</h3>
          <p className="task-empty-state-subtext">
            Your task list is empty. Create a task to stay organized and keep track of your work.
          </p>
          <button className="btn-primary" onClick={openCreateDrawer}>
            <FiPlus /> Create Your First Task
          </button>
        </div>
      ) : (
        /* Kanban Board rendering */
        <div className="task-board">
          {Object.keys(boardColumns).map((columnName) => {
            const columnTasks = boardColumns[columnName];
            return (
              <div 
                key={columnName} 
                className="task-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, columnName)}
              >
                <div className="task-column-header">
                  <span className="task-column-title">{columnName}</span>
                  <span className="task-column-count">{columnTasks.length}</span>
                </div>

                {columnTasks.map((task) => (
                  <div 
                    key={task._id || task.id} 
                    className={`task-card-item priority-${(task.priority || 'medium').toLowerCase()}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id || task.id)}
                    onClick={() => openEditDrawer(task._id || task.id)}
                  >
                    <span className={`task-card-title ${task.status === 'Completed' ? 'completed' : ''}`}>
                      {task.name}
                    </span>

                    {task.category && (
                      <div className="task-card-tags">
                        <span className="task-card-tag">{task.category.replace(/_/g, ' ')}</span>
                      </div>
                    )}

                    <div className="task-card-footer">
                      <div className="task-card-assignee">
                        <div className="task-card-avatar" title={task.assignee?.name || 'Unassigned'}>
                          {task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="task-card-name">{task.assignee?.name ? task.assignee.name.split(' ')[0] : 'Unassigned'}</span>
                      </div>

                      {task.dueDate && (
                        <span className="task-card-due" title="Due Date">
                          <FiCalendar size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Sliding Side Drawer for editing or creating task */}
      {isDrawerOpen && (
        <TaskSideDrawer
          taskId={selectedTaskId}
          isCreatingTask={isCreatingTask}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
};

export default TaskScreen;
