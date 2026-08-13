import React, { useEffect, useMemo, useState } from 'react';
import { FaFilter, FaPlus, FaSearch, FaStar } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { listListings } from '../actions/listingActions';
import { LISTING_CREATE_RESET } from '../constants/listingConstants';
import { listSkillMatches, listSkills } from '../actions/skillActions';
import ListingCreateModal from '../components/ListingCreateModal';
import AchievementTags from '../components/AchievementTags';
import './ExchangeBoardScreen.css';

const ExchangeBoardScreen = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userIdParam = queryParams.get('user_id');

  const { listings = [], loading } = useSelector((state) => state.listingList);
  const { matches = [] } = useSelector((state) => state.skillMatchList);
  const { skills = [] } = useSelector((state) => state.skillList);
  const { success: successCreate } = useSelector((state) => state.listingCreate);

  const [filters, setFilters] = useState({
    skill_id: '',
    department: '',
    format: '',
    listing_type: '',
    user_id: userIdParam || '',
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
    <div className="exchange-board-page">
      <div className="exchange-board-header">
        <div className="exchange-board-header-text">
          <h1>Exchange board</h1>
          <p>
            Scan active offers and requests, filter aggressively, and move into booked sessions with minimal friction.
          </p>
        </div>
        <button type="button" className="exchange-board-new-btn" onClick={() => setIsModalOpen(true)}>
          <FaPlus /> New listing
        </button>
      </div>

      <div className="exchange-board-layout">
        <main className="exchange-board-main">
          <div className="exchange-board-filters">
            <div className="exchange-filters-label">
              <FaFilter /> Filters
            </div>
            <select
              className="exchange-filter-select"
              value={filters.skill_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, skill_id: e.target.value }))}
            >
              <option value="">All skills</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
            <select
              className="exchange-filter-select"
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            <select
              className="exchange-filter-select"
              value={filters.format}
              onChange={(e) => setFilters((prev) => ({ ...prev, format: e.target.value }))}
            >
              <option value="">All formats</option>
              <option value="one_on_one">1-on-1</option>
              <option value="group">Group</option>
            </select>
            <select
              className="exchange-filter-select"
              value={filters.listing_type}
              onChange={(e) => setFilters((prev) => ({ ...prev, listing_type: e.target.value }))}
            >
              <option value="">Offer + Request</option>
              <option value="offer">Offers</option>
              <option value="request">Requests</option>
            </select>
          </div>

          <div className="exchange-board-grid">
            {loading ? (
              <div className="exchange-board-empty">Loading exchange board...</div>
            ) : listings.length === 0 ? (
              <div className="exchange-board-empty">No listings match the current filters.</div>
            ) : (
              listings.map((listing) => (
                <article key={listing._id} className="exchange-listing-card">
                  <div className="exchange-listing-top">
                    <span className={`exchange-pill ${listing.listingType === 'offer' ? 'offer' : 'request'}`}>
                      {listing.listingType}
                    </span>
                    <span className="exchange-pill format">
                      {listing.format === 'group' ? 'Group' : '1-on-1'}
                    </span>
                  </div>

                  <h3 className="exchange-listing-title">{listing.skill?.name || 'Skill listing'}</h3>
                  <p className="exchange-listing-desc">
                    {listing.description || 'No additional details supplied for this exchange.'}
                  </p>

                  <div className="exchange-listing-meta">
                    <div className="exchange-listing-author-row">
                      <Link to={`/profile/${listing.user?._id}`} className="exchange-listing-author">
                        {listing.user?.name || 'Anonymous'}
                      </Link>
                      {listing.user?.role === 'faculty' && (
                        <span className="exchange-faculty-badge">FACULTY</span>
                      )}
                      <AchievementTags badges={listing.posterBadges} size="sm" limit={2} />
                    </div>
                    <span className="exchange-listing-dept">{listing.user?.department || 'Open department'}</span>
                    <span className="exchange-listing-rating">
                      <FaStar className="exchange-rating-star" />
                      {listing.user?.avgRating ? listing.user.avgRating.toFixed(1) : 'New'}
                    </span>
                  </div>

                  <Link className="exchange-listing-cta" to={`/exchange/${listing._id}`}>
                    View detail
                  </Link>
                </article>
              ))
            )}
          </div>
        </main>

        <aside className="exchange-board-peers">
          <div className="exchange-peers-panel">
            <div className="exchange-peers-head">
              <span className="exchange-peers-eyebrow">
                <FaSearch /> Recommended peers
              </span>
              <h2>High-fit matches</h2>
            </div>

            <div className="exchange-peer-list">
              {matches.length === 0 ? (
                <div className="exchange-board-empty exchange-board-empty-compact">
                  Complete your skill profile to unlock peer recommendations.
                </div>
              ) : (
                matches.map((match) => (
                  <div key={match.user?._id} className="exchange-peer-card">
                    <div className="exchange-peer-main">
                      <Link to={`/profile/${match.user?._id}`} className="exchange-peer-avatar">
                        {match.user?.name?.charAt(0)?.toUpperCase() || 'P'}
                      </Link>
                      <div className="exchange-peer-info">
                        <Link to={`/profile/${match.user?._id}`} className="exchange-peer-name">
                          {match.user?.name}
                        </Link>
                        <p className="exchange-peer-dept">{match.user?.department || 'Open department'}</p>
                      </div>
                      <span className="exchange-peer-score">{Math.round(match.matchScore)}</span>
                    </div>
                    {match.matchedSkills?.length > 0 && (
                      <div className="exchange-peer-skills">
                        {match.matchedSkills.slice(0, 3).map((item) => (
                          <span key={`${match.user?._id}-${item.skillId}`} className="exchange-peer-skill">
                            {item.skillName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      <ListingCreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default ExchangeBoardScreen;
