import React from 'react';

const ModalFooter = ({ 
  commitMessage, 
  setCommitMessage, 
  onSave, 
  isSaving, 
  saveSuccess, 
  hasContent 
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-100/60 via-yellow-100/40 to-orange-100/60 p-6 rounded-b-3xl border-t border-amber-300/20 shrink-0">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1">
            <label htmlFor="commit-message" className="block text-lg font-semibold text-amber-800 mb-2">
              Commit Message
            </label>
            <input
              id="commit-message"
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full bg-white/80 text-amber-900 p-4 rounded-2xl border-2 border-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 shadow-lg"
              placeholder="docs: add generated README.md"
              disabled={isSaving}
            />
          </div>
        </div>
        
        <button
          onClick={onSave}
          className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 whitespace-nowrap shadow-xl ${
            saveSuccess
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white'
          } disabled:opacity-50`}
          disabled={isSaving || !hasContent}
        >
          {isSaving ? (
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </span>
          ) : saveSuccess ? (
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Saved!</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Save to GitHub</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModalFooter;