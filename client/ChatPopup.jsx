import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaTimes } from 'react-icons/fa';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { listMessages } from '../actions/messageActions';
import './ChatPopup.css';
import io from 'socket.io-client';

let socket;

const ChatPopup = ({ team, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const dispatch = useDispatch();
  const messageListRef = useRef(null);

  const selectedChat = { type: 'team', id: team._id };

  useEffect(() => {
    // Initial message load
    dispatch(listMessages(selectedChat.type, selectedChat.id));

    // Setup socket connection
    socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3002');
    socket.emit('joinConversation', selectedChat.id);

    // Listen for new messages
    socket.on('newMessage', (message) => {
      // Logic to update messages in the store will be handled in messageActions
      dispatch({ type: 'MESSAGE_RECEIVE', payload: message });
    });

    // Clean up on unmount
    return () => {
      socket.emit('leaveConversation', selectedChat.id);
      socket.disconnect();
    };
  }, [dispatch, selectedChat.id]);

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
        <MessageList selectedChat={selectedChat} />
      </div>

      <div className="chat-popup-footer">
        <MessageInput selectedChat={selectedChat} socket={socket} />
      </div>
    </div>
  );
};

export default ChatPopup;
