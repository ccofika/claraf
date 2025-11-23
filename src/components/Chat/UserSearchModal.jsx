import React, { useState, useEffect } from 'react';
import { Search, X, UserPlus, Loader2 } from 'lucide-react';
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

  // Generate soft avatar color based on user ID
  const getAvatarColor = (userId) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    ];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1A1D21] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gray-900 dark:text-white" />
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200/60 dark:border-neutral-800/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-700 text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:border-[#1164A3]"
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-gray-400 dark:text-neutral-600 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-gray-500 dark:text-neutral-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-[15px]">{searchQuery ? 'No users found' : 'Start typing to search users'}</p>
            </div>
          ) : (
            <div>
              {users.map((user) => {
                const isSelected = selectedUsers.includes(user._id);

                return (
                  <div
                    key={user._id}
                    onClick={() => toggleUser(user._id)}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1A1D21] transition-colors cursor-pointer border-b border-gray-100 dark:border-neutral-900 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${getAvatarColor(user._id)}`}>
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-gray-900 dark:text-neutral-50">
                          {user.name}
                        </div>
                        <div className="text-[13px] text-gray-500 dark:text-neutral-400 truncate">
                          {user.email}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#1164A3] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {multiSelect && (
          <div className="px-6 py-4 border-t border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-between">
            <span className="text-[13px] text-gray-600 dark:text-neutral-400">
              {selectedUsers.length} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[15px] font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 text-[15px] font-medium text-white bg-[#1164A3] hover:bg-[#0E5A8A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearchModal;
