import React, { useState, useEffect } from 'react';
import './TaskSideDrawer.css';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, getTaskDetails, createTask } from '../actions/taskActions';
import { TASK_UPDATE_RESET, TASK_CREATE_RESET } from '../constants/taskConstants';
import Loader from './Loader';
import Message from './Message';
import { FaTimes } from 'react-icons/fa';

const TaskSideDrawer = ({ taskId, projectId, isCreatingTask, onClose }) => {
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('Medium'); // Default priority

  const taskDetails = useSelector((state) => state.taskDetails);
  const { loading, error, task } = taskDetails;

  const taskUpdate = useSelector((state) => state.taskUpdate);
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = taskUpdate;

  const taskCreate = useSelector((state) => state.taskCreate);
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
  } = taskCreate;

  useEffect(() => {
    if (isCreatingTask) {
      // Reset form fields for new task creation
      setName('');
      setDescription('');
      setStatus('To Do');
      setDueDate('');
      setAssignee('');
      setPriority('Medium');
      dispatch({ type: TASK_CREATE_RESET }); // Clear any previous create status
    } else {
      if (successUpdate) {
        dispatch({ type: TASK_UPDATE_RESET });
        onClose(); // Close drawer on successful update
      } else if (taskId && (!task || task._id !== taskId)) {
        dispatch(getTaskDetails(taskId));
      } else if (task) {
        // Populate fields for editing
        setName(task.name || '');
        setDescription(task.description || '');
        setStatus(task.status || 'To Do');
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setAssignee(task.assignee ? task.assignee._id : '');
        setPriority(task.priority || 'Medium');
      }
    }
  }, [dispatch, taskId, task, successUpdate, isCreatingTask, onClose]);

  useEffect(() => {
    if (successCreate) {
      dispatch({ type: TASK_CREATE_RESET });
      onClose(); // Close drawer on successful creation
    }
  }, [successCreate, dispatch, onClose]);


  const submitHandler = (e) => {
    e.preventDefault();
    const taskData = {
      name,
      description,
      status,
      dueDate,
      assignee,
      priority,
      project: projectId, // Associate task with the current project
    };

    if (isCreatingTask) {
      dispatch(createTask(taskData));
    } else {
      dispatch(updateTask({ ...taskData, _id: taskId }));
    }
  };

  return (
    <div className="side-drawer-overlay">
      <div className="side-drawer-content">
        <div className="side-drawer-header">
          <h2 className="drawer-title">{isCreatingTask ? 'Create New Task' : 'Edit Task'}</h2>
          <button className="btn-icon drawer-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="side-drawer-body">
          {(loadingUpdate || loadingCreate) && <Loader />}
          {(errorUpdate || errorCreate) && <Message variant='danger'>{errorUpdate || errorCreate}</Message>}
          {loading && !isCreatingTask ? (
            <Loader />
          ) : error && !isCreatingTask ? (
            <Message variant='danger'>{error}</Message>
          ) : (
            <form onSubmit={submitHandler} className="drawer-form">
              <div className="form-group floating-label">
                <input
                  type="text"
                  id="taskName"
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
                <label htmlFor="taskName">Task Name</label>
              </div>

              <div className="form-group floating-label">
                <textarea
                  id="description"
                  placeholder=" "
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  rows={3}
                ></textarea>
                <label htmlFor="description">Description</label>
              </div>

              <div className="form-group floating-label">
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
                <label htmlFor="status">Status</label>
              </div>

              <div className="form-group floating-label">
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="form-input"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                <label htmlFor="priority">Priority</label>
              </div>

              <div className="form-group floating-label">
                <input
                  type="date"
                  id="dueDate"
                  placeholder=" "
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="form-input"
                />
                <label htmlFor="dueDate">Due Date</label>
              </div>

              {/* Assignee selection needs to fetch users, for now keeping it simple */}
              <div className="form-group floating-label">
                <input
                  type="text"
                  id="assignee"
                  placeholder="Assignee ID (future: dropdown)"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="form-input"
                />
                <label htmlFor="assignee">Assignee</label>
              </div>

              <button type="submit" className="btn btn-primary btn-full-width">
                {isCreatingTask ? 'Create Task' : 'Update Task'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskSideDrawer;
