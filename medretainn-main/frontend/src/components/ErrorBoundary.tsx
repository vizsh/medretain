import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div style={{
    backgroundColor: '#141921',
    padding: '40px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    textAlign: 'center',
    color: '#fff',
  }}>
    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.7 }}>⚠️</div>
    <h2 style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 600, color: '#ff6b6b' }}>
      Something went wrong
    </h2>
    <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#9ca3af', maxWidth: '400px', marginInline: 'auto' }}>
      {error?.message || 'An unexpected error occurred while loading this page.'}
    </p>
    <button
      onClick={resetError}
      style={{
        padding: '12px 24px',
        backgroundColor: '#4cc9f0',
        color: '#0a0d12',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Try Again
    </button>
  </div>
);

export default ErrorBoundary;