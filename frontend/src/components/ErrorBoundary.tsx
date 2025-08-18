import React, { Component } from 'react';

type ErrorBoundaryState = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends Component<React.PropsWithChildren<unknown>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-message">Please try again or reload the page.</p>
          <button className="btn" onClick={() => location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
