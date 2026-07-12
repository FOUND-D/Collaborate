import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listRatings } from '../actions/ratingActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { FaStar, FaRegStar, FaFlag } from 'react-icons/fa';
import FlagRatingModal from '../components/FlagRatingModal';

const MyRatingsScreen = () => {
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const ratingList = useSelector((state) => state.ratingList);
  const { loading, error, ratings, avgRating } = ratingList;

  const [flagModalRating, setFlagModalRating] = useState(null);

  useEffect(() => {
    if (userInfo && userInfo._id) {
      dispatch(listRatings(userInfo._id));
    }
  }, [dispatch, userInfo]);

  return (
    <div className="phase2-page">
      <div className="phase2-shell" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>My Ratings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          This is a private view of the ratings and comments you have received. Other users can only see your average rating.
        </p>

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <>
            <div className="my-ratings-summary" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                {avgRating ? avgRating.toFixed(1) : '—'}
              </div>
              <div>
                <div style={{ display: 'flex', color: 'var(--color-stars, #fbbf24)', fontSize: '1.2rem', marginBottom: '4px' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    i <= Math.round(avgRating || 0) ? <FaStar key={i} /> : <FaRegStar key={i} />
                  ))}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Based on {ratings.length} ratings</div>
              </div>
            </div>

            {ratings.length === 0 ? (
              <Message>You have not received any ratings yet.</Message>
            ) : (
              <div className="my-ratings-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {ratings.map((rating) => (
                  <div key={rating.id || rating._id || Math.random()} className="rating-card" style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {rating.rater?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '500' }}>{rating.rater?.name}</span>
                      </div>
                      <div style={{ display: 'flex', color: 'var(--color-stars, #fbbf24)' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          i <= rating.stars ? <FaStar key={i} /> : <FaRegStar key={i} />
                        ))}
                      </div>
                    </div>
                    {rating.review ? (
                      <p style={{ color: 'var(--text-primary)', margin: 0, fontStyle: 'italic' }}>"{rating.review}"</p>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>No comment provided.</p>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setFlagModalRating(rating)}
                      style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      <FaFlag /> Report
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <FlagRatingModal 
              rating={flagModalRating} 
              isOpen={Boolean(flagModalRating)} 
              onClose={() => setFlagModalRating(null)} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MyRatingsScreen;
