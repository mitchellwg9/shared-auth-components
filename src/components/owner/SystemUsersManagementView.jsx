import React, { useState, useEffect } from 'react';
import { Users, Mail, Building2, Shield, User } from 'lucide-react';

/**
 * SystemUsersManagementView - Manage all users across all organizations
 * 
 * @param {Object} props
 * @param {Function} props.showToast - Optional toast notification function
 * @param {Object} props.ownerAPI - Owner API client (from createOwnerAPI)
 * @param {string} props.primaryColor - Primary color for styling (default: "#6366f1")
 */
export function SystemUsersManagementView({ showToast, ownerAPI, primaryColor = "#6366f1" }) {
  const [systemUsers, setSystemUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, org_admin, system_owner
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getUsers();
      setSystemUsers(data);
    } catch (error) {
      if (showToast) {
        showToast(error.message || 'Failed to load users. Make sure you are set as system owner.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = systemUsers.filter(user => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'org_admin' && user.is_organization_admin) ||
      (filter === 'system_owner' && user.is_system_owner);
    
    const matchesSearch = 
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.organization_name && user.organization_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div 
          className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: primaryColor }}
        ></div>
        <p className="mt-4 text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">All Users</h2>
        <p className="text-gray-600">View and manage all users across all organizations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              style={{ '--tw-ring-color': primaryColor }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={filter === 'all' ? { backgroundColor: primaryColor } : {}}
            >
              All
            </button>
            <button
              onClick={() => setFilter('org_admin')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'org_admin' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={filter === 'org_admin' ? { backgroundColor: primaryColor } : {}}
            >
              Org Admins
            </button>
            <button
              onClick={() => setFilter('system_owner')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'system_owner' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={filter === 'system_owner' ? { backgroundColor: primaryColor } : {}}
            >
              System Owners
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <User className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.organization_name ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <Building2 className="w-4 h-4 mr-1" />
                        {user.organization_name}
                        {user.subscription_tier && (
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            user.subscription_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                            user.subscription_tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.subscription_tier}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No organization</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {user.is_system_owner && (
                        <span 
                          className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          System Owner
                        </span>
                      )}
                      {user.is_organization_admin && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Org Admin
                        </span>
                      )}
                      <span className="text-xs text-gray-500 capitalize">{user.role || 'user'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        user.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                        user.plan === 'family' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.plan || 'free'}
                      </span>
                      {user.subscription_status && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                          user.subscription_status === 'canceled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.subscription_status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}

