import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // Reset error boundary state
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-200 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-red-300/50 shadow-2xl text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              Oops! Something went wrong
            </h2>
            
            <p className="text-red-700 mb-6 leading-relaxed">
              We encountered an unexpected error. Don't worry, this has been logged and we're working to fix it.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={this.handleRetry}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Try Again
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Reload Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-red-600 font-medium">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded-lg text-sm text-red-800 font-mono">
                  <div className="font-bold">Error:</div>
                  <div className="mb-2">{this.state.error.toString()}</div>
                  {this.state.errorInfo.componentStack && (
                    <>
                      <div className="font-bold">Component Stack:</div>
                      <div className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </div>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;