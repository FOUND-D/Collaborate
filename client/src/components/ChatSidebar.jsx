import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import Loader from './Loader';
import './ChatSidebar.css';

const ChatSidebar = ({ setSelectedChat, selectedChat, refreshKey }) => {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all');

  // DM conversations (only people with whom messages were exchanged)
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(false);

  const teamList = useSelector((state) => state.teamList || {});
  const { loading: loadingTeams, teams = [] } = teamList;
  const { userInfo } = useSelector((state) => state.userLogin || {});

  const fetchConversations = useCallback(async () => {
    setLoadingConvos(true);
    try {
      const { data } = await api.get('/api/messages/conversations');
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, refreshKey]);

  // Re-fetch conversations list after a message is sent
  // Poll lightly every 10s so new DMs from others appear
  useEffect(() => {
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  /* =========================
      FILTER
  ========================= */
  const filteredTeams = useMemo(() => {
    if (!search) return teams;
    return teams.filter(t =>
      t.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [teams, search]);

  const filteredConvos = useMemo(() => {
    if (!search) return conversations;
    return conversations.filter(c =>
      c.otherParticipant?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.otherParticipant?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.otherParticipant?.department?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  /* =========================
      HELPERS
  ========================= */
  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const isActive = (type, id) =>
    selectedChat?.type === type && selectedChat?.id === id;

  const formatLastMsg = (lastMessage, currentUserId) => {
    if (!lastMessage) return '';
    const isMine = lastMessage.senderId === (userInfo?._id || userInfo?.id);
    const prefix = isMine ? 'You: ' : '';
    const text = lastMessage.content || '';
    return prefix + (text.length > 32 ? text.slice(0, 32) + '…' : text);
  };

  return (
    <aside className="chat-sidebar">

      {/* HEADER */}
      <div className="cs-header">
        <div className="cs-brand">
          <div className="cs-logo">C</div>
          <div>
            <h3>Messages</h3>
            <span>Your conversations</span>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="cs-search">
        <input
          type="text"
          placeholder="Search people or teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="cs-tabs">
        <div className={`tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>All</div>
        <div className={`tab ${view === 'teams' ? 'active' : ''}`} onClick={() => setView('teams')}>Teams</div>
        <div className={`tab ${view === 'dm' ? 'active' : ''}`} onClick={() => setView('dm')}>Direct</div>
      </div>

      {/* BODY */}
      <div className="cs-body">

        {/* TEAMS */}
        {(view === 'all' || view === 'teams') && (
          <section>
            <p className="cs-title">Team Chats</p>
            {loadingTeams ? <Loader /> :
              filteredTeams.length === 0 ?
                <div className="cs-empty">{search ? 'No teams match' : 'No teams joined'}</div>
                :
                filteredTeams.map(team => (
                  <div
                    key={team._id}
                    className={`cs-item ${isActive('team', team._id) ? 'cs-item--active' : ''}`}
                    onClick={() => setSelectedChat({ type: 'team', id: team._id, name: team.name })}
                  >
                    <div className="cs-avatar cs-avatar--team">
                      {initials(team.name)}
                    </div>
                    <div className="cs-info">
                      <h4>{team.name}</h4>
                      <p>{team.members?.length || 0} members</p>
                    </div>
                  </div>
                ))
            }
          </section>
        )}

        {/* DIRECT MESSAGES — only existing conversations */}
        {(view === 'all' || view === 'dm') && (
          <section>
            <p className="cs-title">Direct Messages</p>
            {loadingConvos ? <Loader /> :
              filteredConvos.length === 0 ?
                <div className="cs-empty">
                  {search ? 'No conversations match' : 'No conversations yet. Go to a user\'s profile and click "Send Message" to start one.'}
                </div>
                :
                filteredConvos.map(convo => {
                  const other = convo.otherParticipant;
                  if (!other) return null; // skip if participant data missing
                  const uid = other._id || other.id;
                  if (!uid) return null;

                  return (
                    <div
                      key={convo.conversationId}
                      className={`cs-item ${isActive('conversation', uid) ? 'cs-item--active' : ''}`}
                      onClick={() => setSelectedChat({
                        type: 'conversation',
                        id: uid,
                        name: other?.name || 'Unknown',
                      })}
                    >
                      {other?.profileImage ? (
                        <img
                          src={other.profileImage}
                          alt={other.name}
                          className="cs-avatar cs-avatar--img"
                        />
                      ) : (
                        <div className="cs-avatar">{initials(other?.name || '?')}</div>
                      )}
                      <div className="cs-info">
                        <h4>{other?.name}</h4>
                        <p className="cs-last-msg">
                          {formatLastMsg(convo.lastMessage, userInfo?._id || userInfo?.id)}
                        </p>
                      </div>
                    </div>
                  );
                })
            }
          </section>
        )}

      </div>
    </aside>
  );
};

export default ChatSidebar;
