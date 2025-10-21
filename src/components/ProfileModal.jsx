import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const { theme, changeTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      // Set default username as email prefix
      const emailPrefix = user.email?.split('@')[0] || '';
      setUsername(user.name || emailPrefix);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/profile`,
        { name: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/change-password`,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true // Ensure cookies are sent/received
        }
      );

      // SECURITY: Update token in localStorage with new token from response
      // This keeps the current session active while invalidating all other sessions
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      setSuccess('Password changed successfully! All other sessions have been logged out.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white dark:bg-black border border-gray-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-neutral-50">Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Profile & Theme */}
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 pb-2 border-b border-gray-200 dark:border-neutral-800">
                  Profile Information
                </h3>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 rounded-md shadow-sm cursor-not-allowed text-gray-600 dark:text-neutral-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">Email cannot be changed</p>
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>

              {/* Theme Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 pb-2 border-b border-gray-200 dark:border-neutral-800">
                  Appearance
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value="white"
                      checked={theme === 'white'}
                      onChange={(e) => changeTheme(e.target.value)}
                      className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-2 focus:ring-gray-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-neutral-50">Light Theme</span>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">Clean and bright interface</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => changeTheme(e.target.value)}
                      className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-2 focus:ring-gray-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-neutral-50">Dark Theme</span>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">Easy on the eyes</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 pb-2 border-b border-gray-200 dark:border-neutral-800">
                Change Password
              </h3>

              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                  Current Password
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">Must be at least 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading || !oldPassword || !newPassword || !confirmPassword}
                className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const { theme, changeTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      // Set default username as email prefix
      const emailPrefix = user.email?.split('@')[0] || '';
      setUsername(user.name || emailPrefix);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/profile`,
        { name: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/change-password`,
        {
          oldPassword,
          newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white dark:bg-black border border-gray-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-neutral-50">Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Profile & Theme */}
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 pb-2 border-b border-gray-200 dark:border-neutral-800">
                  Profile Information
                </h3>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 rounded-md shadow-sm cursor-not-allowed text-gray-600 dark:text-neutral-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">Email cannot be changed</p>
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>

              {/* Theme Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 pb-2 border-b border-gray-200 dark:border-neutral-800">
                  Appearance
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value="white"
                      checked={theme === 'white'}
                      onChange={(e) => changeTheme(e.target.value)}
                      className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-2 focus:ring-gray-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-neutral-50">Light Theme</span>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">Clean and bright interface</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => changeTheme(e.target.value)}
                      className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-2 focus:ring-gray-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-neutral-50">Dark Theme</span>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">Easy on the eyes</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 pb-2 border-b border-gray-200 dark:border-neutral-800">
                Change Password
              </h3>

              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                  Current Password
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">Must be at least 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading || !oldPassword || !newPassword || !confirmPassword}
                className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
