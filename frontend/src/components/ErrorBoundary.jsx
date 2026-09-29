import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error(
        "CareerBridge frontend error:",
        error,
        errorInfo,
      );
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="error-boundary-page">
        <section className="error-boundary-card">
          <a href="/" className="auth-brand">
            <span>CB</span>
            CareerBridge
          </a>

          <p className="error-boundary-code">
            Something went wrong
          </p>

          <h1>We could not display this page.</h1>

          <p className="auth-subtitle">
            ページの表示中に問題が発生しました。
            再読み込みしてもう一度お試しください。
          </p>

          <div className="error-boundary-actions">
            <button
              className="submit-button"
              type="button"
              onClick={this.handleReload}
            >
              Reload page
            </button>

            <a className="back-link" href="/">
              Go to home
            </a>
          </div>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;