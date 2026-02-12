import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, ChevronDown, ChevronRight, Check, X, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [expandedUser, setExpandedUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [resettingPermissions, setResettingPermissions] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Role-based page access - must match AppSidebar.jsx roleAccess
  const roleAccess = {
    'user': ['workspaces', 'tools', 'chat', 'knowledge-base'],
    'tl': ['workspaces', 'tools', 'chat', 'knowledge-base', 'tl'],
    'qa': ['workspaces', 'tools', 'chat', 'knowledge-base', 'qa-manager'],
    'qa-admin': ['workspaces', 'tools', 'chat', 'knowledge-base', 'qa-manager'],
    'developer': ['workspaces', 'tools', 'chat', 'knowledge-base', 'developer-dashboard', 'qa-manager', 'kyc-agent-stats', 'tl'],
    'admin': ['workspaces', 'tools', 'chat', 'knowledge-base', 'developer-dashboard', 'qa-manager', 'kyc-agent-stats', 'tl']
  };

  // Get permissions based on role (used when pagePermissions is empty)
  const getRoleBasedPermissions = (role) => {
    const defaults = {};
    // Admin role gets all pages
    const allowedPages = role === 'admin'
      ? Object.keys(pages)
      : (roleAccess[role] || roleAccess['user']);

    Object.keys(pages).forEach(pageKey => {
      const hasAccess = allowedPages.includes(pageKey);
      defaults[pageKey] = {
        enabled: hasAccess,
        subPages: {}
      };
      if (pages[pageKey].subPages) {
        Object.keys(pages[pageKey].subPages).forEach(subKey => {
          // For QA subpages, check qaAdminOnly
          const subConfig = pages[pageKey].subPages[subKey];
          let subEnabled = hasAccess;
          if (subConfig.qaAdminOnly && !['qa-admin', 'admin'].includes(role)) {
            subEnabled = false;
          }
          defaults[pageKey].subPages[subKey] = subEnabled;
        });
      }
    });
    return defaults;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, pagesRes] = await Promise.all([
        axios.get(`${API_URL}/api/developer/users`, { headers }),
        axios.get(`${API_URL}/api/developer/pages`, { headers })
      ]);

      setUsers(usersRes.data.users);
      setPages(pagesRes.data.pages);
    } catch (err) {
      console.error('Error fetching user management data:', err);
      toast.error('Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setSaving(prev => ({ ...prev, [userId]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/developer/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Find user email for role-based permissions calculation
      const userEmail = users.find(u => u._id === userId)?.email;

      setUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, role: newRole } : user
      ));

      // Update the displayed permissions to reflect new role
      // This recalculates based on the new role
      setEditingPermissions(prev => ({
        ...prev,
        [userId]: getRoleBasedPermissions(newRole)
      }));

      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const fetchUserPermissions = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/developer/users/${userId}/permissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userData = response.data.user;
      const savedPerms = userData.pagePermissions;

      // If user has saved pagePermissions, use those
      // Otherwise, calculate based on role
      let userPerms;
      if (savedPerms && Object.keys(savedPerms).length > 0) {
        userPerms = savedPerms;
      } else {
        userPerms = getRoleBasedPermissions(userData.role);
      }

      setEditingPermissions(prev => ({
        ...prev,
        [userId]: userPerms
      }));
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      toast.error('Failed to load user permissions');
    }
  };

  const toggleUserExpand = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      if (!editingPermissions[userId]) {
        await fetchUserPermissions(userId);
      }
    }
  };

  const handlePermissionChange = (userId, pageKey, subPageKey = null, value) => {
    setEditingPermissions(prev => {
      const userPerms = { ...prev[userId] };

      if (!userPerms[pageKey]) {
        userPerms[pageKey] = { enabled: false, subPages: {} };
      }

      if (subPageKey === null) {
        userPerms[pageKey] = {
          ...userPerms[pageKey],
          enabled: value
        };
      } else {
        if (!userPerms[pageKey].subPages) {
          userPerms[pageKey].subPages = {};
        }
        userPerms[pageKey].subPages = {
          ...userPerms[pageKey].subPages,
          [subPageKey]: value
        };
      }

      return { ...prev, [userId]: userPerms };
    });
  };

  const savePermissions = async (userId) => {
    setSaving(prev => ({ ...prev, [`perm-${userId}`]: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/developer/users/${userId}/permissions`,
        { pagePermissions: editingPermissions[userId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Permissions saved successfully');
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(prev => ({ ...prev, [`perm-${userId}`]: false }));
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400';
      case 'developer':
        return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400';
      case 'qa-admin':
        return 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400';
      case 'qa':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400';
      case 'tl':
        return 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400';
      default:
        return 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-400';
    }
  };

  const handleResetAllPermissions = async () => {
    if (!window.confirm('Da li ste sigurni? Ovo će resetovati SVE korisničke pagePermissions i omogućiti da role automatski određuje pristup stranicama.')) {
      return;
    }

    setResettingPermissions(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/developer/users/reset-permissions`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Permissions reset! ${response.data.usersAffected} korisnika ažurirano. Role-based access je sada aktivan.`);

      // Refresh data
      await fetchData();
      // Clear local editing state
      setEditingPermissions({});
      setExpandedUser(null);
    } catch (err) {
      console.error('Error resetting permissions:', err);
      toast.error(err.response?.data?.message || 'Failed to reset permissions');
    } finally {
      setResettingPermissions(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600 dark:text-neutral-400">Loading user management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
            User Management - Roles & Permissions
          </h3>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Update Roles Button */}
      <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-300">Sync Role-Based Access</h4>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Klikni "Update Roles" da resetuješ sve ručno postavljene permisije i omogućiš da role automatski određuje pristup stranicama.
            </p>
          </div>
          <button
            onClick={handleResetAllPermissions}
            disabled={resettingPermissions}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50 whitespace-nowrap ml-4"
          >
            {resettingPermissions ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Update Roles
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {users.map(user => (
          <div
            key={user._id}
            className="border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden"
          >
            {/* User Row */}
            <div
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => toggleUserExpand(user._id)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700">
                  <Users className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-neutral-50">{user.name}</div>
                  <div className="text-sm text-gray-500 dark:text-neutral-500">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Role Selector */}
                <div onClick={e => e.stopPropagation()}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    disabled={saving[user._id]}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border-0 cursor-pointer ${getRoleBadgeClass(user.role)} focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="user">user</option>
                    <option value="tl">tl</option>
                    <option value="qa">qa</option>
                    <option value="qa-admin">qa-admin</option>
                    <option value="developer">developer</option>
                    <option value="admin">admin</option>
                  </select>
                </div>

                {/* Expand Icon */}
                {expandedUser === user._id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Permissions Panel */}
            {expandedUser === user._id && (
              <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                      Page Access Permissions
                    </h4>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      Based on role: {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-500 mb-3">
                    Permisije ispod su automatski izračunate na osnovu role korisnika. Ako sačuvaš promene, one će postati custom override.
                  </p>

                  {!editingPermissions[user._id] ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                      <span className="ml-2 text-sm text-gray-500">Loading permissions...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(pages).map(([pageKey, pageConfig]) => {
                        const userPerms = editingPermissions[user._id];
                        const pageEnabled = userPerms[pageKey]?.enabled ?? false;

                        return (
                          <div key={pageKey} className="border border-gray-100 dark:border-neutral-800 rounded-lg p-3">
                            {/* Main Page Toggle */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={pageEnabled}
                                    onChange={(e) => handlePermissionChange(user._id, pageKey, null, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                                </label>
                                <span className="font-medium text-gray-900 dark:text-neutral-50">
                                  {pageConfig.label}
                                </span>
                                {pageConfig.requiresRole && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400">
                                    (Requires: {pageConfig.requiresRole.join(' or ')})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-gray-500 dark:text-neutral-500 mb-2">
                              {pageConfig.description}
                            </p>

                            {/* Sub Pages */}
                            {pageConfig.subPages && pageEnabled && (
                              <div className="ml-6 mt-3 space-y-2 border-l-2 border-gray-200 dark:border-neutral-700 pl-4">
                                <div className="text-xs font-medium text-gray-500 dark:text-neutral-500 mb-2">
                                  Sub-pages:
                                </div>
                                {Object.entries(pageConfig.subPages).map(([subKey, subConfig]) => {
                                  const subEnabled = userPerms[pageKey]?.subPages?.[subKey] ?? false;

                                  return (
                                    <label
                                      key={subKey}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={subEnabled}
                                        onChange={(e) => handlePermissionChange(user._id, pageKey, subKey, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                                      />
                                      <span className="text-sm text-gray-700 dark:text-neutral-300">
                                        {subConfig.label}
                                      </span>
                                      {subConfig.adminOnly && (
                                        <span className="text-xs text-red-500 dark:text-red-400">
                                          (Admin)
                                        </span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Save Button */}
                {editingPermissions[user._id] && (
                  <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-neutral-800">
                    <button
                      onClick={() => savePermissions(user._id)}
                      disabled={saving[`perm-${user._id}`]}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {saving[`perm-${user._id}`] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Permissions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
