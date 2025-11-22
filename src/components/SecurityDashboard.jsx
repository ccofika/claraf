import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Lock, Key, Settings, RefreshCw, CheckCircle, XCircle, User, Activity } from 'lucide-react';

const SecurityDashboard = () => {
  const [securityData, setSecurityData] = useState(null);
  const [revokedTokens, setRevokedTokens] = useState([]);
  const [securitySettings, setSecuritySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, tokens, settings
  const [revokeUserId, setRevokeUserId] = useState('');
  const [revokeReason, setRevokeReason] = useState('security_incident');
  const [revoking, setRevoking] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchSecurityDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashboardRes, tokensRes, settingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/developer/security/dashboard`, { headers }),
        axios.get(`${API_URL}/api/developer/security/revoked-tokens?limit=20`, { headers }),
        axios.get(`${API_URL}/api/developer/security/settings`, { headers }),
      ]);

      setSecurityData(dashboardRes.data);
      setRevokedTokens(tokensRes.data.tokens);
      setSecuritySettings(settingsRes.data.settings);
    } catch (err) {
      console.error('Error fetching security dashboard:', err);
      setError(err.response?.data?.message || 'Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeUserTokens = async (e) => {
    e.preventDefault();
    if (!revokeUserId.trim()) return;

    setRevoking(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        `${API_URL}/api/developer/security/revoke-tokens`,
        { userId: revokeUserId, reason: revokeReason },
        { headers }
      );

      alert('User tokens revoked successfully');
      setRevokeUserId('');
      fetchSecurityDashboard(); // Refresh data
    } catch (err) {
      console.error('Error revoking tokens:', err);
      alert(err.response?.data?.message || 'Failed to revoke tokens');
    } finally {
      setRevoking(false);
    }
  };

  useEffect(() => {
    fetchSecurityDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <XCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-50">Security Dashboard</h2>
        </div>
        <button
          onClick={fetchSecurityDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tokens'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-50'
          }`}
        >
          Revoked Tokens
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-50'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && securityData && (
        <div className="space-y-6">
          {/* Token Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Total Revoked</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-50">
                {securityData.tokenStats.revoked.total}
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400">
                Last 24h: {securityData.tokenStats.revoked.last24h}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Active Tokens</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-50">
                {securityData.tokenStats.active.refreshTokens}
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400">
                Refresh tokens
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Users Affected</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-50">
                {securityData.tokenStats.usersWithInvalidatedTokens}
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400">
                With invalidated tokens
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Success Rate</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-50">
                {securityData.securityEvents.loginSuccessRate}
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400">
                Last 7 days
              </div>
            </div>
          </div>

          {/* Security Events */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">Security Events (Last 7 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {securityData.securityEvents.last7Days.failedLogins}
                </div>
                <div className="text-sm text-gray-600 dark:text-neutral-400">Failed Logins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {securityData.securityEvents.last7Days.successfulLogins}
                </div>
                <div className="text-sm text-gray-600 dark:text-neutral-400">Successful Logins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {securityData.securityEvents.last7Days.accountLockouts}
                </div>
                <div className="text-sm text-gray-600 dark:text-neutral-400">Account Lockouts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {securityData.securityEvents.last7Days.suspiciousIPs}
                </div>
                <div className="text-sm text-gray-600 dark:text-neutral-400">Suspicious IPs</div>
              </div>
            </div>
          </div>

          {/* Recent Revocations */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">Recent Revocations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">User</th>
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Reason</th>
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">IP Address</th>
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Revoked At</th>
                  </tr>
                </thead>
                <tbody>
                  {securityData.recentRevocations.map((token, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-neutral-800/50">
                      <td className="py-2 px-4 text-gray-900 dark:text-neutral-50">
                        {token.user ? token.user.email : 'N/A'}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          token.reason === 'logout' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                          token.reason === 'password_changed' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400' :
                          'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                        }`}>
                          {token.reason}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600 dark:text-neutral-400 font-mono text-xs">
                        {token.revokedByIp || 'N/A'}
                      </td>
                      <td className="py-2 px-4 text-gray-600 dark:text-neutral-400 text-xs">
                        {new Date(token.revokedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Revoked Users */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">Top Users with Revoked Tokens</h3>
            <div className="space-y-3">
              {securityData.topRevokedUsers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-neutral-50">
                      {item.user ? item.user.email : 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-neutral-400">
                      Reasons: {item.reasons.join(', ')}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {item.revokedCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          {/* Revoke User Tokens Form */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">Manually Revoke User Tokens</h3>
            <form onSubmit={handleRevokeUserTokens} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={revokeUserId}
                  onChange={(e) => setRevokeUserId(e.target.value)}
                  placeholder="Enter user ID to revoke all tokens"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Reason
                </label>
                <select
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50"
                >
                  <option value="security_incident">Security Incident</option>
                  <option value="admin_revoked">Admin Revoked</option>
                  <option value="account_deleted">Account Deleted</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={revoking}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {revoking ? 'Revoking...' : 'Revoke All User Tokens'}
              </button>
            </form>
          </div>

          {/* Revoked Tokens List */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">All Revoked Tokens</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">JTI</th>
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">User</th>
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Reason</th>
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Revoked At</th>
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {revokedTokens.map((token, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-neutral-800/50">
                      <td className="py-2 px-4 text-gray-600 dark:text-neutral-400 font-mono text-xs">
                        {token.jti.substring(0, 12)}...
                      </td>
                      <td className="py-2 px-4 text-gray-900 dark:text-neutral-50">
                        {token.user ? token.user.email : 'N/A'}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          token.reason === 'logout' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                          token.reason === 'password_changed' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400' :
                          'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                        }`}>
                          {token.reason}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600 dark:text-neutral-400 text-xs">
                        {new Date(token.revokedAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 text-gray-600 dark:text-neutral-400 text-xs">
                        {token.timeUntilExpiry}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && securitySettings && (
        <div className="space-y-6">
          {/* JWT Settings */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">JWT Settings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Access Token Expiry</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                  {securitySettings.jwt.accessTokenExpiry}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Refresh Token Expiry</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                  {securitySettings.jwt.refreshTokenExpiry} days
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Algorithm</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                  {securitySettings.jwt.algorithm}
                </div>
              </div>
            </div>
          </div>

          {/* Account Lockout Settings */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">Account Lockout</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Max Login Attempts</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                  {securitySettings.accountLockout.maxLoginAttempts}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Lock Duration</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                  {securitySettings.accountLockout.lockDuration} minutes
                </div>
              </div>
            </div>
          </div>

          {/* Password Policy */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">Password Policy</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Min Length</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                  {securitySettings.passwordPolicy.minLength} characters
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Bcrypt Rounds</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                  {securitySettings.passwordPolicy.bcryptRounds}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-2">Requirements</div>
                <div className="flex flex-wrap gap-2">
                  {securitySettings.passwordPolicy.requireUppercase && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                      Uppercase
                    </span>
                  )}
                  {securitySettings.passwordPolicy.requireLowercase && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                      Lowercase
                    </span>
                  )}
                  {securitySettings.passwordPolicy.requireNumbers && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                      Numbers
                    </span>
                  )}
                  {securitySettings.passwordPolicy.requireSpecialChars && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                      Special Characters
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Token Revocation Settings */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">Token Revocation</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-neutral-50">Blacklist Enabled</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  securitySettings.tokenRevocation.enableBlacklist
                    ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                }`}>
                  {securitySettings.tokenRevocation.enableBlacklist ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-neutral-50">User-Level Revocation</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  securitySettings.tokenRevocation.enableUserLevelRevocation
                    ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                }`}>
                  {securitySettings.tokenRevocation.enableUserLevelRevocation ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-neutral-50">Revoke on Password Change</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  securitySettings.tokenRevocation.revokeOnPasswordChange
                    ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                }`}>
                  {securitySettings.tokenRevocation.revokeOnPasswordChange ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
