import React, { useState } from 'react';
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
  
  // Helper to reset all modal state
  const resetState = () => {
    setGeneratedReadme('');
    setCommitMessage('');
    setActiveTab('editor'); // Reset to default tab
  };

  const sanitizeContent = (content) => {
    if (!content) return '';
    
    let cleaned = content
      // Only remove very specific AI response prefixes at the start
      .replace(/^(Here's a|Here is a|I'll create a|I will generate a|Let me create a|Based on your repository, here's a|The following is a generated|This is a generated).*?README.*?(?=\n#|\n\n#)/si, '')
      .replace(/^Here's the generated README.*?(?=\n#|\n\n#)/si, '')
      // Remove AI commentary that appears before actual content
      .replace(/^.*?I'll analyze.*?and generate.*?(?=\n#|\n\n#)/si, '')
      // Remove multiple newlines (safe)
      .replace(/\n{3,}/g, '\n\n')
      // Remove empty links and images (safe)
      .replace(/\[\s*\]\(\s*\)/g, '')
      .replace(/!\[\s*\]\(\s*\)/g, '')
      // Remove empty code blocks (safe)
      .replace(/```\s*\n\s*```/g, '')
      // Remove only truly empty headers (more specific)
      .replace(/^\s*#{1,6}\s*$\n?/gm, '')
      // Clean up malformed tables (safe)
      .replace(/\|\s*\|\s*\|/g, '|')
      // Remove HTML comments (safe)
      .replace(/<!--[\s\S]*?-->/g, '')
      // Ensure proper spacing after headers (safe)
      .replace(/(#{1,6}\s+.+)\n([^\n#])/g, '$1\n\n$2')
      // Remove trailing whitespace (safe)
      .replace(/[ \t]+$/gm, '')
      // Fix broken markdown links (safe)
      .replace(/\[([^\]]+)\]\(\s*\)/g, '**$1**')
      // Remove incomplete bullet points (safe)
      .replace(/^\s*[-*+]\s*$\n?/gm, '')
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
            sanitizeContent={sanitizeContent}
          />
        </div>

        {/* Modal Footer */}
        <ModalFooter 
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          onSave={handleSave}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          hasContent={!!generatedReadme.trim()}
        />
      </div>
    </div>
  );
};

export default ReadmeEditorModal;
