import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Custom hook for managing dashboard data (repos and templates)
export const useDashboardData = () => {
  const { logout, isAuthenticated } = useAuth();
  const [repos, setRepos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch repositories and templates from API
  const fetchData = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const [repoResponse, templateResponse] = await Promise.all([
        api.get('/github/repos'),
        api.get('/templates'),
      ]);
      setRepos(repoResponse.data.data || []);
      setTemplates(templateResponse.data.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      if (err.response?.status === 401) {
        const errorMsg = 'Your session has expired. Please log in again.';
        setError(errorMsg);
        toast.error(errorMsg);
        setTimeout(() => logout(), 2000);
      } else {
        const errorMsg = 'Failed to load data. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout, isAuthenticated]);

  const handleRetry = useCallback(() => {
    setError('');
    toast.dismiss(); // Clear any existing toasts
    fetchData();
  }, [fetchData]);

  return {
    repos,
    templates,
    isLoading,
    error,
    fetchData,
    handleRetry,
    setError
  };
};

// Custom hook for managing README generation workflow
export const useReadmeGeneration = () => {
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
    
    // Show loading toast
    const loadingToast = toast.loading(`Analyzing ${repoFullName}...`);
    
    try {
      const response = await api.post('/github/analyze', {
        repoFullName: repoFullName,
        templateId: selectedTemplate,
      });
      setGeneratedReadme(response.data.data.readme);
      toast.success(`Successfully analyzed ${repoFullName}!`, { id: loadingToast });
    } catch (err) {
      console.error('Failed to analyze repository:', err);
      const errorMsg = `Failed to analyze ${repoFullName}. Please try again.`;
      
      if (onError) {
        onError(errorMsg);
      }
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedTemplate]);

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
  const defaultCommitMessage = 'docs: add generated README.md';
  const [commitMessage, setCommitMessage] = useState(defaultCommitMessage);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveToGithub = useCallback(async (onError) => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Show loading toast
    const loadingToast = toast.loading(`Saving README to ${selectedRepo}...`);
    
    try {
      await api.post('/github/save-readme', {
        repoFullName: selectedRepo,
        readmeContent: generatedReadme,
        commitMessage: commitMessage,
      });
      setSaveSuccess(true);
      // Reset commit message to default after successful save
      setCommitMessage(defaultCommitMessage);
      toast.success(`Successfully saved README to ${selectedRepo}!`, { id: loadingToast });
      setTimeout(() => {
        setSaveSuccess(false);
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to save README:', err);
      const errorMsg = `Failed to save README to ${selectedRepo}.`;
      
      if (onError) {
        onError(errorMsg);
      }
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  }, [selectedRepo, generatedReadme, commitMessage, onClose]);

  const resetSaveState = useCallback(() => {
    setCommitMessage(defaultCommitMessage);
    setIsSaving(false);
    setSaveSuccess(false);
  }, []);

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
      toast.success('Successfully logged out!');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      toast.error('Logout failed, but redirecting to login...');
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  }, [logout, navigate]);

  return { handleLogout };
};