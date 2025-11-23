import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Building2, Clock, TrendingUp, Activity } from 'lucide-react';

/**
 * SystemAnalyticsView - Displays system-wide analytics and metrics
 * 
 * @param {Object} props
 * @param {Function} props.showToast - Optional toast notification function
 * @param {Object} props.ownerAPI - Owner API client (from createOwnerAPI)
 * @param {string} props.primaryColor - Primary color for styling (default: "#6366f1")
 */
export function SystemAnalyticsView({ showToast, ownerAPI, primaryColor = "#6366f1" }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getAnalytics();
      console.log('Analytics data loaded:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      console.error('Error details:', error.details);
      if (showToast) {
        showToast(error.message || 'Failed to load analytics. Make sure you are set as system owner.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div 
          className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: primaryColor }}
        ></div>
        <p className="mt-4 text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  // Generic stats - adapt based on what your API returns
  const stats = [
    {
      label: 'Total Organizations',
      value: analytics.total_organizations || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Users',
      value: analytics.total_users || 0,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: 'Active Organizations (30d)',
      value: analytics.active_organizations_30d || 0,
      icon: Activity,
      color: 'bg-orange-500',
    },
    {
      label: 'Recent Signups (30d)',
      value: analytics.recent_signups_30d || 0,
      icon: TrendingUp,
      color: 'bg-pink-500',
    },
  ];

  // Add app-specific stats if available
  if (analytics.total_hours_tracked !== undefined) {
    stats.splice(2, 0, {
      label: 'Total Hours Tracked',
      value: analytics.total_hours_tracked || 0,
      icon: Clock,
      color: 'bg-purple-500',
    });
  }

  if (analytics.total_time_entries !== undefined) {
    stats.push({
      label: 'Total Time Entries',
      value: analytics.total_time_entries || 0,
      icon: BarChart3,
      color: 'bg-indigo-500',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Analytics</h2>
        <p className="text-gray-600">Overview of your application</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Organizations by Tier */}
      {analytics.organizations_by_tier && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizations by Subscription Tier</h3>
          <div className="space-y-3">
            {Object.entries(analytics.organizations_by_tier).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">{tier}</span>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users by Tier */}
      {analytics.users_by_tier && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Subscription Tier</h3>
          <div className="space-y-3">
            {Object.entries(analytics.users_by_tier).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">{tier}</span>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

