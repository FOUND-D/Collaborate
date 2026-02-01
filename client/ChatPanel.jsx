import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { listMessages } from '../actions/messageActions';
import { listTeams } from '../actions/teamActions';
import '../screens/ChatScreen.css';

const ChatPanel = ({ onClose, isDocked }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);

  const dispatch = useDispatch();
  const pollingRef = useRef(null);

  useEffect(() => {
    dispatch(listTeams());
  }, [dispatch]);

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
    <div className={`chat-screen-container chat-panel ${isDocked ? 'chat-panel-docked' : ''}`}>
      
      {/* 1. SIDEBAR AREA - Always Visible on Left */}
      <div className="cp-sidebar-area">
        <ChatSidebar
          setSelectedChat={setSelectedChat}
          selectedChat={selectedChat}
        />
      </div>

      {/* 2. MAIN CHAT AREA - Fills the Right Side */}
      <div className="cp-main-area">
        
        {/* Header (Now inside the right pane) */}
        <div className="chat-panel-header">
          {selectedChat && (
            <button className="chat-back-btn mobile-only" onClick={handleBack}>
              <FaArrowLeft />
            </button>
          )}
          
          <div className="chat-header-info">
             <h3>{!selectedChat ? 'Welcome' : selectedChat.name}</h3>
             {selectedChat && <span>{selectedChat.type === 'team' ? 'Team Chat' : 'Direct Message'}</span>}
          </div>

          <button className="chat-panel-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Content Body */}
        <div className="chat-panel-body">
          {!selectedChat ? (
            /* EMPTY STATE (Fills the void when no chat is active) */
            <div className="chat-empty-state">
              <div className="empty-icon">👋</div>
              <h3>Select a conversation</h3>
              <p>Choose a team or member from the sidebar to start chatting.</p>
            </div>
          ) : (
            /* ACTIVE CHAT VIEW */
            <>
              <div className="chat-messages-wrapper">
                {initialLoading ? (
                  <div className="chat-initial-loader">Loading messages...</div>
                ) : (
                  <MessageList selectedChat={selectedChat} />
                )}
              </div>
              <MessageInput selectedChat={selectedChat} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
