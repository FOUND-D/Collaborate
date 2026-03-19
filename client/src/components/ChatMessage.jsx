import React from 'react';
import { useSelector } from 'react-redux';
import { FaCheckDouble } from 'react-icons/fa';

const ChatMessage = ({ message }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const userInfo = userLogin?.userInfo;

  // Safety checks
  if (!message || !userInfo) return null;

  const senderId = message.sender?._id || message.sender; // Handle populated vs unpopulated
  const isCurrentUser = senderId === userInfo._id;
  const isRead = message.readBy?.length > 1;

  // Start Of Message Name Logic
  const senderName = message.sender?.name || 'Unknown';

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