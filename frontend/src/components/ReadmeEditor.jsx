import React, { useEffect } from 'react';
import { useReadmeSaving } from '../hooks/useDashboard';
import ReadmeEditorModal from './ReadmeEditorModal';

const ReadmeEditor = ({
  selectedRepo,
  generatedReadme,
  setGeneratedReadme,
  isAnalyzing,
  onClose,
  onError
}) => {
  const {
    commitMessage,
    setCommitMessage,
    isSaving,
    saveSuccess,
    handleSaveToGithub,
    resetSaveState
  } = useReadmeSaving(selectedRepo, generatedReadme, onClose);

  // Reset save state when modal opens for a new repository
  useEffect(() => {
    if (selectedRepo) {
      resetSaveState();
    }
  }, [selectedRepo, resetSaveState]);

  const onSave = () => {
    handleSaveToGithub(onError);
  };

  const handleClose = () => {
    resetSaveState();
    onClose();
  };

  if (!selectedRepo) {
    return null;
  }

  return (
    <ReadmeEditorModal
      selectedRepo={selectedRepo}
      generatedReadme={generatedReadme}
      setGeneratedReadme={setGeneratedReadme}
      isAnalyzing={isAnalyzing}
      onClose={handleClose}
      onSave={onSave}
      commitMessage={commitMessage}
      setCommitMessage={setCommitMessage}
      isSaving={isSaving}
      saveSuccess={saveSuccess}
    />
  );
};

export default ReadmeEditor;