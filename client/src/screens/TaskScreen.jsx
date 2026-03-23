import React, { useEffect } from 'react';
import './TaskScreen.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaUser, FaClipboardList } from 'react-icons/fa';

import Message from '../components/Message';
import Loader from '../components/Loader';

import { listTasks, deleteTask, updateTask } from '../actions/taskActions';
import { TASK_DELETE_SUCCESS } from '../constants/taskConstants';


const TaskScreen = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();


  /* ===============================
     REDUX STATE
  =============================== */

  const taskList = useSelector((state) => state.taskList);
  const { loading, error, tasks } = taskList;

  const taskDelete = useSelector((state) => state.taskDelete);
  const {
    loading: loadingDelete,
    error: errorDelete,
    success: successDelete,
  } = taskDelete;

  const taskUpdate = useSelector((state) => state.taskUpdate);
  const { success: successUpdate } = taskUpdate;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;


  /* ===============================
     EFFECT
  =============================== */

  useEffect(() => {

    if (!userInfo) {
      navigate('/login');
    }

    if (successDelete || successUpdate) {
      if (successDelete) dispatch({ type: TASK_DELETE_SUCCESS });
      dispatch(listTasks());
    } else {
      dispatch(listTasks());
    }

  }, [dispatch, navigate, userInfo, successDelete, successUpdate]);


  /* ===============================
     HANDLERS
  =============================== */



  const deleteHandler = (id) => {
    if (window.confirm('Delete this task permanently?')) {
      dispatch(deleteTask(id));
    }
  };

  const handleTaskCheck = (task) => {
    const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    dispatch(updateTask({ ...task, status: newStatus }));
  };


  /* ===============================
     STATUS CLASS
  =============================== */

  const getStatusClass = (status) => {
    if (!status) return 'pending';
    switch (status.toLowerCase()) {
      case 'completed': return 'completed';
      case 'in progress':
      case 'inprogress': return 'inprogress';
      case 'blocked': return 'blocked';
      default: return 'pending';
    }
  };


  /* ===============================
     STATE: FILTER
  =============================== */
  const [activeFilter, setActiveFilter] = React.useState('All');

  const filterOptions = ['All', 'To Do', 'In Progress', 'Completed', 'Blocked'];

  const filteredTasks = tasks ? tasks.filter(task => {
    if (activeFilter === 'All') return true;
    return task.status && task.status.toLowerCase().replace(' ', '') === activeFilter.toLowerCase().replace(' ', '');
  }) : [];


  /* ===============================
     RENDER
  =============================== */

  return (
    <div className="task-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tasks</h1>
          <p>Manage all your tasks in one place.</p>
        </div>
        <Link to="/task/create" className="btn-create">
          <FaPlus /> Create Task
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="task-filters">
        {filterOptions.map(option => (
          <button
            key={option}
            className={`task-filter-btn ${activeFilter === option ? 'active' : ''}`}
            onClick={() => setActiveFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Loading / Errors */}
      {loadingDelete && <Loader />}
      {errorDelete && <Message variant="danger">{errorDelete}</Message>}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        tasks && tasks.length === 0 ? (
          <div className="task-empty-state">
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
              padding: '1.5rem',
              borderRadius: '50%',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaClipboardList size={40} color="#34d399" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>No Tasks Yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
              Your task list is empty. Create a task to stay organized and keep track of your work.
            </p>
            <Link to="/task/create" className="btn-gradient" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <FaPlus /> Create Your First Task
            </Link>
          </div>
        ) : (
          filteredTasks.length === 0 ? (
            <div className="task-empty-state task-empty-state-compact">
              <p>No tasks found with status "{activeFilter}".</p>
            </div>
          ) : (
            <div className="modern-task-list">
              {filteredTasks.map((task) => (
                <div key={task._id} className="task-list-item">
                  <div className="task-checkbox-container">
                    <div
                      className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`}
                      onClick={() => handleTaskCheck(task)}
                    >
                      {task.status === 'Completed' && <FaCheck size="0.8em" />}
                    </div>
                  </div>

                  <div className="task-details-main" onClick={() => navigate(`/task/${task._id}/edit`)} style={{ cursor: 'pointer' }}>
                    <span className={`task-name ${task.status === 'Completed' ? 'completed' : ''}`}>
                      {task.name}
                    </span>
                    <div className="task-description">
                      {task.assignee ? (
                        <span className="task-assignee-meta">
                          <FaUser size="0.7em" /> {task.assignee.name}
                        </span>
                      ) : (
                        <span className="task-assignee-meta muted">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="task-metadata-group">
                    <span className={`task-status-pill ${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="task-actions-group">
                    <button className="task-action-btn" onClick={() => navigate(`/task/${task._id}/edit`)} title="Edit" type="button">
                      <FaEdit />
                    </button>
                    {userInfo && task.owner === userInfo._id && (
                      <button
                        className="task-action-btn"
                        onClick={() => deleteHandler(task._id)}
                        title="Delete"
                        type="button"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ))}
    </div>
  );
};

export default TaskScreen;
