import React from 'react';

interface RiskBadgeProps {
  label: string | null;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ label }) => {
  const getColor = () => {
    switch (label?.toLowerCase()) {
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#ffd166';
      case 'low':
        return '#00d4a8';
      default:
        return '#666';
    }
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: `${getColor()}20`,
        color: getColor(),
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {label || 'Unknown'}
    </span>
  );
};

export default RiskBadge;
