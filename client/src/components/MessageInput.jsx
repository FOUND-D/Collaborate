import React, { useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBolt, FaCalendarAlt, FaCoins, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { listListings } from '../actions/listingActions';
import { sendMessage } from '../actions/messageActions';
import './MessageInput.css';

const MessageInput = ({ selectedChat, socketRef, onMessageSent }) => {
  const [content, setContent] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [sessionDraft, setSessionDraft] = useState({
    listingId: '',
    skill: '',
    proposed_time: '',
    });
  const dispatch = useDispatch();
  const { listings = [] } = useSelector((state) => state.listingList);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (isComposerOpen) {
      dispatch(listListings({}));
    }
  }, [dispatch, isComposerOpen]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [selectedChat]);

  const availableListings = useMemo(() => {
    if (!selectedChat) return [];
    if (selectedChat.type === 'conversation') {
      return listings.filter((listing) => listing.userId === selectedChat.id);
    }
    return listings;
  }, [listings, selectedChat]);

  const handleContentChange = (e) => {
    setContent(e.target.value);

    if (!selectedChat || !socketRef?.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { conversationId: selectedChat.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('stopTyping', { conversationId: selectedChat.id });
    }, 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim() || !selectedChat) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    if (socketRef?.current) {
      socketRef.current.emit('stopTyping', { conversationId: selectedChat.id });
    }

    const messageData = { content };
    if (selectedChat.type === 'team') {
      messageData.teamId = selectedChat.id;
    } else {
      messageData.recipientId = selectedChat.id;
    }

    const newMessage = await dispatch(sendMessage(messageData));
    if (newMessage) {
      setContent('');
      if (onMessageSent) onMessageSent();
    }
  };

  const handleSessionRequest = async (event) => {
    event.preventDefault();
    if (!selectedChat || !sessionDraft.listingId || !sessionDraft.skill || !sessionDraft.proposed_time ) {
      return;
    }

    const messageData = {
      type: 'session_request',
      content: `Proposed session for ${sessionDraft.skill}`,
      sessionRequest: {
        skill: sessionDraft.skill,
        proposed_time: sessionDraft.proposed_time,
        listing_id: sessionDraft.listingId,
      },
    };

    if (selectedChat.type === 'team') {
      messageData.teamId = selectedChat.id;
    } else {
      messageData.recipientId = selectedChat.id;
    }

    const sent = await dispatch(sendMessage(messageData));
    if (sent) {
      setSessionDraft({
        listingId: '',
        skill: '',
        proposed_time: '',
        });
      setIsComposerOpen(false);
    }
  };

  const handleListingChange = (listingId) => {
    const selectedListing = availableListings.find((listing) => listing._id === listingId);
    setSessionDraft((prev) => ({
      ...prev,
      listingId,
      skill: selectedListing?.skill?.name || '',
      }));
  };

  return (
    <>
      <form className="message-input-form" onSubmit={handleSubmit}>
        <button
          type="button"
          className="message-input-session-btn"
          onClick={() => setIsComposerOpen((prev) => !prev)}
          title="Propose session"
        >
          <FaBolt />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={content}
          onChange={handleContentChange}
          className="message-input-field"
        />
        <button type="submit" className="message-input-send-btn">
          <FaPaperPlane />
        </button>
      </form>

      <AnimatePresence>
        {isComposerOpen && (
          <motion.div
            className="session-compose-popover"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
          >
            <div className="session-compose-topline">
              <span className="session-compose-badge"><FaBolt /> Propose Session</span>
              <button type="button" className="session-compose-close" onClick={() => setIsComposerOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <form className="session-compose-form" onSubmit={handleSessionRequest}>
              <label>
                <span>Linked listing</span>
                <select
                  value={sessionDraft.listingId}
                  onChange={(e) => handleListingChange(e.target.value)}
                  required
                >
                  <option value="">Select a listing</option>
                  {availableListings.map((listing) => (
                    <option key={listing._id} value={listing._id}>
                      {listing.skill?.name || 'Skill'} · {listing.user?.name || 'Peer'}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Skill</span>
                <input
                  type="text"
                  value={sessionDraft.skill}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, skill: e.target.value }))}
                  placeholder="e.g. React architecture review"
                  required
                />
              </label>

              <div className="session-compose-grid">
                <label>
                  <span><FaCalendarAlt /> Proposed time</span>
                  <input
                    type="datetime-local"
                    value={sessionDraft.proposed_time}
                    onChange={(e) => setSessionDraft((prev) => ({ ...prev, proposed_time: e.target.value }))}
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                className="session-compose-submit"
                disabled={!availableListings.length}
              >
                Send session request
              </button>

              {!availableListings.length && (
                <p className="session-compose-note">
                  No compatible listings are available in this chat context yet.
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessageInput;
