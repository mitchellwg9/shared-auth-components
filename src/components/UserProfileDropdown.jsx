import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, HelpCircle, LogOut, ChevronDown, CreditCard, Users } from 'lucide-react';

/**
 * UserProfileDropdown - Shared user profile dropdown menu component
 * 
 * @param {Object} props
 * @param {Object} props.currentUser - Current logged-in user object
 * @param {Function} props.onProfileClick - Callback when "Edit Profile" is clicked
 * @param {Function} props.onSettingsClick - Callback when "Settings" is clicked
 * @param {Function} props.onSubscriptionClick - Callback when "Manage Subscription" is clicked (only shown for org admins)
 * @param {Function} props.onTeamManagementClick - Callback when "Manage Team" is clicked (only shown for org admins)
 * @param {Function} props.onHelpClick - Callback when "Help & Support" is clicked
 * @param {Function} props.onLogoutClick - Callback when "Logout" is clicked
 * @param {Array} props.customMenuItems - Optional array of custom menu items (e.g., [{ label: 'Templates', icon: FileText, onClick: () => {} }])
 * @param {string} props.primaryColor - Primary color for styling (default: "#6366f1")
 * @param {string} props.position - Dropdown position: 'right' or 'left' (default: 'right')
 * @param {string} props.className - Additional CSS classes for the trigger button
 */
export function UserProfileDropdown({
  currentUser,
  onProfileClick,
  onSettingsClick,
  onSubscriptionClick,
  onTeamManagementClick,
  onHelpClick,
  onLogoutClick,
  customMenuItems = [],
  primaryColor = "#6366f1",
  position = 'right',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Check if user is organization admin
  const isOrgAdmin = currentUser?.is_organization_admin === true || 
                     currentUser?.isOrganizationAdmin === true;

  // Build menu items
  const menuItems = [
    {
      id: 'profile',
      label: 'Edit Profile',
      icon: User,
      onClick: () => {
        if (onProfileClick) onProfileClick();
        setIsOpen(false);
      },
      description: 'Edit profile and password'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        if (onSettingsClick) onSettingsClick();
        setIsOpen(false);
      },
      description: 'Application settings'
    },
    // Organization admin only items
    ...(isOrgAdmin ? [
      {
        id: 'subscription',
        label: 'Manage Subscription',
        icon: CreditCard,
        onClick: () => {
          if (onSubscriptionClick) onSubscriptionClick();
          setIsOpen(false);
        },
        description: 'Manage your organization subscription'
      },
      {
        id: 'team',
        label: 'Manage Team',
        icon: Users,
        onClick: () => {
          if (onTeamManagementClick) onTeamManagementClick();
          setIsOpen(false);
        },
        description: 'Manage team members'
      }
    ] : []),
    // Custom menu items
    ...customMenuItems.map(item => ({
      ...item,
      onClick: () => {
        if (item.onClick) item.onClick();
        setIsOpen(false);
      }
    })),
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      onClick: () => {
        if (onHelpClick) onHelpClick();
        setIsOpen(false);
      },
      description: 'Get help and documentation'
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: LogOut,
      onClick: () => {
        if (onLogoutClick) onLogoutClick();
        setIsOpen(false);
      },
      description: 'Sign out of your account',
      isDanger: true
    }
  ];

  // Convert hex color to RGB for opacity
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(primaryColor);
  const primaryColorRgb = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '99, 102, 241';

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser?.name) return 'U';
    const names = currentUser.name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return currentUser.name.charAt(0).toUpperCase();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:bg-gray-50 rounded-lg transition-colors p-2"
      >
        <div className="text-right">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'User'}</p>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </div>
          {isOrgAdmin ? (
            <p className="text-xs text-gray-500">Organization Admin</p>
          ) : (
            <p className="text-xs text-gray-500">User</p>
          )}
        </div>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ 
            background: `linear-gradient(to bottom right, ${primaryColor}, rgba(${primaryColorRgb}, 0.7))`
          }}
        >
          {getUserInitials()}
        </div>
      </button>

      {isOpen && (
        <div 
          className={`absolute ${position === 'right' ? 'right-0' : 'left-0'} mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50`}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ 
                  background: `linear-gradient(to bottom right, ${primaryColor}, rgba(${primaryColorRgb}, 0.7))`
                }}
              >
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email || ''}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    item.isDanger ? 'hover:bg-red-50' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.isDanger ? 'text-red-600' : 'text-gray-600'}`} />
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${item.isDanger ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

