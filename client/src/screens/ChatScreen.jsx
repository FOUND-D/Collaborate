import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ChatSidebar from '../components/ChatSidebar';
import ChatPanel from '../components/ChatPanel';
import ChatPlaceholder from '../components/ChatPlaceholder';
import { listTeams } from '../actions/teamActions';
import api from '../utils/api';
import './ChatScreen.css';

const ChatScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const teamList = useSelector((state) => state.teamList);
  const { teams } = teamList;

  const [externalUser, setExternalUser] = useState(null);
  // Bump this to tell ChatSidebar to re-fetch its conversation list
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  useEffect(() => {
    dispatch(listTeams());
  }, [dispatch]);

  useEffect(() => {
    if (!id || !teams) return;

    const team = teams.find((t) => t._id === id);
    if (team) { setExternalUser(null); return; }

    let found = false;
    for (const t of teams) {
      if (t.members) {
        const member = t.members.find((m) => m._id === id);
        if (member) { found = true; break; }
      }
    }
    if (found) { setExternalUser(null); return; }

    const fetchUser = async () => {
      if (!id || id === 'undefined') return;
      try {
        const { data } = await api.get(`/api/users/${id}`);
        if (data) {
          setExternalUser({ type: 'conversation', id: data.id || data._id, name: data.name });
        }
      } catch (err) {
        console.error('Failed to load user profile for chat:', err);
      }
    };
    fetchUser();
  }, [id, teams]);

  const selectedChat = (() => {
    if (!id || !teams) return null;

    const team = teams.find((t) => t._id === id);
    if (team) return { type: 'team', id: team._id, name: team.name };

    for (const t of teams) {
      if (t.members) {
        const member = t.members.find((m) => m._id === id);
        if (member) return { type: 'conversation', id: member._id, name: member.name };
      }
    }

    if (externalUser && externalUser.id === id) return externalUser;
    return null;
  })();

  const handleSelectChat = useCallback((chat) => {
    navigate(`/chat/${chat.id}`);
  }, [navigate]);

  // Called by ChatPanel after a new message is sent — updates sidebar list
  const handleMessageSent = useCallback(() => {
    setSidebarRefreshKey(k => k + 1);
  }, []);

  return (
    <div className="chat-screen-container">
      <div className="cp-sidebar-area">
        <ChatSidebar
          setSelectedChat={handleSelectChat}
          selectedChat={selectedChat}
          refreshKey={sidebarRefreshKey}
        />
      </div>
      <div className="cp-main-area">
        {selectedChat ? (
          <ChatPanel selectedChat={selectedChat} onMessageSent={handleMessageSent} />
        ) : (
          <ChatPlaceholder />
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
