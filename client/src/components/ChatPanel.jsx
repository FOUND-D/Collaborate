import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { FaArrowLeft, FaTimes, FaExpand } from 'react-icons/fa';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { listMessages } from '../actions/messageActions';
import '../screens/ChatScreen.css';

const ChatPanel = ({ selectedChat, onClose, isDocked, onExpand }) => {
  const [initialLoading, setInitialLoading] = useState(false);

  const dispatch = useDispatch();
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!selectedChat) return;

    const loadInitial = async () => {
      setInitialLoading(true);
      await dispatch(listMessages(selectedChat.type, selectedChat.id));
      setInitialLoading(false);
    };

    loadInitial();

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      dispatch(listMessages(selectedChat.type, selectedChat.id, true));
    }, 4000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [selectedChat, dispatch]);

  const handleBack = () => {
    setSelectedChat(null);
  };

  return (
    <div className="chat-panel-content">
      {/* HEADER */}
      <div className="chat-panel-header">
        {isDocked && (
          <button className="chat-back-btn mobile-only" onClick={onClose} /* Using onClose as back for mobile/docked context if needed */>
            <FaArrowLeft />
          </button>
        )}

        <div className="chat-header-info">
          <h3>{selectedChat ? selectedChat.name : 'Chat'}</h3>
          {selectedChat && <span>{selectedChat.type === 'team' ? 'Team Chat' : 'Direct Message'}</span>}
        </div>

        <div className="chat-header-actions">
          {isDocked && onExpand && (
            <button className="chat-panel-action-btn" onClick={onExpand} title="Open Full Screen">
              <FaExpand />
            </button>
          )}
          {isDocked && (
            <button className="chat-panel-close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="chat-panel-body">
        <div className="chat-messages-wrapper">
          {initialLoading ? (
            <div className="chat-initial-loader">Loading messages...</div>
          ) : (
            <MessageList selectedChat={selectedChat} />
          )}
        </div>
        <MessageInput selectedChat={selectedChat} />
      </div>
    </div>
  );
};

export default ChatPanel;
