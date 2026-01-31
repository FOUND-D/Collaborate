import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { sendMessage } from '../actions/messageActions';

const MessageInput = ({ selectedChat, socket }) => {
  const [content, setContent] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim() && selectedChat) {
      const messageData = { content };
      if (selectedChat.type === 'team') {
        messageData.teamId = selectedChat.id;
      } else {
        messageData.recipientId = selectedChat.id;
      }
      
      const newMessage = await dispatch(sendMessage(messageData));
      
      if (newMessage && socket) {
        socket.emit('newMessage', newMessage);
      }
      
      setContent('');
    }
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="message-input-field"
      />
      <button type="submit" className="message-input-send-btn">Send</button>
    </form>
  );
};

export default MessageInput;
