# @wayne/shared-auth

Reusable authentication components with email verification for React applications.

## Installation

```bash
npm install @wayne/shared-auth
```

## Usage

```javascript
import { LoginScreen, SignupModal, EmailVerificationPage } from '@wayne/shared-auth';

function App() {
  return (
    <LoginScreen
      apiBaseUrl="https://api.yourapp.com"
      appName="My App"
      onLogin={(user) => {
        // Handle login
      }}
    />
  );
}
```

## Components

- `LoginScreen` - Login form with email verification support
- `SignupModal` - User registration modal
- `EmailVerificationPage` - Email verification page

## Configuration

All components accept configuration props for:
- API endpoints
- Branding (logo, colors, app name)
- Custom styling
- Callbacks

