# @wayne/shared-auth

Reusable authentication components with email verification for React applications.

## Installation

```bash
npm install @wayne/shared-auth
```

## Demo

A demo application is included in the `demo` folder to test the components.

### Running the Demo

1. Install dependencies:
```bash
npm install
```

2. Start the demo development server:
```bash
npm run demo
```

3. Build the demo for production:
```bash
npm run demo:build
```

The demo connects to `https://data-q.org/api` and demonstrates all authentication features including login, signup, and email verification.

## Quick Start

```javascript
import { LoginScreen, SignupModal, EmailVerificationPage, createAuthAPI, useAuth } from '@wayne/shared-auth';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      {showLogin && (
        <LoginScreen
          apiBaseUrl="https://api.yourapp.com"
          appName="My App"
          primaryColor="#6366f1"
          onLogin={(user) => {
            console.log('Logged in:', user);
            setShowLogin(false);
          }}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}
      
      {showSignup && (
        <SignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          apiBaseUrl="https://api.yourapp.com"
          appName="My App"
          onSignup={(user) => {
            console.log('Signed up:', user);
            setShowSignup(false);
            setShowLogin(true);
          }}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
}
```

## Components

### LoginScreen

A configurable login component that supports email verification and can be used as a modal or full-page component.

**Props:**
- `apiBaseUrl` (string, required) - Base URL for your API
- `appName` (string, default: "App") - App name for branding
- `primaryColor` (string, default: "#6366f1") - Primary color for buttons
- `logo` (string, optional) - URL to logo image
- `isOpen` (boolean, optional) - If provided, renders as modal
- `onClose` (function, optional) - Callback when modal is closed
- `onLogin` (function, optional) - Callback when login succeeds (receives user object)
- `showToast` (function, optional) - Toast notification function
- `onSwitchToSignup` (function, optional) - Callback to switch to signup
- `customStyles` (object, optional) - Custom CSS classes

**Example:**
```javascript
<LoginScreen
  apiBaseUrl="https://api.yourapp.com"
  appName="My App"
  primaryColor="#6366f1"
  onLogin={(user) => {
    // Handle successful login
    localStorage.setItem('currentUser', JSON.stringify(user));
  }}
  showToast={(message, type) => {
    // Show toast notification
  }}
/>
```

### SignupModal

A configurable user registration modal with form validation.

**Props:**
- `isOpen` (boolean, required) - Whether the modal is open
- `onClose` (function, required) - Callback when modal is closed
- `apiBaseUrl` (string, required) - Base URL for your API
- `appName` (string, default: "App") - App name for branding
- `primaryColor` (string, default: "#6366f1") - Primary color for buttons
- `onSignup` (function, optional) - Callback when signup succeeds
- `showToast` (function, optional) - Toast notification function
- `onSwitchToLogin` (function, optional) - Callback to switch to login
- `validatePassword` (function, optional) - Custom password validation function
- `customStyles` (object, optional) - Custom CSS classes

**Example:**
```javascript
<SignupModal
  isOpen={showSignup}
  onClose={() => setShowSignup(false)}
  apiBaseUrl="https://api.yourapp.com"
  appName="My App"
  onSignup={(user) => {
    // Handle successful signup
  }}
/>
```

### EmailVerificationPage

A page component for handling email verification from verification links.

**Props:**
- `token` (string, required) - Verification token from URL
- `apiBaseUrl` (string, required) - Base URL for your API
- `appName` (string, default: "App") - App name for branding
- `primaryColor` (string, default: "#6366f1") - Primary color for buttons
- `onVerificationComplete` (function, optional) - Callback when verification completes
- `showToast` (function, optional) - Toast notification function
- `customStyles` (object, optional) - Custom CSS classes

**Example:**
```javascript
// Extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

<EmailVerificationPage
  token={token}
  apiBaseUrl="https://api.yourapp.com"
  appName="My App"
  onVerificationComplete={() => {
    // Redirect to login
    window.location.href = '/login';
  }}
/>
```

## Utilities

### createAuthAPI

Creates a configured API client for authentication operations.

```javascript
import { createAuthAPI } from '@wayne/shared-auth';

const authAPI = createAuthAPI('https://api.yourapp.com');

// Use the API client
const response = await authAPI.login(email, password);
await authAPI.register(userData);
await authAPI.verifyEmail(token);
await authAPI.resendVerification(email);
```

### useAuth

A React hook for managing authentication state.

```javascript
import { useAuth } from '@wayne/shared-auth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth('https://api.yourapp.com');

  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <button onClick={() => login(email, password)}>Login</button>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## API Requirements

Your backend API should implement the following endpoints:

### POST /auth/login
- Request: `{ email: string, password: string }`
- Success Response: `{ success: true, user: {...} }`
- Error Response: `{ error: string, error_type?: string }`
  - `error_type` can be: `email_not_found`, `invalid_password`, `email_not_verified`

### POST /auth/register
- Request: `{ name: string, email: string, password: string, role?: string }`
- Success Response: `{ success: true, user: {...} }`
- Error Response: `{ error: string }`

### GET /auth/verify-email?token={token}
- Success Response: `{ success: true, already_verified?: boolean, message?: string }`
- Error Response: `{ error: string }`

### POST /auth/resend-verification
- Request: `{ email: string }`
- Success Response: `{ success: true, message?: string }`
- Error Response: `{ error: string }`

## Backend Support

This package includes both **frontend React components** and **backend utilities** for complete authentication functionality.

### PHP Backend (Recommended for PHP APIs)

If your backend API is PHP, use the shared PHP backend package:

1. Copy the PHP files from `backend/php/` to your API directory
2. Include them in your auth routes
3. Configure SMTP settings
4. Use `handleAuthRoute()` to handle all authentication endpoints

See `backend/php/README.md` for detailed PHP backend documentation.

**Quick PHP Example:**
```php
require_once __DIR__ . '/utils/emailTemplates.php';
require_once __DIR__ . '/utils/smtpClient.php';
require_once __DIR__ . '/utils/authRoutes.php';

// Configure SMTP
$smtpConfig = [
    'host' => 'mail.data-q.org',
    'port' => 465,
    'secure' => 'ssl',
    'auth' => [
        'user' => 'noreply@data-q.org',
        'pass' => 'your-password'
    ],
    'from' => 'noreply@data-q.org',
    'fromName' => 'My App'
];

// Handle auth routes
handleAuthRoute($conn, $method, $pathParts, $data, [
    'appUrl' => 'https://data-q.org',
    'appName' => 'My App',
    'smtp' => $smtpConfig
]);
```

### Node.js Backend

For Node.js backend services, use the JavaScript email templates and SMTP client:

## Email Templates & SMTP

The package includes email template generators and SMTP client utilities for sending authentication emails.

### Email Templates (JavaScript/Node.js)

Generate HTML email templates for verification, password reset, and welcome emails:

```javascript
import { generateVerificationEmail } from '@wayne/shared-auth';

const html = generateVerificationEmail({
  appName: 'My App',
  userName: 'John Doe',
  verificationUrl: 'https://myapp.com/verify?token=abc123',
  primaryColor: '#6366f1',
  logoUrl: 'https://myapp.com/logo.png' // optional
});
```

Available templates:
- `generateVerificationEmail()` - Email verification
- `generatePasswordResetEmail()` - Password reset
- `generateWelcomeEmail()` - Welcome email (after verification)

### SMTP Client (Node.js Backend)

For Node.js backend services, use the SMTP client to send emails:

```javascript
import { createSMTPClient, generateVerificationEmail } from '@wayne/shared-auth';

// Create SMTP client (requires nodemailer: npm install nodemailer)
const smtp = await createSMTPClient({
  host: 'mail.example.com',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@example.com',
    pass: 'password'
  }
});

// Generate and send email
const html = generateVerificationEmail({
  appName: 'My App',
  userName: 'John Doe',
  verificationUrl: 'https://myapp.com/verify?token=abc123'
});

const result = await smtp.sendEmail({
  to: 'user@example.com',
  subject: 'Verify Your Email',
  html: html
});
```

See `src/utils/README.md` for detailed documentation.

## Customization

All components support customization through props:

- **Branding**: `appName`, `logo`, `primaryColor`
- **Styling**: `customStyles` object with CSS classes
- **Behavior**: Custom validation functions, callbacks
- **API**: Configurable API base URL
- **Email**: Customizable email templates with branding

## License

MIT
