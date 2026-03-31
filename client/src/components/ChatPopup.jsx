import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { FaTimes } from 'react-icons/fa';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { listMessages } from '../actions/messageActions';
import './ChatPopup.css';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config/runtime';

const ChatPopup = ({ team, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const dispatch = useDispatch();
  const messageListRef = useRef(null);
  const socketRef = useRef(null);

  const selectedChatType = 'team';
  const selectedChatId = team._id;

  useEffect(() => {
    // Initial message load
    dispatch(listMessages(selectedChatType, selectedChatId));

    // Setup socket connection
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinConversation', selectedChatId);

    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      // Logic to update messages in the store will be handled in messageActions
      dispatch({ type: 'MESSAGE_RECEIVE', payload: message });
    });

    // Clean up on unmount
    return () => {
      socketRef.current?.emit('leaveConversation', selectedChatId);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, selectedChatId, selectedChatType]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      onClose();
    }
  };

  return (
    <div className={`chat-popup-container ${isOpen ? 'open' : 'closed'}`}>
      <div className="chat-popup-header" onClick={toggleChat}>
        <div className="chat-popup-header-info">
          {/* Placeholder Avatar */}
          <div className="chat-popup-avatar">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <span>{team.name}</span>
        </div>
        <div className="chat-popup-header-actions">
          <button onClick={onClose} className="chat-popup-close-btn">
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="chat-popup-body" ref={messageListRef}>
        <MessageList />
      </div>

      <div className="chat-popup-footer">
        <MessageInput selectedChat={{ type: selectedChatType, id: selectedChatId }} socketRef={socketRef} />
      </div>
    </div>
  );
};

export default ChatPopup;
