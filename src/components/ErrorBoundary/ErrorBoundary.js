import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{error && error.toString()}</p>
          <button onClick={this.handleReload}>Reload</button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;