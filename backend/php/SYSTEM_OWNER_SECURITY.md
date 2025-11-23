# System Owner Security Guidelines

## ⚠️ CRITICAL: System Owner Role is for App Creator Only

The `is_system_owner` flag grants **FULL ACCESS** to your entire application. This role should **NEVER** be assigned to customers or end users.

## What System Owner Can Do

As the app owner/creator with `is_system_owner = TRUE`, you have:

1. **Full Access to All Data**
   - View all users across all organizations
   - Access all organizations and their data
   - View all subscriptions and billing information
   - Access system-wide analytics

2. **Complete Control**
   - Create, edit, and delete organizations
   - Manage all subscriptions and billing
   - Modify any user's account
   - Access all features regardless of subscription tier

3. **System Administration**
   - View system metrics and analytics
   - Manage app-wide settings
   - Full administrative privileges

## Security Best Practices

### ✅ DO:
- Only set `is_system_owner = TRUE` for YOUR email address
- Use this role to manage your app and support customers
- Keep your system owner account secure with strong passwords and 2FA
- Use organization admin roles for customer account management

### ❌ DON'T:
- **NEVER** assign `is_system_owner = TRUE` to customers
- **NEVER** allow customers to request system owner status
- **NEVER** use system owner for customer support (use organization admin instead)
- **NEVER** expose system owner endpoints to frontend without proper checks

## Role Hierarchy

```
System Owner (YOU - App Creator)
  ↓
  Full access to everything
  Highest privilege level
  Only for app owner/creator

Organization Admin (Customers)
  ↓
  Manage their organization
  Manage their team
  Manage their subscription
  Limited to their organization

Regular User (Customers)
  ↓
  Use the app
  Basic features
  Limited to their account
```

## Database Setup

```sql
-- Only set YOUR email as system owner
UPDATE users SET is_system_owner = TRUE WHERE email = 'your-email@example.com';

-- Verify only you have this flag
SELECT email, name, is_system_owner FROM users WHERE is_system_owner = TRUE;
```

## Frontend Usage

The System Owner Panel automatically shows when:
```javascript
const isSystemOwner = currentUser?.is_system_owner === true;

if (isSystemOwner) {
  // Show App Owner Panel with full access
  return <SystemOwnerPanel ... />;
}
```

## Backend Protection

All owner endpoints verify system owner status:
```php
if (!isSystemOwner($conn, $currentUserId)) {
    sendJSON(['error' => 'Access denied. System owner privileges required.'], 403);
}
```

## Monitoring

Regularly check who has system owner access:
```sql
SELECT id, email, name, created_at 
FROM users 
WHERE is_system_owner = TRUE;
```

If you see any email other than yours, **immediately revoke it**:
```sql
UPDATE users SET is_system_owner = FALSE WHERE email = 'unauthorized@example.com';
```

## Summary

- **System Owner = App Creator/Owner (YOU)**
- **Highest privilege level**
- **Full access to everything**
- **NEVER assign to customers**
- **Use organization admin for customer management**

