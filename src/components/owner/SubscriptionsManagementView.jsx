import React, { useState, useEffect } from 'react';
import { CreditCard, Edit } from 'lucide-react';

/**
 * SubscriptionsManagementView - Manage organization subscriptions
 * 
 * @param {Object} props
 * @param {Function} props.showToast - Optional toast notification function
 * @param {Object} props.ownerAPI - Owner API client (from createOwnerAPI)
 * @param {string} props.primaryColor - Primary color for styling (default: "#6366f1")
 */
export function SubscriptionsManagementView({ showToast, ownerAPI, primaryColor = "#6366f1" }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSub, setEditingSub] = useState(null);
  const [formData, setFormData] = useState({
    subscription_tier: 'free',
    subscription_status: 'active',
    max_users: 1,
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      if (showToast) {
        showToast(error.message || 'Failed to load subscriptions. Make sure you are set as system owner.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (orgId) => {
    try {
      await ownerAPI.updateSubscription({
        organization_id: orgId,
        ...formData,
      });
      if (showToast) {
        showToast('Subscription updated successfully', 'success');
      }
      setEditingSub(null);
      setFormData({ subscription_tier: 'free', subscription_status: 'active', max_users: 1 });
      loadSubscriptions();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      if (showToast) {
        showToast(error.message || 'Failed to update subscription', 'error');
      }
    }
  };

  const startEdit = (sub) => {
    setEditingSub(sub.id);
    setFormData({
      subscription_tier: sub.subscription_tier || 'free',
      subscription_status: sub.subscription_status || 'active',
      max_users: sub.max_users || 1,
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div 
          className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: primaryColor }}
        ></div>
        <p className="mt-4 text-gray-500">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscriptions</h2>
        <p className="text-gray-600">Manage organization subscriptions and billing</p>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{sub.name}</div>
                  <div className="text-sm text-gray-500">{sub.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    sub.subscription_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    sub.subscription_tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                    sub.subscription_tier === 'family' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {sub.subscription_tier || 'free'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    sub.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                    sub.subscription_status === 'canceled' || sub.subscription_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    sub.subscription_status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {sub.subscription_status || 'inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sub.current_user_count || 0} / {sub.max_users || '∞'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sub.current_period_start && sub.current_period_end ? (
                    <div>
                      <div>{new Date(sub.current_period_start).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">to {new Date(sub.current_period_end).toLocaleDateString()}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => startEdit(sub)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscriptions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No subscriptions found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingSub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Subscription</h3>
            <div className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.subscription_status}
                  onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={{ '--tw-ring-color': primaryColor }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="canceled">Canceled</option>
                  <option value="past_due">Past Due</option>
                  <option value="trialing">Trialing</option>
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
                    setEditingSub(null);
                    setFormData({ subscription_tier: 'free', subscription_status: 'active', max_users: 1 });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdate(editingSub)}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

