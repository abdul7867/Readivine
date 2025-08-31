import React from 'react';

const EditorTab = ({ 
  generatedReadme, 
  setGeneratedReadme, 
  isAnalyzing, 
  activeTab 
}) => {
  return (
    <div className={`flex flex-col flex-1 overflow-y-auto bg-gradient-to-br from-amber-100/60 via-green-100/20 to-amber-100/60 backdrop-blur-xl rounded-3xl border border-green-500/20 ${
      activeTab === 'preview' ? 'xl:block hidden' : 'block'
    }`}>
      <div className="flex items-center space-x-4 p-6 pb-4 shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-3xl flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-amber-800">Editor</h3>
      </div>
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <textarea
          className="w-full h-full min-h-[500px] bg-white/80 text-amber-900 p-4 rounded-2xl font-mono text-sm resize-none border-2 border-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 placeholder-amber-500 shadow-lg scrollbar-thin"
          value={isAnalyzing ? "Generating content..." : generatedReadme}
          onChange={(e) => setGeneratedReadme(e.target.value)}
          disabled={isAnalyzing}
          placeholder="Your README content will appear here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default EditorTab;