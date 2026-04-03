import React from 'react';

interface ActionButtonProps {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  style: customStyle,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return '#00d4a8';
      case 'secondary':
        return '#4cc9f0';
      case 'danger':
        return '#ff6b6b';
      default:
        return '#00d4a8';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: disabled ? '#333' : getBackgroundColor(),
        color: disabled ? '#666' : '#0a0d12',
        fontSize: '14px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        ...customStyle,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default ActionButton;
