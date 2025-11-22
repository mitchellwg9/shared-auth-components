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
    setShowLogin(false);
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
    setShowLogin(false);
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
        </div>

                <div className="fixed bottom-4 right-4 space-y-2 z-50">
                  {toasts.map(toast => (
                    <div
                      key={toast.id}
                      className={`px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm font-medium ${
                        toast.type === 'success' ? 'bg-green-500/90 text-white' :
                        toast.type === 'error' ? 'bg-red-600/90 text-white border-2 border-red-700/50' :
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
  // Debug: Log to verify this code is running
  console.log('✅ App.jsx: Rendering LandingPage component');
  
  return (
    <>
      <LandingPage
        onLoginClick={() => {
          console.log('Login button clicked');
          setShowLogin(true);
        }}
        onSignupClick={() => {
          console.log('Signup button clicked');
          setShowSignup(true);
        }}
      />

      {/* Login Modal - only render when showLogin is true */}
      {showLogin && (
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
      )}

      {/* Signup Modal - only render when showSignup is true */}
      {showSignup && (
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
      )}

      {/* Toast Container */}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
              {toasts.map(toast => (
                <div
                  key={toast.id}
                  className={`px-4 py-3 rounded-lg shadow-lg font-medium ${
                    toast.type === 'success' ? 'bg-green-500 text-white' :
                    toast.type === 'error' ? 'bg-red-600 text-white border-2 border-red-700' :
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

