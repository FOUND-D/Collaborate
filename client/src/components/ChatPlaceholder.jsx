import React from 'react';
import '../screens/ChatScreen.css'; // Re-use styles
import { FaComments } from 'react-icons/fa';

const ChatPlaceholder = () => {
    return (
        <div className="chat-empty-state-container">
            <div className="empty-content">
                <div className="empty-emoji"><FaComments size={40} /></div>
                <h2>Collaborate Chat</h2>
                <p>Select a team or member from the sidebar to start a conversation.</p>
            </div>
        </div>
    );
};

export default ChatPlaceholder;
