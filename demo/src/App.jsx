import { useState, useEffect } from 'react';
import { LoginScreen, SignupModal, EmailVerificationPage } from '../../src/index.js';
import { LandingPage } from './LandingPage.jsx';
import './App.css';

// API Base URL - pointing to data-q.org API
const API_BASE_URL = 'https://data-q.org/api';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Check for verification token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setVerificationToken(token);
      setShowVerification(true);
      setShowLogin(false);
      setShowSignup(false);
    }
  }, []);

  // Load user from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setShowLogin(false);
      }
    } catch (e) {
      console.error('Failed to load user:', e);
    }
  }, []);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
    showToast(`Welcome back, ${userData.name || userData.email}!`, 'success');
  };

  const handleSignup = (userData) => {
    showToast('Account created! Please check your email to verify your account.', 'success');
    setShowSignup(false);
    setShowLogin(false); // Close modals, show landing page
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setShowLogin(false);
    setShowSignup(false);
    showToast('Logged out successfully', 'info');
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    setShowLogin(false); // Don't auto-show login, let user click the button
    // Clear token from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // If showing verification page
  if (showVerification && verificationToken) {
    return (
      <EmailVerificationPage
        token={verificationToken}
        apiBaseUrl={API_BASE_URL}
        appName="Shared Auth Demo"
        primaryColor="#6366f1"
        onVerificationComplete={handleVerificationComplete}
        showToast={showToast}
      />
    );
  }

  // If user is logged in, show dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Shared Auth Components Demo
                </h1>
                <p className="text-sm text-gray-500 mt-1">Testing authentication components</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome back, {user.name || user.email.split('@')[0]}!</h2>
                <p className="text-blue-100">You're successfully logged in</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                User Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {user.role || 'user'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.email_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.email_verified ? '✓ Verified' : '✗ Not Verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Account Details
              </h3>
              <div className="space-y-3">
                {user.organization_id && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Organization ID</span>
                    <span className="text-sm font-medium text-gray-900 font-mono">{user.organization_id}</span>
                  </div>
                )}
                {user.is_organization_admin !== undefined && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Organization Admin</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_organization_admin 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_organization_admin ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {user.is_system_owner && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">System Owner</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      ✓ Yes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Info Card */}
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-lg p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              System Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <p className="text-xs text-gray-500 mb-1">API Endpoint</p>
                <p className="text-sm font-mono font-medium text-gray-900 break-all">{API_BASE_URL}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <p className="text-xs text-gray-500 mb-1">Database</p>
                <p className="text-sm font-medium text-gray-900">data-q.org</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <p className="text-xs text-gray-500 mb-1">App URL</p>
                <p className="text-sm font-medium text-gray-900">data-q.org/app/demo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm ${
                toast.type === 'success' ? 'bg-green-500/90 text-white' :
                toast.type === 'error' ? 'bg-red-500/90 text-white' :
                'bg-blue-500/90 text-white'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show landing page with modals
  return (
    <>
      <LandingPage
        onLoginClick={() => setShowLogin(true)}
        onSignupClick={() => setShowSignup(true)}
      />

      {/* Login Modal */}
      <LoginScreen
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        apiBaseUrl={API_BASE_URL}
        appName="Shared Auth Demo"
        primaryColor="#6366f1"
        onLogin={handleLogin}
        showToast={showToast}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        apiBaseUrl={API_BASE_URL}
        appName="Shared Auth Demo"
        primaryColor="#6366f1"
        onSignup={handleSignup}
        showToast={showToast}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;

