import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

const PreviewTab = ({ 
  generatedReadme, 
  isAnalyzing, 
  activeTab
}) => {
  return (
    <div className={`flex flex-col flex-1 overflow-y-auto bg-gradient-to-br from-amber-100/60 via-yellow-100/20 to-orange-100/60 backdrop-blur-xl rounded-3xl border border-amber-500/20 ${
      activeTab === 'editor' ? 'xl:block hidden' : 'block'
    }`}>
      <div className="flex items-center space-x-4 p-6 pb-4 shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-amber-800">Preview</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin">
        {isAnalyzing ? (
          <div className="text-amber-600 text-center py-8">
            <svg className="w-8 h-8 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Generating content...</p>
          </div>
        ) : generatedReadme ? (
          <div className="markdown-preview text-amber-900 leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {generatedReadme}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-amber-600 text-center py-8">
            <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p>Your README preview will appear here</p>
            <p className="text-sm mt-2">Start typing in the editor to see live preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewTab;