import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaArrowRight, FaMagic, FaStar, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { createRating } from '../actions/ratingActions';
import '../screens/SkillExchange.css';

const RatingPromptModal = ({ session, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratee = useMemo(() => {
    if (!session || !userInfo) return null;
    return session.teacher?._id === userInfo._id ? session.learner : session.teacher;
  }, [session, userInfo]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !ratee?._id || !session?._id) return;
    
    setIsSubmitting(true);
    try {
      const created = await dispatch(createRating({
        sessionId: session._id,
        rateeId: ratee._id,
        stars,
        review,
      }));

      if (created) {
        setStars(5);
        setReview('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && session && ratee && (
        <motion.div className="phase2-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="phase2-modal phase2-glass phase2-rating-modal"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
          >
            <button type="button" className="phase2-modal-close" onClick={onClose}>
              <FaTimes />
            </button>
            <div className="phase2-mesh" />
            <div className="phase2-modal-head">
              <span className="phase2-badge phase2-badge-ai"><FaMagic /> Session completed</span>
              <h2>Rate your exchange</h2>
              <p>Close the loop on this session and strengthen the recommendation engine.</p>
            </div>

            <div className="phase2-rating-user">
              <div className="phase2-avatar">{ratee.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <strong>{ratee.name}</strong>
                <p>{ratee.department || 'Cross-discipline'} <FaArrowRight /> {session.listing?.skill?.name || 'Skill session'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="phase2-form-grid">
              <div className="phase2-field phase2-field-full">
                <span>Stars</span>
                <div className="phase2-stars">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`phase2-star-btn ${value <= stars ? 'active' : ''}`}
                      onClick={() => setStars(value)}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>
              <label className="phase2-field phase2-field-full">
                <span>Review</span>
                <textarea
                  rows="4"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What made this exchange useful, efficient, or worth recommending?"
                />
              </label>
              <div className="phase2-modal-actions">
                <button type="button" className="phase2-button phase2-button-secondary" onClick={onClose}>
                  Later
                </button>
                <button type="submit" disabled={isSubmitting} className="phase2-button phase2-button-primary" style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Submitting...' : 'Submit rating'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RatingPromptModal;
