import React from 'react';
import { useSelector } from 'react-redux';
import { FaCheckDouble } from 'react-icons/fa';

const ChatMessage = ({ message }) => {
  const { userInfo } = useSelector((state) => state.userLogin);
  const isCurrentUser = message.sender._id === userInfo._id;
  const isRead = message.readBy.length > 1; // Read by at least one other person

  return (
    <div className={`message-container ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="message-content">
        {!isCurrentUser && <div className="sender-name">{message.sender.name}</div>}
        <p>{message.content}</p>
        <div className="message-timestamp">
          {new Date(message.createdAt).toLocaleTimeString()}
          {isCurrentUser && (
            <FaCheckDouble className={`read-receipt ${isRead ? 'read' : ''}`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;