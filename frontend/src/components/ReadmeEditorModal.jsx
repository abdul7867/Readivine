import React, { useState, useEffect, useCallback } from 'react';
import ModalHeader from './ModalHeader';
import TabSwitcher from './TabSwitcher';
import EditorTab from './EditorTab';
import PreviewTab from './PreviewTab';
import ModalFooter from './ModalFooter';

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
  
  const sanitizeContent = useCallback((content) => {
    if (!content) return '';
    
    // This regex is designed to find the first meaningful line of Markdown (a heading)
    // and discard any conversational intro text before it.
    const match = content.match(/(^#\s.*)/m);
    
    // If a heading is found, we take everything from that point onwards.
    // Otherwise, we fall back to a simpler trim to avoid deleting user content.
    let cleaned = match ? content.substring(match.index) : content.trim();
    
    // Additional safe clean-up rules
    cleaned = cleaned
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
      .replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments

    return cleaned;
  }, []);

  // When the modal is opened or the AI is done analyzing, sanitize the content
  useEffect(() => {
    if (generatedReadme && !isAnalyzing) {
      const cleaned = sanitizeContent(generatedReadme);
      if (cleaned !== generatedReadme) {
        setGeneratedReadme(cleaned);
      }
    }
  }, [generatedReadme, isAnalyzing, sanitizeContent, setGeneratedReadme]);

  // Handler for modal close
  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-amber-50/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-amber-100/95 via-yellow-100/80 to-orange-100/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col border border-amber-300/20">
        
        {/* Modal Header */}
        <ModalHeader 
          selectedRepo={selectedRepo} 
          onClose={handleClose} 
        />

        {/* Modal Body */}
        <div className="flex-grow flex flex-col xl:grid xl:grid-cols-2 gap-4 p-4 overflow-hidden">
          {/* Mobile Toggle Buttons */}
          <TabSwitcher 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
          
          {/* Editor */}
          <EditorTab 
            generatedReadme={generatedReadme}
            setGeneratedReadme={setGeneratedReadme}
            isAnalyzing={isAnalyzing}
            activeTab={activeTab}
          />

          {/* Preview */}
          <PreviewTab 
            generatedReadme={generatedReadme}
            isAnalyzing={isAnalyzing}
            activeTab={activeTab}
          />
        </div>

        {/* Modal Footer */}
        <ModalFooter 
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          onSave={onSave}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          hasContent={!!generatedReadme.trim()}
        />
      </div>
    </div>
  );
};

export default ReadmeEditorModal;
