import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaArrowLeft, FaExpand, FaTimes, FaStar, FaFolderOpen, FaBell, FaBellSlash, FaBan } from 'react-icons/fa';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { listMessages, receiveSocketMessage } from '../actions/messageActions';
import { MESSAGE_LIST_RESET } from '../constants/messageConstants';
import { createSocketConnection } from '../utils/socket';
import api from '../utils/api';
import '../screens/ChatScreen.css';

const ChatPanel = ({ selectedChat, onClose, isDocked, onExpand, onMessageSent }) => {
  const [initialLoading, setInitialLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [convoSettings, setConvoSettings] = useState({
    is_starred: false,
    is_archived: false,
    is_muted: false,
    is_blocked: false,
    is_blocked_by_other: false,
  });
  const dispatch = useDispatch();
  const pollingRef = useRef(null);
  const socketRef = useRef(null);

  const { userInfo } = useSelector((state) => state.userLogin);

  // Fetch settings when chat is selected
  useEffect(() => {
    if (!selectedChat || selectedChat.type !== 'conversation') {
      setConvoSettings({
        is_starred: false,
        is_archived: false,
        is_muted: false,
        is_blocked: false,
        is_blocked_by_other: false,
      });
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data } = await api.get(`/api/messages/conversation/${selectedChat.id}/settings`);
        setConvoSettings(data);
      } catch (err) {
        console.error('Failed to load conversation settings:', err);
      }
    };

    fetchSettings();
  }, [selectedChat]);

  const updateSetting = async (key, val) => {
    try {
      const payload = {
        isStarred: key === 'is_starred' ? val : convoSettings.is_starred,
        isArchived: key === 'is_archived' ? val : convoSettings.is_archived,
        isMuted: key === 'is_muted' ? val : convoSettings.is_muted,
        isBlocked: key === 'is_blocked' ? val : convoSettings.is_blocked,
      };
      const { data } = await api.put(`/api/messages/conversation/${selectedChat.id}/settings`, payload);
      setConvoSettings(prev => ({
        ...prev,
        is_starred: data.is_starred,
        is_archived: data.is_archived,
        is_muted: data.is_muted,
        is_blocked: data.is_blocked,
      }));
    } catch (err) {
      console.error(`Failed to update setting ${key}:`, err);
    }
  };

  const toggleStar = () => updateSetting('is_starred', !convoSettings.is_starred);
  const toggleArchive = () => updateSetting('is_archived', !convoSettings.is_archived);
  const toggleMute = () => updateSetting('is_muted', !convoSettings.is_muted);
  const toggleBlock = () => updateSetting('is_blocked', !convoSettings.is_blocked);

  useEffect(() => {
    if (!selectedChat) return undefined;

    // Clear stale messages from the previous chat
    dispatch({ type: MESSAGE_LIST_RESET });

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

    setTypingUsers({});
    socketRef.current?.disconnect();
    
    // Pass user auth token to connection for secure production grade chat
    socketRef.current = createSocketConnection();

    socketRef.current.emit('joinConversation', selectedChat.id);
    
    socketRef.current.on('newMessage', (message) => {
      dispatch(receiveSocketMessage(message));
    });

    socketRef.current.on('typing', ({ userId, name }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: name }));
    });

    socketRef.current.on('stopTyping', ({ userId }) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
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

        <div className="chat-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedChat && selectedChat.type === 'conversation' && (
            <div className="chat-settings-actions" style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
              <button 
                className="chat-panel-action-btn"
                style={{ color: convoSettings.is_starred ? '#f59e0b' : 'var(--text-muted)' }}
                onClick={toggleStar}
                title={convoSettings.is_starred ? 'Unstar conversation' : 'Star conversation'}
              >
                <FaStar />
              </button>
              <button 
                className="chat-panel-action-btn"
                style={{ color: convoSettings.is_archived ? 'var(--accent-color)' : 'var(--text-muted)' }}
                onClick={toggleArchive}
                title={convoSettings.is_archived ? 'Unarchive conversation' : 'Archive conversation'}
              >
                <FaFolderOpen />
              </button>
              <button 
                className="chat-panel-action-btn"
                style={{ color: convoSettings.is_muted ? 'var(--accent-color)' : 'var(--text-muted)' }}
                onClick={toggleMute}
                title={convoSettings.is_muted ? 'Unmute' : 'Mute'}
              >
                {convoSettings.is_muted ? <FaBellSlash /> : <FaBell />}
              </button>
              <button 
                className="chat-panel-action-btn"
                style={{ color: convoSettings.is_blocked ? '#ef4444' : 'var(--text-muted)' }}
                onClick={toggleBlock}
                title={convoSettings.is_blocked ? 'Unblock user' : 'Block user'}
              >
                <FaBan />
              </button>
            </div>
          )}
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
          {Object.keys(typingUsers).length > 0 && (
            <div className="chat-typing-indicator-bar" style={{ padding: '4px 16px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="typing-dot-animation" style={{ display: 'inline-flex', gap: '3px' }}>
                <span className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite alternate' }} />
                <span className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite alternate 0.2s' }} />
                <span className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite alternate 0.4s' }} />
              </span>
              <span>{Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          )}
        </div>
        {convoSettings.is_blocked ? (
          <div className="chat-blocked-message" style={{ padding: '16px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderTop: '1px solid var(--border-color)', fontWeight: '600', fontSize: '13px' }}>
            This user is blocked. Unblock the user to resume chatting.
          </div>
        ) : convoSettings.is_blocked_by_other ? (
          <div className="chat-blocked-message" style={{ padding: '16px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderTop: '1px solid var(--border-color)', fontWeight: '600', fontSize: '13px' }}>
            You cannot send messages to this user.
          </div>
        ) : (
          <MessageInput selectedChat={selectedChat} socketRef={socketRef} onMessageSent={onMessageSent} />
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
