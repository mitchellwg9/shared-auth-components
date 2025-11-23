import React, { useState } from 'react';
import { Building2, Users, BarChart3, CreditCard, Settings } from 'lucide-react';
import { SystemAnalyticsView } from './owner/SystemAnalyticsView';
import { OrganizationsManagementView } from './owner/OrganizationsManagementView';
import { SubscriptionsManagementView } from './owner/SubscriptionsManagementView';
import { SystemUsersManagementView } from './owner/SystemUsersManagementView';

/**
 * SystemOwnerPanel - Shared system owner admin panel component
 * Provides access to manage organizations, subscriptions, users, and view system analytics
 * 
 * @param {Object} props
 * @param {Object} props.currentUser - Current logged-in user object
 * @param {Function} props.showToast - Optional toast notification function
 * @param {Function} props.onLogout - Callback when user logs out
 * @param {Object} props.ownerAPI - Owner API client (from createOwnerAPI)
 * @param {string} props.appName - App name for branding (default: "App")
 * @param {string} props.primaryColor - Primary color for styling (default: "#6366f1")
 */
export function SystemOwnerPanel({ 
  currentUser, 
  showToast, 
  onLogout,
  ownerAPI,
  appName = "App",
  primaryColor = "#6366f1"
}) {
  const [activeView, setActiveView] = useState('analytics');

  if (!ownerAPI) {
    console.error('SystemOwnerPanel: ownerAPI is required');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: ownerAPI is required</p>
        </div>
      </div>
    );
  }

  const views = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'users', label: 'All Users', icon: Users },
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Settings className="w-8 h-8 mr-3" style={{ color: primaryColor }} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Owner Panel</h1>
                <p className="text-sm text-gray-500">Manage your {appName} application</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div 
                className="px-3 py-1 rounded-full"
                style={{ 
                  background: `linear-gradient(to right, rgba(${primaryColorRgb}, 0.1), rgba(${primaryColorRgb}, 0.15))`,
                  color: primaryColor
                }}
              >
                <span className="text-sm font-medium">System Owner</span>
              </div>
              {currentUser && (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                    <div className="text-xs text-gray-500">{currentUser.email}</div>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {views.map((view) => {
                  const Icon = view.icon;
                  const isActive = activeView === view.id;
                  return (
                    <li key={view.id}>
                      <button
                        onClick={() => setActiveView(view.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        style={isActive ? {
                          backgroundColor: `rgba(${primaryColorRgb}, 0.1)`,
                          color: primaryColor
                        } : {}}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{view.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeView === 'analytics' && (
              <SystemAnalyticsView 
                showToast={showToast} 
                ownerAPI={ownerAPI}
                primaryColor={primaryColor}
              />
            )}
            {activeView === 'organizations' && (
              <OrganizationsManagementView 
                showToast={showToast} 
                ownerAPI={ownerAPI}
                primaryColor={primaryColor}
              />
            )}
            {activeView === 'subscriptions' && (
              <SubscriptionsManagementView 
                showToast={showToast} 
                ownerAPI={ownerAPI}
                primaryColor={primaryColor}
              />
            )}
            {activeView === 'users' && (
              <SystemUsersManagementView 
                showToast={showToast} 
                ownerAPI={ownerAPI}
                primaryColor={primaryColor}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

