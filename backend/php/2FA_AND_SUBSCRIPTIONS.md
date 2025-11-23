# Two-Factor Authentication (2FA) and Subscription Management

The shared auth components support two-factor authentication (2FA) and subscription plan/status management.

## Database Schema

Add these columns to your `users` table:

```sql
-- Subscription columns
ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive';

-- 2FA columns
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT NULL;
```

### Valid Plan Values
- `free` - Free tier (default)
- `family` - Family plan
- `pro` - Pro plan
- `enterprise` - Enterprise plan

### Valid Subscription Status Values
- `inactive` - No active subscription (default)
- `active` - Active subscription
- `canceled` - Subscription canceled
- `past_due` - Payment past due
- `trialing` - In trial period

## Two-Factor Authentication (2FA)

### How It Works

1. **Setup**: User enables 2FA and scans QR code with authenticator app
2. **Login**: User enters email/password, then 2FA code
3. **Verification**: System verifies TOTP code or backup code
4. **Backup Codes**: 10 one-time backup codes generated during setup

### Setup 2FA

**Step 1: Get Setup Info (GET)**
```javascript
const response = await fetch('/api/auth/two-factor/setup', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}` // User must be authenticated
  }
});

const { secret, qrUrl, manualEntryKey } = await response.json();
// Display QR code using qrUrl or show manualEntryKey
```

**Step 2: Verify and Enable (POST)**
```javascript
const response = await fetch('/api/auth/two-factor/setup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    secret: secret, // From step 1
    code: '123456' // Code from authenticator app
  })
});

const { success, backupCodes, message } = await response.json();
// Save backupCodes securely - they're one-time use only!
```

### Login with 2FA

**Step 1: Initial Login**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();

if (data.requires2FA) {
  // User has 2FA enabled - prompt for code
  // Show 2FA input field
} else {
  // No 2FA - login complete
  const { user } = data;
}
```

**Step 2: Verify 2FA Code**
```javascript
const response = await fetch('/api/auth/two-factor/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    code: '123456' // TOTP code or backup code
  })
});

const user = await response.json();
// Login complete - user object returned
```

### Check 2FA Status

```javascript
const response = await fetch('/api/auth/two-factor/status', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { enabled, supported } = await response.json();
```

### Disable 2FA

```javascript
const response = await fetch('/api/auth/two-factor/disable', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    password: 'userPassword123' // Required for security
  })
});
```

## Subscription Management

### Registration with Plan

```javascript
await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
    plan: 'pro',                    // Optional: 'free', 'family', 'pro', 'enterprise'
    subscription_status: 'active'    // Optional: 'active', 'inactive', 'canceled', etc.
  })
});
```

### Login Response Includes Subscription Info

```json
{
  "success": true,
  "user": {
    "id": "u1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "pro",
    "subscription_status": "active",
    "two_factor_enabled": false
  }
}
```

### Update Subscription (in your app's subscription management)

```sql
-- Update user's plan and status
UPDATE users 
SET plan = 'enterprise', 
    subscription_status = 'active' 
WHERE email = 'user@example.com';
```

## Integration

### Backend Routes

Add 2FA routes to your API router:

```php
// In your API index.php or router
require_once __DIR__ . '/backend/php/twoFactorRoutes.php';

// Route: /api/auth/two-factor/*
if (strpos($path, 'two-factor/') !== false) {
    $pathParts = explode('/', $path);
    // Get userId from session/token (your auth method)
    $userId = getCurrentUserId(); // Your function to get authenticated user ID
    handle2FARoute($conn, $method, $pathParts, $data, $userId);
    exit;
}
```

### Frontend Usage

```javascript
// Check if user needs 2FA
if (loginResponse.requires2FA) {
  // Show 2FA input
  const code = await promptFor2FACode();
  const verifyResponse = await fetch('/api/auth/two-factor/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });
  const user = await verifyResponse.json();
}

// Check subscription for feature gating
if (user.plan === 'free') {
  // Show upgrade prompt
} else if (user.subscription_status !== 'active') {
  // Show subscription expired message
}
```

## Security Notes

1. **Backup Codes**: Store securely - they're one-time use only
2. **2FA Secret**: Never expose the secret after setup
3. **Password Verification**: Required to disable 2FA
4. **Time Window**: TOTP codes are valid for ±30 seconds (1 window)
5. **Backup Codes**: Format: `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`

## TOTP Implementation

The 2FA implementation follows RFC 6238 (TOTP):
- **Algorithm**: HMAC-SHA1
- **Time Step**: 30 seconds
- **Code Length**: 6 digits
- **Window**: ±1 time step (allows clock drift)

Compatible with authenticator apps:
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- Any TOTP-compatible app

