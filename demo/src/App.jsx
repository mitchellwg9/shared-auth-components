import { useState, useEffect, useMemo } from 'react';
import { 
  LoginScreen, 
  SignupModal, 
  EmailVerificationPage, 
  UserProfileDropdown,
  SystemOwnerPanel,
  createOwnerAPI,
  UserProfileModal,
  UserSettingsModal,
  createAuthAPI
} from '../../src/index.js';
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');

  // Create auth API client
  const authAPI = useMemo(() => createAuthAPI(API_BASE_URL), []);

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
    // Toast is already shown by SignupModal component, no need to show it again
    setShowSignup(false);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setShowLogin(false);
    setShowSignup(false);
    setShowProfileModal(false);
    setShowSettingsModal(false);
    showToast('Logged out successfully', 'info');
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
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

  // Create owner API client if user is system owner
  const ownerAPI = useMemo(() => {
    if (user?.is_system_owner || user?.isSystemOwner) {
      return createOwnerAPI(API_BASE_URL);
    }
    return null;
  }, [user]);

  // Check if user is system owner
  const isSystemOwner = user?.is_system_owner === true || user?.isSystemOwner === true;

  // If user is logged in, show dashboard
  if (user) {
    // Show System Owner Panel if user is system owner
    if (isSystemOwner && ownerAPI) {
      return (
        <>
          <SystemOwnerPanel
            currentUser={user}
            showToast={showToast}
            onLogout={handleLogout}
            ownerAPI={ownerAPI}
            appName="Shared Auth Demo"
            primaryColor="#6366f1"
          />
          <div className="fixed bottom-4 right-4 space-y-2 z-50">
            {toasts.map(toast => (
              <div
                key={toast.id}
                className={`px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm font-medium ${
                  toast.type === 'success' ? 'bg-green-500/90 text-white' :
                  toast.type === 'error' ? 'bg-white text-red-600 border-2 border-red-300' :
                  'bg-blue-500/90 text-white'
                }`}
              >
                {toast.message}
              </div>
            ))}
          </div>
        </>
      );
    }

    // Regular user dashboard
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  Shared Auth Components Demo
                </h1>
                <p className="text-sm text-gray-500">Testing authentication components</p>
              </div>
              <UserProfileDropdown
                currentUser={user}
                onProfileClick={() => {
                  console.log('Profile clicked, setting showProfileModal to true');
                  setShowProfileModal(true);
                }}
                onSettingsClick={() => {
                  console.log('Settings clicked, setting showSettingsModal to true');
                  setShowSettingsModal(true);
                }}
                onSubscriptionClick={() => {
                  showToast('Subscription management coming soon!', 'info');
                }}
                onTeamManagementClick={() => {
                  showToast('Team management coming soon!', 'info');
                }}
                onHelpClick={() => {
                  showToast('Help & Support coming soon!', 'info');
                }}
                onLogoutClick={handleLogout}
                primaryColor="#6366f1"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
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

          {/* Component Testing Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Testing Shared Components</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">✅ UserProfileDropdown</h4>
                <p className="text-sm text-gray-600">
                  Click on your name in the top right corner to see the dropdown menu with:
                  Edit Profile, Settings, Help & Support, and Logout.
                  {user.is_organization_admin && (
                    <span className="block mt-1 text-blue-600">
                      As an organization admin, you'll also see "Manage Subscription" and "Manage Team" options.
                    </span>
                  )}
                </p>
              </div>
              {isSystemOwner && (
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">👑 App Owner Panel</h4>
                  <p className="text-sm text-purple-700 mb-2">
                    You are the app owner/creator! You have full access to the App Owner Panel with:
                    Analytics, Organizations, Subscriptions, and All Users management.
                  </p>
                  <p className="text-xs text-purple-600 italic">
                    ⚠️ This is the highest privilege level - only for app creators, never assign to customers.
                  </p>
                </div>
              )}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">User Information</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Name:</strong> {user.name || 'Not set'}</p>
                  <p><strong>Role:</strong> {user.role || 'user'}</p>
                  {user.plan && <p><strong>Plan:</strong> {user.plan}</p>}
                  {user.subscription_status && <p><strong>Subscription Status:</strong> {user.subscription_status}</p>}
                  {user.is_organization_admin && <p className="text-blue-600"><strong>Organization Admin:</strong> Yes</p>}
                  {isSystemOwner && <p className="text-purple-600"><strong>System Owner:</strong> Yes</p>}
                </div>
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
                toast.type === 'error' ? 'bg-white text-red-600 border-2 border-red-300' :
                'bg-blue-500/90 text-white'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>

        {/* Profile Modal */}
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            console.log('Closing profile modal');
            setShowProfileModal(false);
          }}
          currentUser={user}
          onUserUpdate={handleUserUpdate}
          showToast={showToast}
          authAPI={authAPI}
          primaryColor="#6366f1"
        />

        {/* Settings Modal */}
        <UserSettingsModal
          isOpen={showSettingsModal}
          onClose={() => {
            console.log('Closing settings modal');
            setShowSettingsModal(false);
          }}
          currentUser={user}
          onUserUpdate={handleUserUpdate}
          showToast={showToast}
          authAPI={authAPI}
          primaryColor="#6366f1"
        />
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
              toast.type === 'error' ? 'bg-white text-red-600 border-2 border-red-300' :
              'bg-blue-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Profile Modal - Always render, modal handles visibility */}
      {user && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            console.log('Closing profile modal');
            setShowProfileModal(false);
          }}
          currentUser={user}
          onUserUpdate={handleUserUpdate}
          showToast={showToast}
          authAPI={authAPI}
          primaryColor="#6366f1"
        />
      )}

      {/* Settings Modal - Always render, modal handles visibility */}
      {user && (
        <UserSettingsModal
          isOpen={showSettingsModal}
          onClose={() => {
            console.log('Closing settings modal');
            setShowSettingsModal(false);
          }}
          currentUser={user}
          onUserUpdate={handleUserUpdate}
          showToast={showToast}
          authAPI={authAPI}
          primaryColor="#6366f1"
        />
      )}
    </>
  );
}

export default App;

