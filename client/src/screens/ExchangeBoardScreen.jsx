import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBolt, FaFilter, FaPlus, FaSearch, FaStar, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { listListings } from '../actions/listingActions';
import { LISTING_CREATE_RESET } from '../constants/listingConstants';
import { listSkillMatches, listSkills } from '../actions/skillActions';
import ListingCreateModal from '../components/ListingCreateModal';
import './SkillExchange.css';

const ExchangeBoardScreen = () => {
  const dispatch = useDispatch();
  const { listings = [], loading } = useSelector((state) => state.listingList);
  const { matches = [] } = useSelector((state) => state.skillMatchList);
  const { skills = [] } = useSelector((state) => state.skillList);
  const { success: successCreate } = useSelector((state) => state.listingCreate);

  const [filters, setFilters] = useState({
    skill_id: '',
    department: '',
    format: '',
    listing_type: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(listSkills());
    dispatch(listSkillMatches());
  }, [dispatch]);

  useEffect(() => {
    dispatch(listListings(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (!successCreate) return;

    setIsModalOpen(false);
    dispatch(listListings(filters));
    dispatch({ type: LISTING_CREATE_RESET });
  }, [dispatch, filters, successCreate]);

  const departments = useMemo(
    () => [...new Set(listings.map((listing) => listing.user?.department).filter(Boolean))],
    [listings]
  );

  return (
    <div className="phase2-page">
      <div className="phase2-shell">
        <div className="phase2-hero">
          <div>
            <span className="phase2-badge phase2-badge-ai"><FaBolt /> Matched for you</span>
            <h1>Exchange board</h1>
            <p>Scan active offers and requests, filter aggressively, and move into booked sessions with minimal friction.</p>
          </div>
          <button type="button" className="phase2-button phase2-button-primary" onClick={() => setIsModalOpen(true)}>
            <FaPlus /> New listing
          </button>
        </div>

        <div className="phase2-board-layout">
          <section className="phase2-main-column">
            <div className="phase2-filter-bar phase2-glass">
              <div className="phase2-filter-label"><FaFilter /> Filters</div>
              <select value={filters.skill_id} onChange={(e) => setFilters((prev) => ({ ...prev, skill_id: e.target.value }))}>
                <option value="">All skills</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </select>
              <select value={filters.department} onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}>
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
              <select value={filters.format} onChange={(e) => setFilters((prev) => ({ ...prev, format: e.target.value }))}>
                <option value="">All formats</option>
                <option value="one_on_one">1-on-1</option>
                <option value="group">Group</option>
              </select>
              <select value={filters.listing_type} onChange={(e) => setFilters((prev) => ({ ...prev, listing_type: e.target.value }))}>
                <option value="">Offer + Request</option>
                <option value="offer">Offers</option>
                <option value="request">Requests</option>
              </select>
            </div>

            <div className="phase2-card-grid">
              {loading ? (
                <div className="phase2-empty phase2-glass">Loading exchange board...</div>
              ) : listings.length === 0 ? (
                <div className="phase2-empty phase2-glass">No listings match the current filters.</div>
              ) : (
                listings.map((listing, index) => (
                  <motion.div
                    key={listing._id}
                    className="phase2-listing-card phase2-glass"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <div className="phase2-card-topline">
                      <span className={`phase2-pill ${listing.listingType === 'offer' ? 'offer' : 'request'}`}>
                        {listing.listingType}
                      </span>
                      <span className="phase2-pill subtle">{listing.format === 'group' ? 'Group' : '1-on-1'}</span>
                    </div>
                    <h3>{listing.skill?.name || 'Skill listing'}</h3>
                    <p>{listing.description || 'No additional details supplied for this exchange.'}</p>
                    <div className="phase2-card-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {listing.user?.name || 'Anonymous'}
                        {listing.user?.role === 'faculty' && (
                          <FaCheckCircle style={{ color: '#14b8a6', fontSize: '0.85rem' }} title="Faculty Verified" />
                        )}
                      </span>
                      <span>{listing.user?.department || 'Open department'}</span>
                      <span className="listing-rating-badge">
                        <FaStar style={{ color: '#fbbf24', marginRight: '4px' }} />
                        {listing.user?.avgRating ? listing.user.avgRating.toFixed(1) : 'New'}
                      </span>
                    </div>
                    <div className="phase2-card-footer">
                      <div>
                        <strong>{listing.creditRate}</strong>
                        <small>credits</small>
                      </div>
                      <Link className="phase2-button phase2-button-secondary" to={`/exchange/${listing._id}`}>
                        View detail
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          <aside className="phase2-sidebar-column">
            <div className="phase2-recommendation-card phase2-glass">
              <div className="phase2-recommendation-head">
                <span className="phase2-badge phase2-badge-ai"><FaSearch /> Recommended peers</span>
                <h2>High-fit matches</h2>
              </div>
              <div className="phase2-match-list">
                {matches.length === 0 ? (
                  <div className="phase2-empty">Complete your skill profile to unlock peer recommendations.</div>
                ) : (
                  matches.map((match) => (
                    <div key={match.user?._id} className="phase2-match-card">
                      <div className="phase2-match-header">
                        <div className="phase2-avatar">{match.user?.name?.charAt(0)?.toUpperCase() || 'P'}</div>
                        <div>
                          <strong>{match.user?.name}</strong>
                          <p>{match.user?.department || 'Open department'}</p>
                        </div>
                        <span className="phase2-match-score">{Math.round(match.matchScore)}</span>
                      </div>
                      <div className="phase2-match-skills">
                        {match.matchedSkills?.slice(0, 2).map((item) => (
                          <span key={`${match.user?._id}-${item.skillId}`} className="phase2-pill subtle">{item.skillName}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        <ListingCreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
};

export default ExchangeBoardScreen;
