import React from 'react';

interface LoadingSplashProps {
  isVisible: boolean;
}

const LoadingSplash: React.FC<LoadingSplashProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0d12',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      {/* Hospital Logo */}
      <div
        style={{
          fontSize: '72px',
          marginBottom: '24px',
          animation: 'logoFloat 2s ease-in-out infinite',
        }}
      >
        🏥
      </div>

      {/* MedRetain Brand */}
      <h1
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#00d4a8',
          marginBottom: '8px',
          letterSpacing: '-1px',
        }}
      >
        MedRetain
      </h1>
      <p
        style={{
          fontSize: '16px',
          color: '#9ca3af',
          marginBottom: '48px',
          textAlign: 'center',
        }}
      >
        Hospital Patient Retention CRM
      </p>

      {/* Loading Text */}
      <div
        style={{
          fontSize: '18px',
          color: '#fff',
          marginBottom: '24px',
          animation: 'textPulse 1.5s ease-in-out infinite',
        }}
      >
        Loading patient data...
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '300px',
          height: '6px',
          backgroundColor: '#1a1f2a',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: '#00d4a8',
            borderRadius: '3px',
            animation: 'progressBar 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Loading Animation Styles */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes logoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          @keyframes textPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }

          @keyframes progressBar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSplash;