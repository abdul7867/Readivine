import React from 'react';

const Header = ({ onLogout }) => {
  return (
    <div className="bg-gradient-to-r from-amber-100/80 via-yellow-100/60 to-orange-100/80 backdrop-blur-xl rounded-3xl p-8 border border-amber-300/20 shadow-2xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-0">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-800 via-yellow-700 to-orange-800 text-transparent bg-clip-text">
              Repositories
            </h1>
            <p className="text-amber-700 mt-2 text-lg">Generate stunning READMEs for your projects</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl w-full lg:w-auto"
        >
          <span className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Header;
