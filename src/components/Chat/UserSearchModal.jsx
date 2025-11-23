import React, { useState, useEffect } from 'react';
import { Search, X, UserPlus, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import axios from 'axios';

const UserSearchModal = ({ isOpen, onClose, onSelectUsers, selectedUserIds = [], multiSelect = true, title = "Add Members" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(selectedUserIds);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isOpen) {
      searchUsers();
    }
  }, [isOpen, searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Use existing /api/auth/users endpoint (same as workspace modals)
      const response = await axios.get(`${API_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter users based on search query (client-side)
      let filteredUsers = response.data;
      if (searchQuery && searchQuery.trim().length > 0) {
        filteredUsers = response.data.filter(user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId) => {
    if (multiSelect) {
      setSelectedUsers(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    } else {
      setSelectedUsers([userId]);
      onSelectUsers([userId]);
      onClose();
    }
  };

  const handleDone = () => {
    onSelectUsers(selectedUsers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* User List */}
          <div className="max-h-96 overflow-y-auto space-y-1">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-neutral-400">
                Searching...
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-neutral-400">
                {searchQuery ? 'No users found' : 'Start typing to search users'}
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => toggleUser(user._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedUsers.includes(user._id)
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {selectedUsers.includes(user._id) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-neutral-50">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-neutral-400">
                      {user.email}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          {multiSelect && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-neutral-800">
              <span className="text-sm text-gray-600 dark:text-neutral-400">
                {selectedUsers.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDone}
                  disabled={selectedUsers.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSearchModal;
