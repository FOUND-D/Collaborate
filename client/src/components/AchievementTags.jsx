import React from 'react';

const badgeColors = {
  top_teacher: { bg: '#fef3c7', color: '#d97706' },
  highly_rated: { bg: '#ccfbf1', color: '#0d9488' },
  subject_expert: { bg: '#f3e8ff', color: '#9333ea' },
  active_contributor: { bg: '#dcfce7', color: '#16a34a' },
  peer_mentor: { bg: '#dbeafe', color: '#2563eb' },
  rising_star: { bg: '#ffedd5', color: '#ea580c' },
  bronze_teacher: { bg: '#fef08a', color: '#b45309' },
  silver_mentor: { bg: '#f3f4f6', color: '#4b5563' },
  gold_expert: { bg: '#fef08a', color: '#ca8a04' },
  faculty_verified: { bg: '#ccfbf1', color: '#0d9488' },
  first_session: { bg: '#e0f2fe', color: '#3b82f6' },
  resource_sharer: { bg: '#dcfce7', color: '#16a34a' },
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
  faculty_verified: 'Faculty Verified ✓',
  first_session: 'First Session',
  resource_sharer: 'Resource Sharer',
};

const AchievementTags = ({ badges = [], size = 'sm', limit }) => {
  if (!badges || badges.length === 0) return null;

  const normalizedBadges = badges.map(b => typeof b === 'string' ? b : b.type);
  const displayBadges = limit ? normalizedBadges.slice(0, limit) : normalizedBadges;
  const remaining = limit && normalizedBadges.length > limit ? normalizedBadges.length - limit : 0;

  const fontSize = size === 'sm' ? '11px' : '13px';

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px', marginBottom: '4px' }}>
      {displayBadges.map((type, index) => {
        const colors = badgeColors[type] || { bg: '#f3f4f6', color: '#374151' };
        const label = badgeLabels[type] || type.replace('_', ' ');

        return (
          <span
            key={index}
            style={{
              backgroundColor: colors.bg,
              color: colors.color,
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
      {remaining > 0 && (
        <span
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            fontSize: fontSize,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
};

export default AchievementTags;
