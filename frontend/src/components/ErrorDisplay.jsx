import React from 'react';

const ErrorDisplay = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 text-amber-900 flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-8">
        <div className="w-24 h-24 bg-gradient-to-br from-red-400 via-pink-400 to-orange-400 rounded-full flex items-center justify-center mx-auto shadow-2xl">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-red-600">Session Expired</h2>
          <p className="text-red-700 text-lg">{error}</p>
        </div>
        <div className="bg-gradient-to-r from-red-100/30 via-pink-100/20 to-orange-100/30 border border-red-400/30 rounded-2xl p-6">
          <p className="text-red-700 text-base">Redirecting to login page...</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
