import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, ListGroup, Card, Button } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { getTeamDetails } from '../actions/teamActions';

const TeamDetailsScreen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const teamDetails = useSelector((state) => state.teamDetails);
  const { loading, error, team } = teamDetails;

  useEffect(() => {
    dispatch(getTeamDetails(id));
  }, [dispatch, id]);

  return (
    <div>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <Link to="/teams" className="btn btn-light my-3">
            Go Back
          </Link>
          <Row>
            <Col md={12}>
              <Card>
                <Card.Header as="h2">{team.name}</Card.Header>
                <Card.Body>
                  <Card.Text>
                    <strong>Team ID:</strong> {team._id}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="ml-2"
                      onClick={() => navigator.clipboard.writeText(team._id)}
                    >
                      Copy ID
                    </Button>
                  </Card.Text>
                  <Card.Title>Members</Card.Title>
                  <ListGroup variant="flush">
                    {team.members && team.members.map((member) => (
                      <ListGroup.Item key={member._id}>
                        {member.name}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col md={12}>
              <Card>
                <Card.Body>
                  <Card.Title>Ongoing Projects</Card.Title>
                  <ListGroup variant="flush">
                    {team.projects && team.projects.map((project) => (
                      <ListGroup.Item key={project._id}>
                        <Link to={`/project/${project._id}`}>{project.name}</Link>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default TeamDetailsScreen;
