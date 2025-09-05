import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login, error, clearError } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check for authentication error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    if (authError === 'auth_failed') {
      setLoginError('Authentication failed. Please try again.');
      // Clear error from URL without page reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleLogin = async () => {
    clearError();
    setLoginError('');
    try {
      await login();
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Failed to initiate login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-yellow-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text">
              Readivine
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">How it Works</a>
            <a href="#about" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">About</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 text-transparent bg-clip-text">
                Generate Stunning
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-transparent bg-clip-text">
                README Files
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-amber-700 max-w-3xl mx-auto leading-relaxed">
              Transform your GitHub repositories with Readivine's AI-powered README generation. 
              Professional, engaging, and perfectly tailored to your project.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-16">
            {(error || loginError) && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-md mx-auto">
                {error || loginError}
              </div>
            )}
            <button 
              onClick={handleLogin}
              className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center space-x-3">
                <svg className="w-7 h-7" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                </svg>
                <span>Get Started with GitHub</span>
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-800 mb-2">1000+</div>
              <div className="text-amber-700">Projects Enhanced</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-800 mb-2">50+</div>
              <div className="text-amber-700">Templates Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-800 mb-2">24/7</div>
              <div className="text-amber-700">AI Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-amber-800 mb-6">
              Why Choose Readivine?
            </h2>
            <p className="text-xl text-amber-700 max-w-2xl mx-auto">
              Our intelligent system creates professional README files that showcase your projects perfectly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-amber-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-4">AI-Powered Generation</h3>
              <p className="text-amber-700 leading-relaxed">
                Advanced AI analyzes your repository and creates comprehensive, engaging README files automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-amber-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Multiple Templates</h3>
              <p className="text-amber-700 leading-relaxed">
                Choose from a variety of professional templates designed for different project types and styles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-amber-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-4">GitHub Integration</h3>
              <p className="text-amber-700 leading-relaxed">
                Seamlessly integrate with GitHub to automatically save and update README files in your repositories.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-amber-800 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-amber-700 max-w-2xl mx-auto">
              Get your professional README in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white shadow-xl">
                  1
                </div>
                {isDesktop && (
                  <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 transform -translate-y-1/2"></div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Connect GitHub</h3>
              <p className="text-amber-700">
                Sign in with your GitHub account to access your repositories
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white shadow-xl">
                  2
                </div>
                {isDesktop && (
                  <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 transform -translate-y-1/2"></div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Choose Template</h3>
              <p className="text-amber-700">
                Select from our collection of professional README templates
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white shadow-xl">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Generate & Save</h3>
              <p className="text-amber-700">
                AI generates your README and saves it directly to GitHub
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-amber-100/80 to-orange-100/80 backdrop-blur-xl rounded-3xl p-12 border border-amber-300/50 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-amber-800 mb-6">
              Ready to Transform Your Projects?
            </h2>
            <p className="text-xl text-amber-700 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already creating stunning README files with Readivine's AI assistance.
            </p>
            <button 
              onClick={handleLogin}
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
              </svg>
              Start Creating Now
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer id="about" className="relative z-10 px-6 py-12 border-t border-amber-200/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text">
              Readivine
            </span>
          </div>
          <p className="text-amber-600 mb-4">
            Empowering developers to create professional documentation with AI
          </p>
          <div className="flex justify-center space-x-6 text-sm text-amber-600">
            <span>© 2024 Readivine</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;