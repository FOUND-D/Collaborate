import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCalendarAlt, FaCoins, FaStar, FaTrash, FaUsers } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteListing, getListingDetails } from '../actions/listingActions';
import { createSession } from '../actions/sessionActions';
import './SkillExchange.css';

const ListingDetailScreen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { listing, loading } = useSelector((state) => state.listingDetails);
  const { userInfo } = useSelector((state) => state.userLogin);

  const [booking, setBooking] = useState({
    scheduledAt: '',
    durationMin: 60,
    agenda: '',
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(getListingDetails(id));
  }, [dispatch, id]);

  const handleBook = async (event) => {
    event.preventDefault();
    const created = await dispatch(createSession({
      listingId: listing?._id,
      scheduledAt: booking.scheduledAt,
      durationMin: Number(booking.durationMin || 60),
      agenda: booking.agenda || `Skill exchange on ${listing?.skill?.name || 'selected skill'}`,
    }));

    if (created) {
      setIsOpen(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this listing?')) {
      await dispatch(deleteListing(listing._id));
      navigate('/exchange');
    }
  };

  if (loading || !listing) {
    return (
      <div className="phase2-page">
        <div className="phase2-shell">
          <div className="phase2-empty phase2-glass">Loading listing details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="phase2-page">
      <div className="phase2-shell">
        <div className="phase2-detail-grid">
          <section className="phase2-detail-main phase2-glass">
            <div className="phase2-card-topline">
              <span className={`phase2-pill ${listing.listingType === 'offer' ? 'offer' : 'request'}`}>{listing.listingType}</span>
              <span className="phase2-pill subtle">{listing.level}</span>
            </div>
            <h1>{listing.skill?.name}</h1>
            <p className="phase2-detail-copy">{listing.description || 'No description provided.'}</p>

            <div className="phase2-detail-metrics">
              <div><FaCoins /> {listing.creditRate} credits</div>
              <div><FaUsers /> {listing.format === 'group' ? `Group of ${listing.maxGroupSize || 'open size'}` : '1-on-1 format'}</div>
              <div><FaCalendarAlt /> Active listing</div>
            </div>

            <div className="phase2-detail-actions">
              <button type="button" className="phase2-button phase2-button-primary" onClick={() => setIsOpen(true)}>
                Book session
              </button>
              {listing.userId === userInfo?._id && (
                <button type="button" className="phase2-button phase2-button-danger" onClick={handleDelete}>
                  <FaTrash /> Delete listing
                </button>
              )}
              <Link className="phase2-button phase2-button-secondary" to="/exchange">
                Back to board
              </Link>
            </div>
          </section>

          <aside className="phase2-detail-side phase2-glass">
            <span className="phase2-badge">Poster profile</span>
            <div className="phase2-profile-card">
              <Link to={`/profile/${listing.user?._id}`} className="phase2-avatar large">
                {listing.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Link>
              <Link to={`/profile/${listing.user?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3>{listing.user?.name || 'Unknown user'}</h3>
              </Link>
              <p>{listing.user?.department || 'Cross-functional'}</p>
              <div className="phase2-rating-line">
                <FaStar /> {listing.user?.avgRating ?? 'New profile'}
              </div>
            </div>
          </aside>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div className="phase2-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="phase2-modal phase2-glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <div className="phase2-modal-head">
                  <h2>Book session</h2>
                  <p>Lock a time and agenda for this skill exchange.</p>
                </div>
                <form className="phase2-form-grid" onSubmit={handleBook}>
                  <label className="phase2-field">
                    <span>Proposed time</span>
                    <input
                      type="datetime-local"
                      value={booking.scheduledAt}
                      onChange={(e) => setBooking((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                      required
                    />
                  </label>
                  <label className="phase2-field">
                    <span>Duration</span>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={booking.durationMin}
                      onChange={(e) => setBooking((prev) => ({ ...prev, durationMin: e.target.value }))}
                    />
                  </label>
                  <label className="phase2-field phase2-field-full">
                    <span>Agenda</span>
                    <textarea
                      rows="4"
                      value={booking.agenda}
                      onChange={(e) => setBooking((prev) => ({ ...prev, agenda: e.target.value }))}
                      placeholder="Outline outcomes, prep work, and what success looks like."
                    />
                  </label>
                  <div className="phase2-modal-actions">
                    <button type="button" className="phase2-button phase2-button-secondary" onClick={() => setIsOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="phase2-button phase2-button-primary">
                      Confirm booking
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ListingDetailScreen;
