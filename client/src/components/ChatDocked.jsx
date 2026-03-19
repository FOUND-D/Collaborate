import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaExpand } from 'react-icons/fa';
import ChatSidebar from './ChatSidebar';
import ChatPanel from './ChatPanel';
import ChatPlaceholder from './ChatPlaceholder';
import { listTeams } from '../actions/teamActions';
import '../screens/ChatScreen.css';

const ChatDocked = ({ onClose }) => {
    const [selectedChat, setSelectedChat] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(listTeams());
    }, [dispatch]);

    const handleExpand = () => {
        onClose(); // Close the drawer
        if (selectedChat) {
            navigate(`/chat/${selectedChat.id}`);
        } else {
            navigate('/chat');
        }
    };

    return (
        <div className="chat-docked-drawer">
            {/* Drawer Header (Only visible on list view to close the drawer) */}
            {!selectedChat && (
                <div className="docked-header">
                    <h3>Communications</h3>
                    <div className="docked-actions">
                        <button className="chat-drawer-action" onClick={handleExpand} title="Open Full Screen">
                            <FaExpand />
                        </button>
                        <button className="chat-drawer-close" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="docked-content">
                {!selectedChat ? (
                    <ChatSidebar
                        setSelectedChat={setSelectedChat}
                    />
                ) : (
                    <ChatPanel
                        selectedChat={selectedChat}
                        onClose={() => setSelectedChat(null)} /* Back to list */
                        isDocked={true}
                        onExpand={handleExpand}
                    />
                )}
            </div>
        </div>
    );
};

export default ChatDocked;
