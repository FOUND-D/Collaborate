import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { FaArrowLeft, FaExpand, FaTimes } from 'react-icons/fa';
import io from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { listMessages, receiveSocketMessage } from '../actions/messageActions';
import { SOCKET_URL } from '../config/runtime';
import '../screens/ChatScreen.css';

const ChatPanel = ({ selectedChat, onClose, isDocked, onExpand }) => {
  const [initialLoading, setInitialLoading] = useState(false);
  const dispatch = useDispatch();
  const pollingRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!selectedChat) return undefined;

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
  }, [dispatch, selectedChat]);

  useEffect(() => {
    if (!selectedChat) return undefined;

    socketRef.current?.disconnect();
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinConversation', selectedChat.id);
    socketRef.current.on('newMessage', (message) => {
      dispatch(receiveSocketMessage(message));
    });

    return () => {
      socketRef.current?.emit('leaveConversation', selectedChat.id);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, selectedChat]);

  return (
    <div className="chat-panel-content">
      <div className="chat-panel-header">
        {isDocked && (
          <button className="chat-back-btn mobile-only" onClick={onClose}>
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

      <div className="chat-panel-body">
        <div className="chat-messages-wrapper">
          {initialLoading ? (
            <div className="chat-initial-loader">Loading messages...</div>
          ) : (
            <MessageList selectedChat={selectedChat} />
          )}
        </div>
        <MessageInput selectedChat={selectedChat} socketRef={socketRef} />
      </div>
    </div>
  );
};

export default ChatPanel;
