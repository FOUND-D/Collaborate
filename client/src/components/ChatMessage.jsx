import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaCheckDouble, FaClock, FaCoins, FaGraduationCap } from 'react-icons/fa';
import { createSession } from '../actions/sessionActions';

const ChatMessage = ({ message }) => {
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const userInfo = userLogin?.userInfo;
  const [decision, setDecision] = useState('');

  // Safety checks
  if (!message || !userInfo) return null;

  const senderId = message.sender?._id || message.sender; // Handle populated vs unpopulated
  const isCurrentUser = senderId === userInfo._id;
  const isRead = message.readBy?.length > 1;

  // Start Of Message Name Logic
  const senderName = message.sender?.name || 'Unknown';
  const requestPayload = message.sessionRequest;

  const acceptSessionRequest = async () => {
    if (!requestPayload?.listing_id || !requestPayload?.proposed_time) return;
    const created = await dispatch(createSession({
      listingId: requestPayload.listing_id,
      scheduledAt: requestPayload.proposed_time,
      agenda: `Session request accepted for ${requestPayload.skill || 'skill exchange'}`,
    }));

    if (created) {
      setDecision('accepted');
    }
  };

  if (message.type === 'session_request' && requestPayload) {
    return (
      <div className={`message-container ${isCurrentUser ? 'current-user' : ''}`}>
        <div className="message-content session-request-card">
          {!isCurrentUser && <div className="sender-name">{senderName}</div>}
          <div className="session-request-header">
            <span className="session-request-pill"><FaGraduationCap /> Session Request</span>
          </div>
          <h4>{requestPayload.skill}</h4>
          <div className="session-request-meta">
            <span><FaClock /> {new Date(requestPayload.proposed_time).toLocaleString()}</span>
            <span><FaCoins /> {requestPayload.credits} credits</span>
          </div>
          <p>{message.content}</p>
          {!isCurrentUser && (
            <div className="session-request-actions">
              <button
                type="button"
                className="session-request-btn accept"
                onClick={acceptSessionRequest}
                disabled={decision === 'accepted'}
              >
                {decision === 'accepted' ? 'Accepted' : 'Accept'}
              </button>
              <button
                type="button"
                className="session-request-btn decline"
                onClick={() => setDecision('declined')}
                disabled={decision === 'accepted'}
              >
                {decision === 'declined' ? 'Declined' : 'Decline'}
              </button>
            </div>
          )}
          <div className="message-timestamp">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message-container ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="message-content">
        {!isCurrentUser && <div className="sender-name">{senderName}</div>}
        <p>{message.content}</p>
        <div className="message-timestamp">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isCurrentUser && (
            <FaCheckDouble className={`read-receipt ${isRead ? 'read' : ''}`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
