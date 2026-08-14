import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div role="status" aria-label="Loading content" style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '48px 24px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #e5e7eb',
      borderTop: '3px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      marginBottom: '16px'
    }} />
    <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>{message}</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default LoadingSpinner;
