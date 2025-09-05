import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Custom hook for managing dashboard data (repos and templates)
export const useDashboardData = () => {
  const { logout, apiClient, isAuthenticated } = useAuth();
  const [repos, setRepos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch repositories and templates from API
  const fetchData = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [repoResponse, templateResponse] = await Promise.all([
        apiClient.get('/github/repos'),
        apiClient.get('/templates'),
      ]);
      setRepos(repoResponse.data.data || []);
      setTemplates(templateResponse.data.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      if (err.response?.status === 401) {
        setError('⚠️ Your session has expired. Please log in again.');
        setTimeout(() => logout(), 2000);
      } else {
        setError('⚠️ Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [apiClient, logout, isAuthenticated]);

  const handleRetry = useCallback(() => {
    setError('');
    fetchData();
  }, [fetchData]);

  return {
    repos,
    templates,
    loading,
    error,
    fetchData,
    handleRetry,
    setError
  };
};

// Custom hook for managing README generation workflow
export const useReadmeGeneration = () => {
  const { apiClient } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);

  const handleAnalyzeRepo = useCallback(async (repoFullName, onError) => {
    setIsAnalyzing(true);
    setGeneratedReadme('');
    setSelectedRepo(repoFullName);
    
    // Clear any previous errors when starting new analysis
    if (onError) {
      onError('');
    }
    
    try {
      const response = await apiClient.post('/github/analyze', {
        repoFullName: repoFullName,
        templateId: selectedTemplate,
      });
      setGeneratedReadme(response.data.data.readme);
    } catch (err) {
      console.error('Failed to analyze repository:', err);
      if (onError) {
        onError(`❌ Failed to analyze ${repoFullName}. Please try again.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiClient, selectedTemplate]);

  const resetReadmeState = useCallback((clearError) => {
    setSelectedRepo(null);
    setGeneratedReadme('');
    // Clear errors if error clearing function is provided
    if (clearError && typeof clearError === 'function') {
      clearError('');
    }
  }, []);

  return {
    selectedTemplate,
    setSelectedTemplate,
    isAnalyzing,
    generatedReadme,
    setGeneratedReadme,
    selectedRepo,
    handleAnalyzeRepo,
    resetReadmeState
  };
};

// Custom hook for managing README saving workflow
export const useReadmeSaving = (selectedRepo, generatedReadme, onClose) => {
  const { apiClient } = useAuth();
  const defaultCommitMessage = 'docs: add generated README.md';
  const [commitMessage, setCommitMessage] = useState(defaultCommitMessage);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveToGithub = useCallback(async (onError) => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await apiClient.post('/github/save-readme', {
        repoFullName: selectedRepo,
        readmeContent: generatedReadme,
        commitMessage: commitMessage,
      });
      setSaveSuccess(true);
      // Reset commit message to default after successful save
      setCommitMessage(defaultCommitMessage);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to save README:', err);
      if (onError) {
        onError(`❌ Failed to save README to ${selectedRepo}.`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [apiClient, selectedRepo, generatedReadme, commitMessage, onClose, defaultCommitMessage]);

  // Reset function for cleaning up save states
  const resetSaveState = useCallback(() => {
    setCommitMessage(defaultCommitMessage);
    setIsSaving(false);
    setSaveSuccess(false);
  }, [defaultCommitMessage]);

  return {
    commitMessage,
    setCommitMessage,
    isSaving,
    saveSuccess,
    handleSaveToGithub,
    resetSaveState
  };
};

// Custom hook for managing authentication actions
export const useDashboardAuth = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  }, [logout, navigate]);

  return { handleLogout };
};