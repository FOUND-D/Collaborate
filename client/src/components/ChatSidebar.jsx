import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

import Loader from './Loader';
import './ChatSidebar.css';

const ChatSidebar = ({ setSelectedChat }) => {

  const [search, setSearch] = useState('');
  const [view, setView] = useState('all');

  const teamList = useSelector((state) => state.teamList || {});
  const { loading, teams = [] } = teamList;


  /* =========================
      GET UNIQUE MEMBERS
  ========================= */
  const members = useMemo(() => {

    const map = new Map();

    teams.forEach(team => {
      (team.members || []).forEach(m => {
        if (!map.has(m._id)) {
          map.set(m._id, m);
        }
      });
    });

    return Array.from(map.values());

  }, [teams]);


  /* =========================
      FILTER
  ========================= */
  const filteredTeams = useMemo(() => {

    if (!search) return teams;

    return teams.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );

  }, [teams, search]);


  const filteredMembers = useMemo(() => {

    if (!search) return members;

    return members.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );

  }, [members, search]);


  /* =========================
      HELPERS
  ========================= */
  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();


  return (
    <aside className="chat-sidebar">

      {/* HEADER */}
      <div className="cs-header">

        <div className="cs-brand">

          <div className="cs-logo">C</div>

          <div>
            <h3>Convo</h3>
            <span>Workspace</span>
          </div>

        </div>

      </div>


      {/* SEARCH */}
      <div className="cs-search">

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <button onClick={() => setSearch('')}>✕</button>
        )}

      </div>


      {/* FILTER */}
      <div className="cs-tabs">

        <div
          className={`tab ${view === 'all' ? 'active' : ''}`}
          onClick={() => setView('all')}
        >
          All
        </div>

        <div
          className={`tab ${view === 'teams' ? 'active' : ''}`}
          onClick={() => setView('teams')}
        >
          Teams
        </div>

        <div
          className={`tab ${view === 'dm' ? 'active' : ''}`}
          onClick={() => setView('dm')}
        >
          Direct
        </div>

      </div>


      {/* BODY */}
      <div className="cs-body">

        {/* TEAMS */}
        {(view === 'all' || view === 'teams') && (

          <section>

            <p className="cs-title">Teams</p>

            {loading ? <Loader /> :

              filteredTeams.length === 0 ?

                <div className="cs-empty">No teams</div>

                :

                filteredTeams.map(team => (

                  <div
                    key={team._id}
                    className="cs-item"
                    onClick={() => setSelectedChat({
                      type: 'team',
                      id: team._id,
                      name: team.name
                    })}
                  >

                    <div className="cs-avatar">
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


        {/* DIRECT MESSAGES */}
        {(view === 'all' || view === 'dm') && (

          <section>

            <p className="cs-title">Direct Messages</p>

            {filteredMembers.length === 0 ?

              <div className="cs-empty">No users</div>

              :

              filteredMembers.map(user => (

                <div
                  key={user._id}
                  className="cs-item"
                  onClick={() => setSelectedChat({
                    type: 'conversation',
                    id: user._id,
                    name: user.name
                  })}
                >

                  <div className="cs-avatar">
                    {initials(user.name)}
                  </div>

                  <div className="cs-info">
                    <h4>{user.name}</h4>
                    <p>{user.email || 'Member'}</p>
                  </div>

                </div>

              ))
            }

          </section>
        )}

      </div>

    </aside>
  );
};

export default ChatSidebar;
