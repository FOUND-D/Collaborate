import React, { useEffect } from 'react';
import './TaskScreen.css';

import { LinkContainer } from 'react-router-bootstrap';

import { Button } from 'react-bootstrap';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Message from '../components/Message';
import Loader from '../components/Loader';

import { listTasks, deleteTask } from '../actions/taskActions';
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

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;


  /* ===============================
     EFFECT
  =============================== */

  useEffect(() => {

    if (!userInfo) {
      navigate('/login');
    }

    if (successDelete) {

      dispatch({ type: TASK_DELETE_SUCCESS });
      dispatch(listTasks());

    } else {

      dispatch(listTasks());
    }

  }, [dispatch, navigate, userInfo, successDelete]);


  /* ===============================
     HANDLERS
  =============================== */

  const createTaskHandler = () => {
    navigate('/task/create');
  };


  const deleteHandler = (id) => {

    if (window.confirm('Delete this task permanently?')) {
      dispatch(deleteTask(id));
    }
  };


  /* ===============================
     STATUS CLASS
  =============================== */

  const getStatusClass = (status) => {

    if (!status) return '';

    switch (status.toLowerCase()) {

      case 'completed':
        return 'completed';

      case 'pending':
        return 'pending';

      case 'inprogress':
      case 'in-progress':
        return 'inprogress';

      default:
        return '';
    }
  };


  /* ===============================
     RENDER
  =============================== */

  return (

    <div className="task-page">


      {/* Header */}

      <div className="task-header">

        <h1>Tasks</h1>

        <button
          className="create-task-btn"
          onClick={createTaskHandler}
        >
          <i className="fas fa-plus"></i> Create Task
        </button>

      </div>


      {/* Loading / Errors */}

      {loadingDelete && <Loader />}
      {errorDelete && <Message variant="danger">{errorDelete}</Message>}

      {loading ? (

        <Loader />

      ) : error ? (

        <Message variant="danger">{error}</Message>

      ) : (


        /* Table Wrapper */

        <div className="task-table-wrapper">


          <table className="task-table">


            {/* Head */}

            <thead>

              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th></th>
              </tr>

            </thead>


            {/* Body */}

            <tbody>

              {tasks.map((task) => (

                <tr key={task._id}>


                  {/* ID */}

                  <td className="task-id">
                    {task._id}
                  </td>


                  {/* Title */}

                  <td className="task-title">
                    {task.name}
                  </td>


                  {/* Status */}

                  <td>

                    <span
                      className={`task-status ${getStatusClass(task.status)}`}
                    >
                      {task.status}
                    </span>

                  </td>


                  {/* Assignee */}

                  <td className="task-assignee">

                    {task.assignee
                      ? task.assignee.name
                      : 'Unassigned'}

                  </td>


                  {/* Actions */}

                  <td>


                    <LinkContainer to={`/task/${task._id}/edit`}>

                      <button className="task-action-btn">

                        <i className="fas fa-edit"></i>

                      </button>

                    </LinkContainer>


                    {userInfo && task.owner === userInfo._id && (

                      <button
                        className="task-action-btn danger"
                        onClick={() => deleteHandler(task._id)}
                      >

                        <i className="fas fa-trash"></i>

                      </button>

                    )}

                  </td>


                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
};

export default TaskScreen;
