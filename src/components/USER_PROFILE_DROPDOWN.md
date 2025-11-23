# User Profile Dropdown - Shared Component

A reusable user profile dropdown menu component that appears when clicking on the logged-in user's name in the top right corner.

## Features

- **Edit Profile** - Edit user profile and password
- **Settings** - Application settings
- **Manage Subscription** - Only shown for organization admins (`is_organization_admin = true`)
- **Manage Team** - Only shown for organization admins (`is_organization_admin = true`)
- **Help & Support** - Help and documentation
- **Logout** - Sign out of account
- **Custom Items** - Support for app-specific menu items (e.g., "Templates" for StickeeBoard)

## Usage

### Basic Usage

```javascript
import { UserProfileDropdown } from '@wayne/shared-auth';

function Header({ currentUser, onLogout }) {
  return (
    <div className="flex items-center justify-end">
      <UserProfileDropdown
        currentUser={currentUser}
        onProfileClick={() => {
          // Open profile edit modal
        }}
        onSettingsClick={() => {
          // Open settings modal
        }}
        onHelpClick={() => {
          // Open help modal
        }}
        onLogoutClick={onLogout}
        primaryColor="#6366f1"
      />
    </div>
  );
}
```

### With Organization Admin Features

```javascript
<UserProfileDropdown
  currentUser={currentUser}
  onProfileClick={() => setShowProfileModal(true)}
  onSettingsClick={() => setShowSettingsModal(true)}
  onSubscriptionClick={() => setShowSubscriptionModal(true)}  // Only shown for org admins
  onTeamManagementClick={() => setShowTeamModal(true)}  // Only shown for org admins
  onHelpClick={() => setShowHelpModal(true)}
  onLogoutClick={handleLogout}
  primaryColor="#6366f1"
/>
```

### With Custom Menu Items

```javascript
import { FileText } from 'lucide-react';

const customItems = [
  {
    label: 'Templates',
    icon: FileText,
    onClick: () => {
      // Open templates modal
    },
    description: 'Manage templates'
  }
];

<UserProfileDropdown
  currentUser={currentUser}
  onProfileClick={() => {}}
  onSettingsClick={() => {}}
  onHelpClick={() => {}}
  onLogoutClick={handleLogout}
  customMenuItems={customItems}  // App-specific items
  primaryColor="#6366f1"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentUser` | Object | Yes | Current logged-in user object |
| `onProfileClick` | Function | No | Callback when "Edit Profile" is clicked |
| `onSettingsClick` | Function | No | Callback when "Settings" is clicked |
| `onSubscriptionClick` | Function | No | Callback when "Manage Subscription" is clicked (only shown for org admins) |
| `onTeamManagementClick` | Function | No | Callback when "Manage Team" is clicked (only shown for org admins) |
| `onHelpClick` | Function | No | Callback when "Help & Support" is clicked |
| `onLogoutClick` | Function | Yes | Callback when "Logout" is clicked |
| `customMenuItems` | Array | No | Array of custom menu items `[{ label, icon, onClick, description? }]` |
| `primaryColor` | String | No | Primary color for avatar gradient (default: "#6366f1") |
| `position` | String | No | Dropdown position: 'right' or 'left' (default: 'right') |
| `className` | String | No | Additional CSS classes for the trigger button |

## Custom Menu Items Format

```javascript
const customItems = [
  {
    label: 'Templates',           // Menu item label
    icon: FileText,               // Lucide React icon component
    onClick: () => {              // Click handler
      // Your action
    },
    description: 'Manage templates'  // Optional description
  }
];
```

## Conditional Display

The component automatically shows/hides menu items based on:
- **Organization Admin Items**: Only shown if `currentUser.is_organization_admin === true` or `currentUser.isOrganizationAdmin === true`
- **Custom Items**: Always shown (if provided)

## Styling

- Uses your app's primary color for the user avatar gradient
- Fully responsive
- Supports dark mode (if you add dark mode classes)
- Customizable via `primaryColor` and `className` props

## Example: Complete Integration

```javascript
import { UserProfileDropdown } from '@wayne/shared-auth';
import { FileText } from 'lucide-react';

function AppHeader({ currentUser, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const customItems = [
    {
      label: 'Templates',
      icon: FileText,
      onClick: () => setShowTemplates(true),
      description: 'Manage your templates'
    }
  ];

  return (
    <header className="flex items-center justify-between p-4">
      <div>Your App Logo</div>
      
      <UserProfileDropdown
        currentUser={currentUser}
        onProfileClick={() => setShowProfile(true)}
        onSettingsClick={() => setShowSettings(true)}
        onSubscriptionClick={() => setShowSubscription(true)}
        onTeamManagementClick={() => setShowTeam(true)}
        onHelpClick={() => setShowHelp(true)}
        onLogoutClick={onLogout}
        customMenuItems={customItems}
        primaryColor="#6366f1"
      />
    </header>
  );
}
```

