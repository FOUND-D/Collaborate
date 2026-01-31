import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listMessages, markMessagesAsRead } from '../actions/messageActions';
import ChatMessage from './ChatMessage';
import Loader from './Loader';

const MessageList = ({ selectedChat }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);

  const messageList = useSelector((state) => state.messageList);
  const { loading, error, messages } = messageList;

  const { userInfo } = useSelector((state) => state.userLogin);

  useEffect(() => {
    if (selectedChat) {
      dispatch(listMessages(selectedChat.type, selectedChat.id));
    }
  }, [dispatch, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (messages.length > 0) {
      const unreadMessages = messages
        .filter((msg) => !msg.readBy.includes(userInfo._id))
        .map((msg) => msg._id);

      if (unreadMessages.length > 0) {
        dispatch(markMessagesAsRead(unreadMessages));
      }
    }
  }, [messages, dispatch, userInfo._id]);

  return (
    <div className="message-list">
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {messages.length === 0 ? (
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
