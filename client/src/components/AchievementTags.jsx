import React, { useState } from 'react';
import { FaAward, FaTimes, FaInfoCircle, FaTrophy, FaCheck } from 'react-icons/fa';

const badgeColors = {
  top_teacher: { bg: 'rgba(254, 243, 199, 0.15)', color: '#fbbf24', border: '1px solid rgba(254, 243, 199, 0.3)' },
  highly_rated: { bg: 'rgba(204, 251, 241, 0.15)', color: '#2dd4bf', border: '1px solid rgba(204, 251, 241, 0.3)' },
  subject_expert: { bg: 'rgba(243, 232, 255, 0.15)', color: '#c084fc', border: '1px solid rgba(243, 232, 255, 0.3)' },
  active_contributor: { bg: 'rgba(220, 252, 231, 0.15)', color: '#4ade80', border: '1px solid rgba(220, 252, 231, 0.3)' },
  peer_mentor: { bg: 'rgba(219, 234, 254, 0.15)', color: '#60a5fa', border: '1px solid rgba(219, 234, 254, 0.3)' },
  rising_star: { bg: 'rgba(255, 237, 213, 0.15)', color: '#fb923c', border: '1px solid rgba(255, 237, 213, 0.3)' },
  bronze_teacher: { bg: 'rgba(254, 240, 138, 0.15)', color: '#facc15', border: '1px solid rgba(254, 240, 138, 0.3)' },
  silver_mentor: { bg: 'rgba(243, 244, 246, 0.15)', color: '#e5e7eb', border: '1px solid rgba(243, 244, 246, 0.3)' },
  gold_expert: { bg: 'rgba(254, 240, 138, 0.2)', color: '#fbbf24', border: '1px solid rgba(254, 240, 138, 0.4)' },
  faculty_verified: { bg: 'rgba(204, 251, 241, 0.15)', color: '#2dd4bf', border: '1px solid rgba(204, 251, 241, 0.3)' },
  first_session: { bg: 'rgba(224, 242, 254, 0.15)', color: '#38bdf8', border: '1px solid rgba(224, 242, 254, 0.3)' },
  resource_sharer: { bg: 'rgba(220, 252, 231, 0.15)', color: '#4ade80', border: '1px solid rgba(220, 252, 231, 0.3)' },
};

const badgeLabels = {
  top_teacher: 'Top Teacher',
  highly_rated: 'Highly Rated',
  subject_expert: 'Subject Expert',
  active_contributor: 'Active Contributor',
  peer_mentor: 'Peer Mentor',
  rising_star: 'Rising Star',
  bronze_teacher: 'Bronze Teacher',
  silver_mentor: 'Silver Mentor',
  gold_expert: 'Gold Expert',
  faculty_verified: 'Faculty Verified',
  first_session: 'First Session',
  resource_sharer: 'Resource Sharer',
};

const badgeDescriptions = {
  top_teacher: 'Ranked in the top 3 most active teachers on the platform this month.',
  highly_rated: 'Maintained an average rating of 4.5+ with at least 3 reviews.',
  subject_expert: 'Received 3 or more skill endorsements from peers or faculty.',
  active_contributor: 'Contributed 10 or more learning resources to the community.',
  peer_mentor: 'Conducted 20 or more successful peer-to-peer tutoring sessions.',
  rising_star: 'Completed 5+ tutoring sessions within the first 30 days of joining.',
  bronze_teacher: 'Conducted 5 or more successful tutoring sessions.',
  silver_mentor: 'Conducted 15 or more successful tutoring sessions.',
  gold_expert: 'Conducted 30 or more successful tutoring sessions.',
  faculty_verified: 'Verified academic faculty member status.',
  first_session: 'Completed their first tutoring session as a teacher.',
  resource_sharer: 'Uploaded 3 or more useful study resources/materials.',
};

const AchievementTags = ({ 
  badges = [], 
  size = 'sm', 
  limit, 
  showViewMore = false, 
  allBadges = [], 
  isOwn = false, 
  onToggleBadge 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If no badges have been earned/awarded at all, render nothing
  const earnedBadgesCount = allBadges.length;
  if (earnedBadgesCount === 0) return null;

  const normalizedBadges = badges.map(b => typeof b === 'string' ? b : b.type);
  const displayBadges = limit ? normalizedBadges.slice(0, limit) : normalizedBadges;
  const remaining = limit && normalizedBadges.length > limit ? normalizedBadges.length - limit : 0;

  const fontSize = size === 'sm' ? '11px' : '13px';
  const containerJustify = showViewMore ? 'flex-start' : 'center';

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  // Determine badges to show in details list
  const modalListBadges = allBadges;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: showViewMore ? 'flex-start' : 'center' }}>
      
      {/* Badges Row (if visible badges exist) */}
      {displayBadges.length > 0 ? (
        <div 
          style={{ 
            display: 'flex', 
            gap: '6px', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: containerJustify, 
            marginTop: '4px', 
            marginBottom: '4px', 
            width: '100%' 
          }}
        >
          {displayBadges.map((type, index) => {
            const cleanType = type.replace('_hidden', '');
            const colors = badgeColors[cleanType] || { bg: 'rgba(243, 244, 246, 0.1)', color: '#e5e7eb', border: '1px solid rgba(243, 244, 246, 0.2)' };
            const label = badgeLabels[cleanType] || cleanType.replace('_', ' ');

            return (
              <span
                key={index}
                style={{
                  backgroundColor: colors.bg,
                  color: colors.color,
                  border: colors.border || 'none',
                  fontSize: fontSize,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                {label}
              </span>
            );
          })}
          {remaining > 0 && !showViewMore && (
            <span
              title={normalizedBadges.slice(limit).map(type => {
                const ct = type.replace('_hidden', '');
                return badgeLabels[ct] || ct.replace('_', ' ');
              }).join(', ')}
              style={{
                backgroundColor: 'var(--color-bg-secondary, rgba(255, 255, 255, 0.05))',
                color: 'var(--color-text-secondary, #94a3b8)',
                fontSize: fontSize,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'help'
              }}
            >
              +{remaining} more
            </span>
          )}
        </div>
      ) : (
        isOwn && (
          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '2px' }}>
            No badges showcased
          </span>
        )
      )}

      {/* View/Select details link */}
      {showViewMore && (
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary, #38bdf8)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 0',
            marginTop: '4px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            opacity: 0.85,
            transition: 'opacity 0.2s, transform 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'translateY(-0.5px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '0.85';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <FaInfoCircle size={11} /> {displayBadges.length > 0 ? 'View badge details' : 'Select badges to showcase'}
        </button>
      )}

      {/* Details Modal */}
      {isModalOpen && (
        <div 
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaTrophy style={{ color: '#fbbf24' }} /> Achievements & Badges
                </h3>
                {isOwn && (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Select which badges you want to showcase on your profile
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FaTimes size={16} />
              </button>
            </div>
            
            {/* List */}
            <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {modalListBadges.map((badge, idx) => {
                const rawType = badge.type;
                const cleanType = rawType.replace('_hidden', '');
                const colors = badgeColors[cleanType] || { bg: 'rgba(243, 244, 246, 0.1)', color: '#e5e7eb', border: '1px solid rgba(243, 244, 246, 0.2)' };
                const label = badgeLabels[cleanType] || cleanType.replace('_', ' ');
                const description = badgeDescriptions[cleanType] || 'Awarded for exceptional contribution or activity on the platform.';
                const isVisible = !rawType.endsWith('_hidden');
                
                return (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (isOwn && onToggleBadge) {
                        onToggleBadge(badge._id || badge.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      border: isOwn 
                        ? (isVisible ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)')
                        : '1px solid rgba(255, 255, 255, 0.04)',
                      alignItems: 'flex-start',
                      cursor: isOwn ? 'pointer' : 'default',
                      userSelect: 'none',
                      transition: 'border-color 0.2s, background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (isOwn) {
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (isOwn) {
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)';
                      }
                    }}
                  >
                    {/* Checkbox (Only for own badges) */}
                    {isOwn && (
                      <div 
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isVisible ? '1px solid #38bdf8' : '1px solid #475569',
                          backgroundColor: isVisible ? '#38bdf8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '8px',
                          marginRight: '2px',
                          flexShrink: 0,
                          transition: 'background-color 0.2s, border-color 0.2s'
                        }}
                      >
                        {isVisible && <FaCheck size={10} color="#0f172a" />}
                      </div>
                    )}

                    {/* Badge Icon */}
                    <div 
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.color,
                        border: colors.border || '1px solid transparent',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        opacity: isOwn ? (isVisible ? 1 : 0.4) : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <FaAward size={16} />
                    </div>

                    {/* Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', opacity: isOwn ? (isVisible ? 1 : 0.5) : 1, transition: 'opacity 0.2s' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                        {label}
                      </span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementTags;
