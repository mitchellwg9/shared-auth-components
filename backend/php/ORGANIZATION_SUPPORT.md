# Organization Support - Multi-Tier Subscriptions

The shared auth components support organization-based user management for apps with subscription tiers (Free, Pro, Enterprise).

## Database Schema

Your `users` table should include these columns:

```sql
ALTER TABLE users ADD COLUMN organization_id VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN is_organization_admin BOOLEAN DEFAULT FALSE;
```

## How It Works

### Organization Structure

- **Free Tier**: Users have `organization_id = NULL` (individual accounts)
- **Pro/Enterprise Tier**: Users belong to an organization via `organization_id`
- **Organization Admin**: The user responsible for the subscription (`is_organization_admin = TRUE`)
  - This user can manage other users within their organization
  - Typically the first user who creates/joins the organization

### Registration

When registering a new user, you can optionally include organization fields:

```javascript
// Register a regular user (Free tier)
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe'
  })
});

// Register a user with organization (Pro/Enterprise tier)
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@company.com',
    password: 'password123',
    name: 'Admin User',
    organization_id: 'org_12345',        // Optional: Organization ID
    is_organization_admin: true           // Optional: Set to true if this user manages the org
  })
});
```

### Login Response

The login response includes organization information:

```json
{
  "success": true,
  "user": {
    "id": "u1234567890",
    "email": "admin@company.com",
    "name": "Admin User",
    "role": "user",
    "organization_id": "org_12345",
    "is_organization_admin": true,
    "isOrganizationAdmin": true,  // Also available in camelCase
    "email_verified": true
  }
}
```

### Typical Workflow

1. **Create Organization** (in your app's organization management):
   - User signs up for Pro/Enterprise plan
   - Create organization record with unique ID (e.g., `org_12345`)
   - Set user's `organization_id` and `is_organization_admin = TRUE`

2. **Add Users to Organization**:
   - Organization admin invites users
   - New users register with `organization_id` set
   - Or update existing users: `UPDATE users SET organization_id = 'org_12345' WHERE email = 'user@example.com'`

3. **Check User Permissions**:
   ```javascript
   if (user.is_organization_admin) {
     // User can manage organization users
   }
   
   if (user.organization_id) {
     // User belongs to an organization (Pro/Enterprise tier)
   } else {
     // User is on Free tier (individual account)
   }
   ```

## Backend Implementation

The shared auth routes automatically:
- ✅ Check if `organization_id` and `is_organization_admin` columns exist
- ✅ Include them in registration if provided
- ✅ Return them in login response
- ✅ Handle cases where columns don't exist (backward compatible)

## Frontend Usage

The React components don't need changes - organization fields are handled automatically by the backend. You can access them from the user object after login:

```javascript
const { user } = await login(email, password);
console.log(user.organization_id);           // Organization ID or null
console.log(user.is_organization_admin);    // true/false
console.log(user.isOrganizationAdmin);      // Also available in camelCase
```

## Migration

If you're adding organization support to an existing app:

1. Add the columns to your database:
   ```sql
   ALTER TABLE users ADD COLUMN organization_id VARCHAR(255) NULL;
   ALTER TABLE users ADD COLUMN is_organization_admin BOOLEAN DEFAULT FALSE;
   ```

2. Update existing organization admins:
   ```sql
   UPDATE users 
   SET organization_id = 'your_org_id', 
       is_organization_admin = TRUE 
   WHERE email = 'admin@example.com';
   ```

3. The code automatically handles both old and new users - no code changes needed!

