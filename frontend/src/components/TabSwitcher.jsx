import React from 'react';

const TabSwitcher = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex xl:hidden gap-3 mb-4 shrink-0">
      <button
        onClick={() => setActiveTab('editor')}
        className={`flex-1 py-3 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
          activeTab === 'editor'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl'
            : 'bg-amber-100/80 text-amber-700 hover:bg-amber-200/80 border border-green-500/30'
        }`}
      >
        <span className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Editor</span>
        </span>
      </button>
      <button
        onClick={() => setActiveTab('preview')}
        className={`flex-1 py-3 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
          activeTab === 'preview'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl'
            : 'bg-amber-100/80 text-amber-700 hover:bg-amber-200/80 border border-amber-500/30'
        }`}
      >
        <span className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Preview</span>
        </span>
      </button>
    </div>
  );
};

export default TabSwitcher;