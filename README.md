# @wayne/shared-auth

A comprehensive, reusable authentication and user management component library for React applications. Built with dark mode support, 2FA, organization management, and a complete design system.

## Features

- 🔐 **Authentication**: Login, Signup, Email Verification
- 🔒 **2FA Support**: TOTP-based two-factor authentication with QR code setup
- 👤 **User Management**: Profile editing, password change, settings
- 🎨 **Dark Mode**: Full dark mode support across all components
- 🏢 **Organization Support**: Multi-tenant with admin features
- 👑 **System Owner Panel**: Complete admin panel for app creators
- 📧 **Email Integration**: SMTP support with email templates
- 🎨 **Design System**: Complete design system based on TymTrackr styling

## Installation

```bash
npm install @wayne/shared-auth
```

## Quick Start

### 1. Import Styles

```javascript
// In your main.jsx or App.jsx
import '@wayne/shared-auth/styles/base.css';
```

### 2. Create API Client

```javascript
import { createAuthAPI } from '@wayne/shared-auth';

const authAPI = createAuthAPI('https://your-api.com/api');
```

### 3. Use Components

```javascript
import { 
  LoginScreen, 
  SignupModal, 
  UserProfileDropdown,
  UserProfileModal,
  UserSettingsModal
} from '@wayne/shared-auth';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  
  return (
    <>
      {!user ? (
        <button onClick={() => setShowLogin(true)}>Login</button>
      ) : (
        <UserProfileDropdown
          currentUser={user}
          onProfileClick={() => {/* open profile */}}
          onSettingsClick={() => {/* open settings */}}
          onLogoutClick={() => setUser(null)}
          primaryColor="#6366f1"
        />
      )}
      
      <LoginScreen
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        apiBaseUrl="https://your-api.com/api"
        appName="My App"
        primaryColor="#6366f1"
        onLogin={(userData) => {
          setUser(userData);
          setShowLogin(false);
        }}
      />
    </>
  );
}
```

## Components

### Authentication Components

#### LoginScreen

Login modal/page with 2FA support.

```javascript
import { LoginScreen } from '@wayne/shared-auth';

<LoginScreen
  isOpen={true}
  onClose={() => {}}
  apiBaseUrl="https://your-api.com/api"
  appName="My App"
  primaryColor="#6366f1"
  onLogin={(userData) => {
    console.log('User logged in:', userData);
  }}
  showToast={(message, type) => {}}
  onSwitchToSignup={() => {}}
/>
```

**Props:**
- `isOpen` (boolean) - Whether the modal is open
- `onClose` (function) - Callback when modal is closed
- `apiBaseUrl` (string) - Base URL for your API
- `appName` (string) - Name of your app
- `primaryColor` (string) - Primary color hex code (default: "#6366f1")
- `onLogin` (function) - Callback when login succeeds (receives user object)
- `showToast` (function, optional) - Toast notification function
- `onSwitchToSignup` (function, optional) - Callback to switch to signup

#### SignupModal

User registration modal.

```javascript
import { SignupModal } from '@wayne/shared-auth';

<SignupModal
  isOpen={true}
  onClose={() => {}}
  apiBaseUrl="https://your-api.com/api"
  appName="My App"
  primaryColor="#6366f1"
  onSignup={(userData) => {
    console.log('User signed up:', userData);
  }}
  showToast={(message, type) => {}}
  onSwitchToLogin={() => {}}
/>
```

#### EmailVerificationPage

Email verification page.

```javascript
import { EmailVerificationPage } from '@wayne/shared-auth';

<EmailVerificationPage
  token="verification-token-from-url"
  apiBaseUrl="https://your-api.com/api"
  appName="My App"
  primaryColor="#6366f1"
  onVerificationComplete={() => {
    console.log('Email verified!');
  }}
  showToast={(message, type) => {}}
/>
```

#### TwoFactorVerify

2FA code verification component (used internally by LoginScreen).

### User Profile Components

#### UserProfileDropdown

User menu dropdown that appears when clicking on the logged-in user's name.

```javascript
import { UserProfileDropdown } from '@wayne/shared-auth';

<UserProfileDropdown
  currentUser={user}
  onProfileClick={() => setShowProfileModal(true)}
  onSettingsClick={() => setShowSettingsModal(true)}
  onSubscriptionClick={() => {}} // Only shown for org admins
  onTeamManagementClick={() => {}} // Only shown for org admins
  onHelpClick={() => {}}
  onLogoutClick={() => setUser(null)}
  primaryColor="#6366f1"
  customItems={[
    {
      label: 'Templates',
      icon: FileText,
      onClick: () => {},
      description: 'Manage templates'
    }
  ]}
/>
```

**Props:**
- `currentUser` (object) - Current logged-in user object
- `onProfileClick` (function) - Callback when "Edit Profile" is clicked
- `onSettingsClick` (function) - Callback when "Settings" is clicked
- `onSubscriptionClick` (function, optional) - Only shown if `is_organization_admin = true`
- `onTeamManagementClick` (function, optional) - Only shown if `is_organization_admin = true`
- `onHelpClick` (function) - Callback when "Help & Support" is clicked
- `onLogoutClick` (function) - Callback when "Logout" is clicked
- `primaryColor` (string) - Primary color hex code
- `customItems` (array, optional) - Array of custom menu items

#### UserProfileModal

Profile editing modal with personal information, password change, and 2FA.

```javascript
import { UserProfileModal } from '@wayne/shared-auth';

<UserProfileModal
  isOpen={showProfileModal}
  onClose={() => setShowProfileModal(false)}
  currentUser={user}
  onUserUpdate={(updatedUser) => {
    setUser(updatedUser);
  }}
  showToast={(message, type) => {}}
  authAPI={authAPI}
  primaryColor="#6366f1"
  darkMode={darkMode}
/>
```

**Props:**
- `isOpen` (boolean) - Whether the modal is open
- `onClose` (function) - Callback when modal is closed
- `currentUser` (object) - Current user object
- `onUserUpdate` (function) - Callback when user is updated
- `showToast` (function, optional) - Toast notification function
- `authAPI` (object) - Auth API client from `createAuthAPI`
- `primaryColor` (string) - Primary color hex code
- `darkMode` (boolean, optional) - Whether dark mode is enabled

#### UserSettingsModal

Settings modal with dark mode, theme colors, and date format.

```javascript
import { UserSettingsModal } from '@wayne/shared-auth';

<UserSettingsModal
  isOpen={showSettingsModal}
  onClose={() => setShowSettingsModal(false)}
  currentUser={user}
  onUserUpdate={(updatedUser) => {
    setUser(updatedUser);
  }}
  showToast={(message, type) => {}}
  authAPI={authAPI}
  primaryColor="#6366f1"
  darkMode={darkMode}
  onToggleDarkMode={() => {
    setDarkMode(!darkMode);
    // Apply dark mode to document
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }}
  theme={theme}
  onThemeChange={(newTheme) => setTheme(newTheme)}
  dateFormat={dateFormat}
  onDateFormatChange={(newFormat) => setDateFormat(newFormat)}
/>
```

**Props:**
- All props from `UserProfileModal` plus:
- `darkMode` (boolean) - Current dark mode state
- `onToggleDarkMode` (function) - Callback when dark mode is toggled
- `theme` (string) - Current theme ID
- `onThemeChange` (function) - Callback when theme changes
- `dateFormat` (string) - Current date format
- `onDateFormatChange` (function) - Callback when date format changes

### System Owner Components

#### SystemOwnerPanel

Complete admin panel for app owners/creators.

```javascript
import { SystemOwnerPanel, createOwnerAPI } from '@wayne/shared-auth';

const ownerAPI = createOwnerAPI('https://your-api.com/api');

<SystemOwnerPanel
  currentUser={user}
  showToast={(message, type) => {}}
  onLogout={() => setUser(null)}
  ownerAPI={ownerAPI}
  appName="My App"
  primaryColor="#6366f1"
/>
```

**Note:** Only shown if `user.is_system_owner === true` or `user.isSystemOwner === true`

## API Clients

### createAuthAPI

Creates an API client for authentication endpoints.

```javascript
import { createAuthAPI } from '@wayne/shared-auth';

const authAPI = createAuthAPI('https://your-api.com/api');

// Available methods:
await authAPI.login(email, password);
await authAPI.register(name, email, password);
await authAPI.verifyEmail(token);
await authAPI.updateProfile(userId, updates);
await authAPI.changePassword(userId, newPassword, currentPassword);
await authAPI.getUserSettings();
await authAPI.updateUserSettings(settings);
await authAPI.setup2FA(userId);
await authAPI.verify2FA(userId, code);
await authAPI.disable2FA(userId);
await authAPI.get2FAStatus(userId);
```

### createOwnerAPI

Creates an API client for system owner endpoints.

```javascript
import { createOwnerAPI } from '@wayne/shared-auth';

const ownerAPI = createOwnerAPI('https://your-api.com/api');

// Available methods:
await ownerAPI.getAnalytics();
await ownerAPI.getOrganizations();
await ownerAPI.createOrganization(data);
await ownerAPI.updateOrganization(id, data);
await ownerAPI.getSubscriptions();
await ownerAPI.updateSubscription(id, data);
await ownerAPI.getAllUsers();
await ownerAPI.updateUser(id, data);
```

## Design System

### Import Styles

```javascript
// Option 1: Import base styles (recommended)
import '@wayne/shared-auth/styles/base.css';

// Option 2: Import design system only
import '@wayne/shared-auth/styles/design-system.css';
```

### Use Theme in JavaScript

```javascript
import { theme } from '@wayne/shared-auth';

const primaryColor = theme.colors.primary[500];
const spacing = theme.spacing[4];
```

### CSS Variables

All design tokens are available as CSS custom properties:

```css
.my-component {
  background: var(--primary-500);
  color: var(--gray-900);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Dark Mode

Dark mode is supported via the `.dark` class on the document element:

```javascript
// Enable dark mode
document.documentElement.classList.add('dark');

// Disable dark mode
document.documentElement.classList.remove('dark');
```

## Database Schema

Your `users` table should include these columns:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255), -- Stores password_hash
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_token_expires DATETIME,
  
  -- Organization support
  organization_id INT,
  is_organization_admin BOOLEAN DEFAULT FALSE,
  is_system_owner BOOLEAN DEFAULT FALSE,
  
  -- Subscription support
  plan VARCHAR(50),
  subscription_status VARCHAR(50),
  
  -- 2FA support
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  two_factor_backup_codes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE,
  theme VARCHAR(50) DEFAULT 'default',
  date_format VARCHAR(20) DEFAULT 'dd/mm/yyyy',
  dark_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Backend API

The package includes PHP backend files in `backend/php/` that you can deploy to your server:

- `config.php` - Database and SMTP configuration
- `routes/auth.php` - Authentication routes
- `routes/twoFactorRoutes.php` - 2FA routes
- `routes/user-settings.php` - User settings routes
- `utils/email.php` - Email sending utilities
- `utils/twoFactorHelper.php` - 2FA helper functions

See `backend/php/README.md` for setup instructions.

## Email Integration

### SMTP Configuration

Configure SMTP in your backend `config.php`:

```php
define('SMTP_ENABLED', true);
define('SMTP_HOST', 'mail.yourdomain.com');
define('SMTP_USER', 'noreply@yourdomain.com');
define('SMTP_PASS', 'your-password');
define('SMTP_SECURE', 'ssl'); // 'tls' or 'ssl'
define('SMTP_PORT', 465);
define('EMAIL_FROM', 'noreply@yourdomain.com');
```

### Email Templates

```javascript
import { 
  generateVerificationEmail, 
  generatePasswordResetEmail,
  generateWelcomeEmail 
} from '@wayne/shared-auth';

const verificationEmail = generateVerificationEmail({
  name: 'John Doe',
  token: 'verification-token',
  appName: 'My App',
  appUrl: 'https://myapp.com'
});
```

## Customization

### Primary Color

All components accept a `primaryColor` prop:

```javascript
<LoginScreen
  primaryColor="#your-color"
  // ... other props
/>
```

### Custom Menu Items

Add custom items to the user dropdown:

```javascript
import { FileText } from 'lucide-react';

<UserProfileDropdown
  customItems={[
    {
      label: 'Templates',
      icon: FileText,
      onClick: () => {},
      description: 'Manage templates'
    }
  ]}
  // ... other props
/>
```

### Theme Colors

Override CSS variables:

```css
:root {
  --primary-500: #your-color;
  --font-sans: 'Your Font', sans-serif;
}
```

## Complete Example

```javascript
import { useState } from 'react';
import {
  LoginScreen,
  SignupModal,
  UserProfileDropdown,
  UserProfileModal,
  UserSettingsModal,
  createAuthAPI
} from '@wayne/shared-auth';
import '@wayne/shared-auth/styles/base.css';

const API_BASE_URL = 'https://your-api.com/api';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');

  const authAPI = createAuthAPI(API_BASE_URL);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    document.documentElement.classList.remove('dark');
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!user) {
    return (
      <>
        <button onClick={() => setShowLogin(true)}>Login</button>
        <button onClick={() => setShowSignup(true)}>Sign Up</button>

        <LoginScreen
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          apiBaseUrl={API_BASE_URL}
          appName="My App"
          primaryColor="#6366f1"
          onLogin={handleLogin}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />

        <SignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          apiBaseUrl={API_BASE_URL}
          appName="My App"
          primaryColor="#6366f1"
          onSignup={handleLogin}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      </>
    );
  }

  return (
    <div>
      <header>
        <h1>My App</h1>
        <UserProfileDropdown
          currentUser={user}
          onProfileClick={() => setShowProfileModal(true)}
          onSettingsClick={() => setShowSettingsModal(true)}
          onLogoutClick={handleLogout}
          primaryColor="#6366f1"
        />
      </header>

      <main>
        {/* Your app content */}
      </main>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={user}
        onUserUpdate={setUser}
        authAPI={authAPI}
        primaryColor="#6366f1"
        darkMode={darkMode}
      />

      <UserSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentUser={user}
        onUserUpdate={setUser}
        authAPI={authAPI}
        primaryColor="#6366f1"
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        theme={theme}
        onThemeChange={setTheme}
        dateFormat={dateFormat}
        onDateFormatChange={setDateFormat}
      />
    </div>
  );
}

export default App;
```

## Peer Dependencies

- `react` ^18.0.0
- `react-dom` ^18.0.0
- `lucide-react` ^0.263.0

## License

MIT

## Support

For issues, questions, or contributions, please see the repository.
