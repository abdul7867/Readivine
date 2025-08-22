import React from 'react';

const StatsSection = ({ repos, templates, isAnalyzing }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="group bg-gradient-to-br from-amber-100/60 via-yellow-100/40 to-orange-100/60 backdrop-blur-xl rounded-3xl p-8 border border-amber-300/20 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-2xl transition-all duration-300">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-4xl font-bold text-amber-800 mb-2">{repos.length}</p>
        <p className="text-amber-700 text-lg font-medium">Repositories</p>
      </div>
      
      <div className="group bg-gradient-to-br from-yellow-100/60 via-orange-100/40 to-red-100/60 backdrop-blur-xl rounded-3xl p-8 border border-yellow-300/20 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-2xl transition-all duration-300">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <p className="text-4xl font-bold text-yellow-800 mb-2">{templates.length}</p>
        <p className="text-yellow-700 text-lg font-medium">Templates</p>
      </div>
      
      <div className="group bg-gradient-to-br from-green-100/60 via-emerald-100/40 to-teal-100/60 backdrop-blur-xl rounded-3xl p-8 border border-green-300/20 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-2xl transition-all duration-300">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-4xl font-bold text-green-800 mb-2">{isAnalyzing ? 'Working' : 'Ready'}</p>
        <p className="text-green-700 text-lg font-medium">Status</p>
      </div>
    </div>
  );
};

export default StatsSection;
