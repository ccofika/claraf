import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Users, X, Check, Lock, Globe } from 'lucide-react';
import { Badge } from '../ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

const ShareDialog = ({ open, onOpenChange, category, onUpdateCategory }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState('view');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Fetch available users
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      setSharing(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category/${category._id}/share`,
        { userIds: selectedUsers, permission },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onUpdateCategory(response.data);
      toast.success('Category shared successfully');
      setSelectedUsers([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing category:', error);
      toast.error('Failed to share category');
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category/${category._id}/share/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onUpdateCategory(response.data);
      toast.success('User removed from sharing');
    } catch (error) {
      console.error('Error unsharing:', error);
      toast.error('Failed to remove user');
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category/${category._id}/toggle-privacy`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onUpdateCategory(response.data);
      toast.success(response.data.isPrivate ? 'Category set to private' : 'Category set to public');
    } catch (error) {
      console.error('Error toggling privacy:', error);
      toast.error('Failed to update privacy');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Filter users by search query and exclude already shared users
  const filteredUsers = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !category?.sharedWith?.some((share) => share.userId._id === user._id)
  );

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share "{category.categoryName}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {category.isPrivate ? (
                <Lock className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Globe className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {category.isPrivate ? 'Private Category' : 'Public Category'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {category.isPrivate
                    ? 'Only you and shared users can access'
                    : 'Anyone in your workspace can view'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePrivacy}
              className="px-3 py-1.5 text-xs font-medium border border-input rounded-lg hover:bg-muted/50 transition-colors"
            >
              Make {category.isPrivate ? 'Public' : 'Private'}
            </button>
          </div>

          {/* Currently Shared With */}
          {category.sharedWith && category.sharedWith.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-card-foreground mb-2 block">
                Shared With ({category.sharedWith.length})
              </Label>
              <div className="space-y-2">
                {category.sharedWith.map((share) => (
                  <div
                    key={share.userId._id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {share.userId.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{share.userId.name}</p>
                        <p className="text-xs text-muted-foreground">{share.userId.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {share.permission}
                      </Badge>
                      <button
                        onClick={() => handleUnshare(share.userId._id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Remove access"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add People */}
          <div>
            <Label className="text-sm font-medium text-card-foreground mb-2 block">
              Add People
            </Label>

            {/* Search */}
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
            />

            {/* Permission Selector */}
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-xs text-muted-foreground">Permission:</Label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="px-2 py-1 text-xs border border-input rounded bg-card"
              >
                <option value="view">Can View</option>
                <option value="edit">Can Edit</option>
              </select>
            </div>

            {/* User List */}
            <div className="max-h-[200px] overflow-y-auto space-y-1 border border-border rounded-lg p-2">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {searchQuery ? 'No users found' : 'No more users to add'}
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedUsers([]);
              onOpenChange(false);
            }}
            className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
            disabled={sharing}
          >
            Close
          </button>
          {selectedUsers.length > 0 && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              {sharing ? 'Sharing...' : `Share with ${selectedUsers.length}`}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
