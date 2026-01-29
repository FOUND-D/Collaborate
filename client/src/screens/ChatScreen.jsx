import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ChatSidebar from '../components/ChatSidebar';
import ChatPanel from '../components/ChatPanel';

import './ChatScreen.css';


const ChatScreen = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  return (

    <div className="chat-screen">

      {/* LEFT: List */}
      <ChatSidebar />

      {/* RIGHT: Chat (Only when id exists) */}
      {id && (
        <ChatPanel
          chatId={id}
          onBack={() => navigate('/chat')}
        />
      )}

    </div>
  );
};

export default ChatScreen;
