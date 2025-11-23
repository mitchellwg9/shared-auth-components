# System Owner Panel - Shared Component

The shared auth components include a complete system owner admin panel that you can use across all your apps.

## Features

The System Owner Panel provides:

1. **System Analytics** - View metrics and statistics about your app
2. **Organizations Management** - Create, edit, and delete organizations
3. **Subscriptions Management** - Manage organization subscriptions and billing
4. **Users Management** - View and manage all users across all organizations

## Frontend Usage

### 1. Import the components

```javascript
import { SystemOwnerPanel, createOwnerAPI } from '@wayne/shared-auth';
```

### 2. Create the owner API client

```javascript
const ownerAPI = createOwnerAPI('https://api.yourapp.com');
```

### 3. Check if user is system owner and show panel

```javascript
import { SystemOwnerPanel, createOwnerAPI } from '@wayne/shared-auth';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const ownerAPI = useMemo(() => createOwnerAPI('https://api.yourapp.com'), []);
  
  // Check if user is system owner
  const isSystemOwner = currentUser?.is_system_owner === true || 
                        currentUser?.isSystemOwner === true;
  
  // Show owner panel if user is system owner
  if (isSystemOwner) {
    return (
      <SystemOwnerPanel
        currentUser={currentUser}
        showToast={(message, type) => {
          // Your toast notification function
        }}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
        }}
        ownerAPI={ownerAPI}
        appName="Your App Name"
        primaryColor="#6366f1"
      />
    );
  }
  
  // ... rest of your app
}
```

## Backend Integration

### 1. Add owner routes to your API router

In your `api/index.php`:

```php
case 'owner':
    require_once __DIR__ . '/ownerRoutes.php';
    
    // Get current user ID from request
    $currentUserId = $_GET['current_user_id'] ?? $data['current_user_id'] ?? null;
    
    handleOwnerRoute($conn, $method, $pathParts, $data, $currentUserId);
    exit;
    break;
```

### 2. Deploy ownerRoutes.php

The `ownerRoutes.php` file should be deployed to your API server. The deployment script automatically includes it.

## Database Requirements

### Required Tables

1. **users** table with:
   - `is_system_owner` (BOOLEAN) - Identifies system owners
   - `organization_id` (VARCHAR, nullable) - Links users to organizations
   - `plan` (VARCHAR) - User's subscription plan
   - `subscription_status` (VARCHAR) - Subscription status
   - `is_organization_admin` (BOOLEAN) - Organization admin flag

2. **organizations** table with:
   - `id` (VARCHAR) - Organization ID
   - `name` (VARCHAR) - Organization name
   - `subscription_tier` (VARCHAR) - Subscription tier (free, family, pro, enterprise)
   - `subscription_status` (VARCHAR) - Status (active, inactive, canceled, etc.)
   - `max_users` (INT) - Maximum number of users allowed
   - `created_at` (DATETIME) - Creation timestamp

### SQL Setup

```sql
-- Add system owner column if not exists
ALTER TABLE users ADD COLUMN is_system_owner BOOLEAN DEFAULT FALSE;

-- Set yourself as system owner
UPDATE users SET is_system_owner = TRUE WHERE email = 'your-email@example.com';

-- Create organizations table if not exists
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    max_users INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

The owner routes provide these endpoints:

- `GET /api/owner/organizations` - Get all organizations
- `GET /api/owner/users` - Get all users
- `GET /api/owner/analytics` - Get system analytics
- `GET /api/owner/subscriptions` - Get all subscriptions
- `POST /api/owner/organizations` - Create organization
- `PUT /api/owner/organizations/{id}` - Update organization
- `DELETE /api/owner/organizations/{id}` - Delete organization
- `POST /api/owner/update-subscription` - Update subscription

All endpoints require:
- `current_user_id` in request (query param for GET, body for POST/PUT/DELETE)
- User must have `is_system_owner = TRUE`

## Security

- All endpoints verify system owner status before processing
- Returns 403 if user is not a system owner
- Returns 401 if no user ID is provided

## Customization

The panel is fully customizable:

- **appName** - Your app name for branding
- **primaryColor** - Primary color for buttons and highlights
- **showToast** - Your toast notification function
- **onLogout** - Your logout handler

The panel automatically adapts to your database schema - it checks for column existence and only queries available fields.

