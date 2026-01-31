import React from 'react';
import './FormContainer.css';
import { Container, Row, Col } from 'react-bootstrap';

const FormContainer = ({ children }) => {
  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col xs={12} md={8} className="form-container-custom"> {/* Increased width to md=8 */}
          <div className="form-wrapper-custom">
            {children}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default FormContainer;
