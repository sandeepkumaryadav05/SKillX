import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          maxWidth: '420px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '24px' }}>
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.78rem',
                color: '#9ca3af',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Try again without refreshing
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
