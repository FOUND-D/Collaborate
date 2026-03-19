import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ChatSidebar from '../components/ChatSidebar';
import ChatPanel from '../components/ChatPanel';
import ChatPlaceholder from '../components/ChatPlaceholder';
import { listTeams } from '../actions/teamActions';
import './ChatScreen.css';

const ChatScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const teamList = useSelector((state) => state.teamList);
  const { teams } = teamList;

  useEffect(() => {
    dispatch(listTeams());
  }, [dispatch]);

  const selectedChat = useMemo(() => {
    if (!id || !teams) return null;

    // 1. Try finding a team
    const team = teams.find((t) => t._id === id);
    if (team) {
      return { type: 'team', id: team._id, name: team.name };
    }

    // 2. Try finding a DM user
    // Flatten members to search
    for (const t of teams) {
      if (t.members) {
        const member = t.members.find((m) => m._id === id);
        if (member) {
          return { type: 'conversation', id: member._id, name: member.name };
        }
      }
    }
    return null;
  }, [id, teams]);

  const handleSelectChat = (chat) => {
    navigate(`/chat/${chat.id}`);
  };

  return (
    <div className="chat-screen-container">
      {/* LEFT: Sidebar */}
      <div className="cp-sidebar-area">
        <ChatSidebar setSelectedChat={handleSelectChat} selectedChat={selectedChat} />
      </div>

      {/* RIGHT: Content */}
      <div className="cp-main-area">
        {selectedChat ? (
          <ChatPanel selectedChat={selectedChat} />
        ) : (
          <ChatPlaceholder />
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
