import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listMessages, markMessagesAsRead } from '../actions/messageActions';
import ChatMessage from './ChatMessage';
import Loader from './Loader';

const MessageList = ({ selectedChat }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);

  const messageList = useSelector((state) => state.messageList);
  const { loading, error, messages = [] } = messageList || {}; // Default to empty object and empty array

  const userLogin = useSelector((state) => state.userLogin);
  const userInfo = userLogin?.userInfo;

  // Scroll to bottom and mark as read
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (messages && messages.length > 0 && userInfo) {
      const unreadMessages = messages
        .filter((msg) => msg.readBy && !msg.readBy.includes(userInfo._id))
        .map((msg) => msg._id);

      if (unreadMessages.length > 0) {
        dispatch(markMessagesAsRead(unreadMessages));
      }
    }
  }, [messages, dispatch, userInfo]);

  return (
    <div className="message-list">
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {!messages || messages.length === 0 ? (
            <div className="empty-chat-message">
              <h3>No messages yet. Start the conversation!</h3>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg._id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList;
