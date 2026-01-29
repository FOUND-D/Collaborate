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
  const [initialLoading, setInitialLoading] = useState(true);

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
      <div className="chat-panel-header">
        {selectedChat && (
          <button className="chat-back-btn" onClick={handleBack}>
            <FaArrowLeft />
          </button>
        )}
        <span>{!selectedChat ? 'Chat' : selectedChat.name}</span>
        <button className="chat-panel-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {!selectedChat ? (
        <ChatSidebar
          setSelectedChat={setSelectedChat}
          selectedChat={selectedChat}
        />
      ) : (
        <div className="chat-view">
          <div className="chat-main-area">
            {initialLoading ? (
              <div className="chat-initial-loader">Loading messages...</div>
            ) : (
              <MessageList selectedChat={selectedChat} />
            )}
          </div>
          {!initialLoading && <MessageInput selectedChat={selectedChat} />}
        </div>
      )}
    </div>
  );
};

export default ChatPanel;