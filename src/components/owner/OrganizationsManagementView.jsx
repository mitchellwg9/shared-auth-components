import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Users as UsersIcon } from 'lucide-react';

/**
 * OrganizationsManagementView - Manage all organizations
 * 
 * @param {Object} props
 * @param {Function} props.showToast - Optional toast notification function
 * @param {Object} props.ownerAPI - Owner API client (from createOwnerAPI)
 * @param {string} props.primaryColor - Primary color for styling (default: "#6366f1")
 */
export function OrganizationsManagementView({ showToast, ownerAPI, primaryColor = "#6366f1" }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subscription_tier: 'free',
    max_users: 1,
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getOrganizations();
      console.log('Organizations data loaded:', data);
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      console.error('Error details:', error.details);
      if (showToast) {
        showToast(error.message || 'Failed to load organizations. Make sure you are set as system owner.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await ownerAPI.createOrganization(formData);
      if (showToast) {
        showToast('Organization created successfully', 'success');
      }
      setShowCreateModal(false);
      setFormData({ name: '', subscription_tier: 'free', max_users: 1 });
      loadOrganizations();
    } catch (error) {
      console.error('Failed to create organization:', error);
      if (showToast) {
        showToast(error.message || 'Failed to create organization', 'error');
      }
    }
  };

  const handleUpdate = async (id) => {
    try {
      await ownerAPI.updateOrganization(id, formData);
      if (showToast) {
        showToast('Organization updated successfully', 'success');
      }
      setEditingOrg(null);
      setFormData({ name: '', subscription_tier: 'free', max_users: 1 });
      loadOrganizations();
    } catch (error) {
      console.error('Failed to update organization:', error);
      if (showToast) {
        showToast(error.message || 'Failed to update organization', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization? This will also delete all associated users.')) {
      return;
    }
    try {
      await ownerAPI.deleteOrganization(id);
      if (showToast) {
        showToast('Organization deleted successfully', 'success');
      }
      loadOrganizations();
    } catch (error) {
      console.error('Failed to delete organization:', error);
      if (showToast) {
        showToast(error.message || 'Failed to delete organization', 'error');
      }
    }
  };

  const startEdit = (org) => {
    setEditingOrg(org.id);
    setFormData({
      name: org.name,
      subscription_tier: org.subscription_tier || 'free',
      max_users: org.max_users || 1,
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div 
          className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: primaryColor }}
        ></div>
        <p className="mt-4 text-gray-500">Loading organizations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organizations</h2>
          <p className="text-gray-600">Manage all organizations in your system</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-5 h-5" />
          Create Organization
        </button>
      </div>

      {/* Organizations List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {organizations.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{org.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    org.subscription_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    org.subscription_tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                    org.subscription_tier === 'family' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {org.subscription_tier || 'free'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    {org.current_user_count || 0} / {org.max_users || '∞'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    org.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                    org.subscription_status === 'canceled' || org.subscription_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {org.subscription_status || 'inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(org)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(org.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {organizations.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No organizations found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingOrg) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingOrg ? 'Edit Organization' : 'Create Organization'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={{ '--tw-ring-color': primaryColor }}
                  placeholder="Organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
                <select
                  value={formData.subscription_tier}
                  onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={{ '--tw-ring-color': primaryColor }}
                >
                  <option value="free">Free</option>
                  <option value="family">Family</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                <input
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={{ '--tw-ring-color': primaryColor }}
                  min="1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingOrg(null);
                    setFormData({ name: '', subscription_tier: 'free', max_users: 1 });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => editingOrg ? handleUpdate(editingOrg) : handleCreate()}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  {editingOrg ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

