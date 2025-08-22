import React from 'react';
import RepositoryCard from './RepositoryCard';

const RepositoryList = ({ repos, isAnalyzing, selectedRepo, onAnalyzeRepo }) => {
  if (repos.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-100/60 via-yellow-100/30 to-orange-100/60 backdrop-blur-xl rounded-3xl p-16 text-center border-2 border-amber-300/20 shadow-2xl">
        <div className="w-32 h-32 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-3xl font-bold text-amber-800 mb-4">No repositories found</h3>
        <p className="text-amber-700 text-xl mb-8">
          It looks like you don't have any repositories yet, or they're not accessible.
        </p>
        <div className="bg-amber-100/60 rounded-2xl p-6 max-w-md mx-auto border border-amber-300/20">
          <p className="text-amber-800 text-base">
            Make sure you have repositories on GitHub and that you've granted access to this application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {repos.map((repo) => (
        <RepositoryCard
          key={repo.id}
          repo={repo}
          isAnalyzing={isAnalyzing}
          selectedRepo={selectedRepo}
          onAnalyzeRepo={onAnalyzeRepo}
        />
      ))}
    </div>
  );
};

export default RepositoryList;
