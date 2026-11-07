import React from 'react';
import { AlertTriangle, RefreshCw, Sparkles, LayoutDashboard } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TaskPulse Global ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (targetView = 'dashboard') => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.hash = `#${targetView}`;
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'var(--bg-main, #f8fafc)'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
              padding: '2rem',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <AlertTriangle style={{ width: '28px', height: '28px' }} />
            </div>

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary, #0f172a)',
                margin: '0 0 0.5rem 0'
              }}
            >
              View Encountered an Issue
            </h2>

            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary, #64748b)',
                lineHeight: '1.5',
                margin: '0 0 1.5rem 0'
              }}
            >
              We caught an unexpected error while rendering this workspace view. Your data is completely safe in the database.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#991b1b',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: '100px'
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                onClick={() => this.handleReset('chat')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Sparkles style={{ width: '15px', height: '15px' }} />
                <span>Open PulseBot AI</span>
              </button>

              <button
                onClick={() => this.handleReset('dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <LayoutDashboard style={{ width: '15px', height: '15px' }} />
                <span>Go to Dashboard</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: '#64748b',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: '1px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw style={{ width: '14px', height: '14px' }} />
                <span>Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

