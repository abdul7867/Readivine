import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import modular components
import Header from '../components/Header';
import TemplateSelector from '../components/TemplateSelector';
import StatsSection from '../components/StatsSection';
import RepositoryList from '../components/RepositoryList';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import ReadmeEditorModal from '../components/ReadmeEditorModal';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
});

const DashboardPage = () => {
  // Fetch repositories and templates from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [repoResponse, templateResponse] = await Promise.all([
        apiClient.get('/github/repos'),
        apiClient.get('/templates'),
      ]);
      setRepos(repoResponse.data.data);
      setTemplates(templateResponse.data.data);
      setIsLoggedIn(true);
    } catch (err) {
      setError('⚠️ Your session may have expired. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } finally {
      setLoading(false);
    }
  };
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);

  const [commitMessage, setCommitMessage] = useState('docs: add generated README.md');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
  // Initial data fetch on mount
  fetchData();
  }, [navigate]);

  const handleAnalyzeRepo = async (repoFullName) => {
    setIsAnalyzing(true);
    setGeneratedReadme('');
    setSelectedRepo(repoFullName);
    setSaveSuccess(false);
    try {
      const response = await apiClient.post('/github/analyze', {
        repoFullName: repoFullName,
        templateId: selectedTemplate,
      });
      setGeneratedReadme(response.data.data.readme);
    } catch (err) {
      setError(`❌ Failed to analyze ${repoFullName}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToGithub = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient.post('/github/save-readme', {
        repoFullName: selectedRepo,
        readmeContent: generatedReadme,
        commitMessage: commitMessage,
      });
      setSaveSuccess(true);
      setTimeout(() => closeModal(), 2000);
    } catch (err) {
      setError(`❌ Failed to save README to ${selectedRepo}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggedIn(false);
      navigate('/login');
    }
  };

  const closeModal = () => {
    setSelectedRepo(null);
    setGeneratedReadme('');
    setSaveSuccess(false);
  };

  const handleRetry = () => {
    // If error is from generating README, reset dashboard states and reload data
    if (error && error.includes('Failed to analyze')) {
      setError('');
      setSelectedRepo(null);
      setGeneratedReadme('');
      setSaveSuccess(false);
      setIsAnalyzing(false);
      // Fetch latest repos/templates after error
      fetchData();
      return;
    }
    // For other errors, just retry data fetch
    setError('');
    fetchData();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
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
          onAnalyzeRepo={handleAnalyzeRepo}
        />
      </div>

      {/* README Editor Modal */}
      {selectedRepo && (
        <ReadmeEditorModal
          selectedRepo={selectedRepo}
          generatedReadme={generatedReadme}
          setGeneratedReadme={setGeneratedReadme}
          isAnalyzing={isAnalyzing}
          onClose={closeModal}
          onSave={handleSaveToGithub}
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
        />
      )}
    </div>
  );
};

export default DashboardPage;