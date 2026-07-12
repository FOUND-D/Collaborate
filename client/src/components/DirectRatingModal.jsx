import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { createRating } from '../actions/ratingActions';

const DirectRatingModal = ({ ratee, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!ratee?._id) return;
    const created = await dispatch(createRating({
      rateeId: ratee._id,
      stars,
      review,
    }));

    if (created) {
      setStars(5);
      setReview('');
      onClose();
    }
  };

  if (!isOpen || !ratee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Leave a Rating for {ratee.name}</h2>
          <button type="button" className="close-modal" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Stars</label>
              <select 
                value={stars} 
                onChange={(e) => setStars(Number(e.target.value))} 
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                {[5, 4, 3, 2, 1].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Star' : 'Stars'}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Review (Optional)</label>
              <textarea
                rows="4"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={`Describe your experience collaborating with ${ratee.name}...`}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
              />
            </div>

            <div className="modal-footer" style={{ marginTop: '24px', padding: '0' }}>
              <button type="button" className="btn btn-light" onClick={onClose} style={{ marginRight: '10px', padding: '10px 16px', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Submit Rating
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectRatingModal;
