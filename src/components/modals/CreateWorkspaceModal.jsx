import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Close, CheckmarkFilled } from '@carbon/icons-react';

const CreateWorkspaceModal = ({ isOpen, onClose, onWorkspaceCreated }) => {
  const { user } = useAuth();
  const [workspaceName, setWorkspaceName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Filter out current user from the list
      const filteredUsers = response.data.filter(u => u._id !== user?._id);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!workspaceName.trim()) {
      setError('Workspace name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/workspaces`,
        {
          name: workspaceName,
          type: 'personal',
          invitedMembers: selectedUsers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onWorkspaceCreated(response.data);
      handleClose();
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setWorkspaceName('');
    setSelectedUsers([]);
    setSearchQuery('');
    setError('');
    onClose();
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-neutral-50">
            Create New Workspace
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-neutral-400">
            Create a new workspace and invite team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Workspace Name */}
          <div>
            <label
              htmlFor="workspace-name"
              className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2"
            >
              Workspace Name
            </label>
            <input
              id="workspace-name"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Enter workspace name..."
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-50 placeholder:text-gray-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            />
          </div>

          {/* Invited Persons */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-2">
              Invited Persons (Optional)
            </label>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 mb-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-50 placeholder:text-gray-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            />

            {/* Users List */}
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-neutral-700 rounded-lg">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => toggleUserSelection(user._id)}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-neutral-50">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-neutral-400">
                        {user.email}
                      </div>
                    </div>
                    {selectedUsers.includes(user._id) && (
                      <CheckmarkFilled
                        size={20}
                        className="text-blue-600 dark:text-blue-500"
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-600 dark:text-neutral-400">
                  No users found
                </div>
              )}
            </div>

            {/* Selected Count */}
            {selectedUsers.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceModal;
