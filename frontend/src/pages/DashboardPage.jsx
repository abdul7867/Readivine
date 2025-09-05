import React, { useEffect } from 'react';

// Import custom hooks
import {
  useDashboardData,
  useReadmeGeneration,
  useReadmeSaving,
  useDashboardAuth
} from '../hooks/useDashboard';

// Import modular components
import Header from '../components/Header';
import TemplateSelector from '../components/TemplateSelector';
import StatsSection from '../components/StatsSection';
import RepositoryList from '../components/RepositoryList';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import ReadmeEditor from '../components/ReadmeEditor';

const DashboardPage = () => {
  // Use custom hooks for state management
  const { repos, templates, loading, error, fetchData, handleRetry, setError } = useDashboardData();
  const {
    selectedTemplate,
    setSelectedTemplate,
    isAnalyzing,
    generatedReadme,
    setGeneratedReadme,
    selectedRepo,
    handleAnalyzeRepo,
    resetReadmeState
  } = useReadmeGeneration();
  const { handleLogout } = useDashboardAuth();

  // Initialize data fetching on mount - with authentication check
  useEffect(() => {
    // Only fetch data if we have the fetchData function
    if (fetchData) {
      fetchData();
    }
  }, [fetchData]);

  // Handle repository analysis with error callback
  const onAnalyzeRepo = (repoFullName) => {
    handleAnalyzeRepo(repoFullName, setError);
  };

  // Handle retry with specific error handling
  const onRetry = () => {
    if (error && error.includes('Failed to analyze')) {
      setError('');
      resetReadmeState(setError);
      fetchData();
      return;
    }
    handleRetry();
  };

  // Enhanced close handler that clears errors
  const handleModalClose = () => {
    resetReadmeState(setError);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={onRetry} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 text-amber-900 px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Header onLogout={handleLogout} />

        {/* Template Selector */}
        <TemplateSelector
          templates={templates}
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
        />

        {/* Stats Section */}
        <StatsSection
          repos={repos}
          templates={templates}
          isAnalyzing={isAnalyzing}
        />

        {/* Repository List */}
        <RepositoryList
          repos={repos}
          isAnalyzing={isAnalyzing}
          selectedRepo={selectedRepo}
          onAnalyzeRepo={onAnalyzeRepo}
        />
      </div>

      {/* README Editor Modal */}
      <ReadmeEditor
        selectedRepo={selectedRepo}
        generatedReadme={generatedReadme}
        setGeneratedReadme={setGeneratedReadme}
        isAnalyzing={isAnalyzing}
        onClose={handleModalClose}
        onError={setError}
      />
    </div>
  );
};

export default DashboardPage;