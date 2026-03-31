import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { createTask, getTaskDetails, updateTask } from '../actions/taskActions';
import { TASK_CREATE_RESET, TASK_UPDATE_RESET } from '../constants/taskConstants';
import { listProjects } from '../actions/projectActions';

const TaskForm = ({ task, isEditMode, projects, onSubmit }) => {
  const [name, setName] = useState(() => (isEditMode ? task?.name || '' : ''));
  const [description, setDescription] = useState(() => (isEditMode ? task?.description || '' : ''));
  const [status, setStatus] = useState(() => (isEditMode ? task?.status || 'To Do' : 'To Do'));
  const [priority, setPriority] = useState(() => (isEditMode ? task?.priority || 'Medium' : 'Medium'));
  const [dueDate, setDueDate] = useState(() => (
    isEditMode
      ? (task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
      : ''
  ));
  const [duration, setDuration] = useState(() => (isEditMode ? (task?.duration || 0) : 0));
  const [assignee, setAssignee] = useState(() => (isEditMode ? task?.assignee?._id || '' : ''));
  const [projectId, setProjectId] = useState(() => (isEditMode ? task?.project || '' : ''));

  const submitHandler = (e) => {
    e.preventDefault();
    onSubmit({
      _id: task?._id,
      name,
      description,
      status,
      priority,
      dueDate,
      duration: Number(duration),
      ...(assignee && { assignee }),
      ...(projectId && { project: projectId }),
    });
  };

  return (
    <form onSubmit={submitHandler}>
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Task Name</label>
        <input
          type="text"
          className="form-input"
          style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-small)', border: '1px solid var(--border-color)', background: 'var(--background-tertiary-inputs)', color: 'var(--text-primary)' }}
          placeholder="Enter task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
        <textarea
          className="form-input"
          style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-small)', border: '1px solid var(--border-color)', background: 'var(--background-tertiary-inputs)', color: 'var(--text-primary)' }}
          placeholder="Enter description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Duration (Hrs)</label>
        <input
          type="number"
          className="form-input"
          style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-small)', border: '1px solid var(--border-color)', background: 'var(--background-tertiary-inputs)', color: 'var(--text-primary)' }}
          placeholder="Estimated hours"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="0"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
          <select
            style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-small)', border: '1px solid var(--border-color)', background: 'var(--background-tertiary-inputs)', color: 'var(--text-primary)' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Priority</label>
          <select
            style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-small)', border: '1px solid var(--border-color)', background: 'var(--background-tertiary-inputs)', color: 'var(--text-primary)' }}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Project (Optional)</label>
        <select
          style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-small)', border: '1px solid var(--border-color)', background: 'var(--background-tertiary-inputs)', color: 'var(--text-primary)' }}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">No Project</option>
          {projects && projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Due Date</label>
          <input
            type="date"
            style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-small)', border: '1px solid var(--border-color)', background: 'var(--background-tertiary-inputs)', color: 'var(--text-primary)' }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assignee</label>
          <input
            type="text"
            style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-small)', border: '1px solid var(--border-color)', background: 'var(--background-tertiary-inputs)', color: 'var(--text-primary)' }}
            placeholder="Assignee ID"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="btn-gradient" style={{ width: '100%', justifyContent: 'center' }}>
        <FaSave style={{ marginRight: '8px' }} /> {isEditMode ? 'Update Task' : 'Create Task'}
      </button>
    </form>
  );
};

const TaskEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isEditMode = !!id;

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

  const projectList = useSelector((state) => state.projectList);
  const { projects } = projectList;

  useEffect(() => {
    dispatch(listProjects());
  }, [dispatch]);

  useEffect(() => {
    if (successCreate) {
      dispatch({ type: TASK_CREATE_RESET });
      navigate('/tasks');
    }
    if (successUpdate) {
      dispatch({ type: TASK_UPDATE_RESET });
      navigate('/tasks');
    }
  }, [dispatch, navigate, successCreate, successUpdate]);

  useEffect(() => {
    if (isEditMode && (!task || task._id !== id)) {
      dispatch(getTaskDetails(id));
    }
  }, [dispatch, id, task, isEditMode]);

  const submitHandler = (taskData) => {
    const payload = { ...taskData, _id: id };

    if (isEditMode) {
      dispatch(updateTask(payload));
    } else {
      dispatch(createTask(taskData));
    }
  };

  const isLoading = loading || loadingCreate || loadingUpdate;
  const isError = error || errorCreate || errorUpdate;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', color: 'var(--text-primary)' }}>
      <Link to="/tasks" className="btn btn-tertiary" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaArrowLeft /> Back to Tasks
      </Link>

      <div style={{
        background: 'var(--background-secondary-cards)',
        padding: '2rem',
        borderRadius: 'var(--radius-large)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <h1 style={{ marginBottom: '1.5rem' }}>{isEditMode ? 'Edit Task' : 'Create New Task'}</h1>

        {isLoading && <Loader />}
        {isError && <Message variant="danger">{isError}</Message>}

        {!isLoading && !isError && (!isEditMode || task) && (
          <TaskForm
            key={isEditMode ? task?._id || id : 'create'}
            task={task}
            isEditMode={isEditMode}
            projects={projects}
            onSubmit={submitHandler}
          />
        )}
      </div>
    </div>
  );
};

export default TaskEditScreen;
