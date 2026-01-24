import React, { useEffect } from 'react';
import './TaskScreen.css';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message'; // Import Message
import Loader from '../components/Loader'; // Import Loader
import { listTasks, deleteTask } from '../actions/taskActions'; // Import deleteTask
import { TASK_DELETE_SUCCESS } from '../constants/taskConstants'; // Import TASK_DELETE_SUCCESS

const TaskScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const taskList = useSelector((state) => state.taskList);
  const { loading, error, tasks } = taskList;

  const taskDelete = useSelector((state) => state.taskDelete);
  const { loading: loadingDelete, error: errorDelete, success: successDelete } = taskDelete;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }

    if (successDelete) {
      dispatch({ type: TASK_DELETE_SUCCESS }); // Reset success state for delete
      dispatch(listTasks()); // Refresh task list after deletion
    } else {
      dispatch(listTasks());
    }
  }, [dispatch, navigate, userInfo, successDelete]);

  const createTaskHandler = () => {
    navigate('/task/create');
  };

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(id));
    }
  };

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>Tasks</h1>
        </Col>
        <Col className="text-right">
          <Button className="my-3" onClick={createTaskHandler}>
            <i className="fas fa-plus"></i> Create Task
          </Button>
        </Col>
      </Row>
      {loadingDelete && <Loader />}
      {errorDelete && <Message variant='danger'>{errorDelete}</Message>}
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>TITLE</th>
              <th>STATUS</th>
              <th>ASSIGNED TO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td>{task._id}</td>
                <td>{task.name}</td> {/* Assuming task.name for title */}
                <td>{task.status}</td>
                <td>{task.assignee ? task.assignee.name : 'Unassigned'}</td>
                <td>
                  <LinkContainer to={`/task/${task._id}/edit`}>
                    <Button variant="light" className="btn-sm">
                      <i className="fas fa-edit"></i>
                    </Button>
                  </LinkContainer>
                  {userInfo && task.owner === userInfo._id && (
                    <Button
                      variant="danger"
                      className="btn-sm ms-2"
                      onClick={() => deleteHandler(task._id)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default TaskScreen;
