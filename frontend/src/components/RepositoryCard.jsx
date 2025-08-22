import React from 'react';

const RepositoryCard = ({ repo, isAnalyzing, selectedRepo, onAnalyzeRepo }) => {
  return (
    <div className="group bg-gradient-to-br from-amber-100/60 via-yellow-100/30 to-orange-100/60 backdrop-blur-xl p-8 rounded-3xl border border-amber-300/20 hover:border-amber-400/50 hover:from-amber-100/80 hover:via-yellow-100/50 hover:to-orange-100/80 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className={`px-4 py-2 text-sm font-medium rounded-full ${
            repo.private ? 'bg-gradient-to-r from-red-400/20 to-pink-400/20 text-red-700 border border-red-400/30' : 'bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-700 border border-green-400/30'
          }`}>
            {repo.private ? 'Private' : 'Public'}
          </span>
        </div>
        
        <div>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-bold text-amber-800 hover:text-amber-600 transition-colors duration-300 group-hover:underline"
          >
            {repo.fullName}
          </a>
          <p className="text-amber-700 mt-3 text-base leading-relaxed">
            {repo.description || 'No description provided'}
          </p>
        </div>
      </div>
      
      <button
        onClick={() => onAnalyzeRepo(repo.fullName)}
        className={`mt-6 w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
          isAnalyzing && selectedRepo === repo.fullName
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-xl'
            : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl'
        } disabled:opacity-50`}
        disabled={isAnalyzing}
      >
        {isAnalyzing && selectedRepo === repo.fullName ? (
          <span className="flex items-center justify-center space-x-3">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analyzing...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Generate README</span>
          </span>
        )}
      </button>
    </div>
  );
};

export default RepositoryCard;
