import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const ReadmeEditorModal = ({ 
  selectedRepo, 
  generatedReadme, 
  setGeneratedReadme,
  isAnalyzing, 
  onClose, 
  onSave, 
  commitMessage, 
  setCommitMessage,
  isSaving,
  saveSuccess 
}) => {
  const [activeTab, setActiveTab] = useState('editor');
  // Helper to reset state
  const resetState = () => {
    setGeneratedReadme('');
    setCommitMessage('');
  };

  const sanitizeContent = (content) => {
    if (!content) return '';
    
    let cleaned = content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\[\s*\]\(\s*\)/g, '')
      .replace(/!\[\s*\]\(\s*\)/g, '')
      .replace(/```\s*\n\s*```/g, '')
      .trim(); 
    
    return cleaned;
  };

  // Handler for modal close
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Handler for save to GitHub
  const handleSave = () => {
    const cleanedReadme = sanitizeContent(generatedReadme);
    setGeneratedReadme(cleanedReadme);
    onSave(cleanedReadme);
  };

  return (
    <div className="fixed inset-0 bg-amber-50/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-amber-100/95 via-yellow-100/80 to-orange-100/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col border border-amber-300/20">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-100/60 via-yellow-100/40 to-orange-100/60 p-8 rounded-t-3xl border-b border-amber-300/20 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-800">{selectedRepo}</h2>
                <p className="text-amber-600 text-sm mt-1">Edit your README</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-amber-200/50 hover:bg-amber-300 text-amber-700 hover:text-amber-800 rounded-2xl flex items-center justify-center transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-grow flex flex-col xl:grid xl:grid-cols-2 gap-4 p-4 overflow-hidden">
          {/* Mobile Toggle Buttons */}
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
          
          {/* Editor */}
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

          {/* Preview */}
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
                    rehypePlugins={[rehypeRaw]}
                  >
                    {sanitizeContent(generatedReadme)}
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
        </div>

        {/* Modal Footer */}
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
              onClick={handleSave}
              className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 whitespace-nowrap shadow-xl ${
                saveSuccess
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white'
              } disabled:opacity-50`}
              disabled={isSaving || !generatedReadme.trim()}
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
      </div>
    </div>
  );
};

export default ReadmeEditorModal;
