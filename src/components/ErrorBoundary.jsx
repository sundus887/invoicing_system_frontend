// src/components/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '', info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    // Log for diagnostics
    // You could send this to a logging service
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      const details = this.state.info?.componentStack || '';
      return (
        <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            maxWidth: 900,
            margin: '24px auto'
          }}>
            <h2 style={{ margin: 0, marginBottom: 8 }}>Something went wrong</h2>
            <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
              {this.state.message || 'Unexpected render error.'}
            </div>
            {details ? (
              <details style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
                <summary>Stack trace</summary>
                {details}
              </details>
            ) : null}
            <div style={{ marginTop: 12, fontSize: 13 }}>
              Try reloading the page. If this keeps happening, share a screenshot of this box and the Network + Console tabs.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
