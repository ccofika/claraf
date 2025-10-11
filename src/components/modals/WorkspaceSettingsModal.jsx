import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Close, User } from '@carbon/icons-react';

const WorkspaceSettingsModal = ({ isOpen, onClose, workspace, onWorkspaceUpdated }) => {
  const [members, setMembers] = useState([]);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingMember, setProcessingMember] = useState(null);

  useEffect(() => {
    if (workspace) {
      // Extract members and invited members from workspace
      setMembers(workspace.members || []);
      setInvitedMembers(workspace.invitedMembers || []);
    }
  }, [workspace]);

  const handlePermissionToggle = async (member) => {
    if (!workspace) return;

    const userId = member.user._id || member.user;
    const currentPermission = member.permission;
    const newPermission = currentPermission === 'edit' ? 'view' : 'edit';

    setProcessingMember(userId);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/workspaces/${workspace._id}/members/${userId}/permission`,
        { permission: newPermission },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setMembers(response.data.members || []);

      // Notify parent
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated(response.data);
      }
    } catch (error) {
      console.error('Error updating member permission:', error);
      alert(error.response?.data?.message || 'Failed to update permission');
    } finally {
      setLoading(false);
      setProcessingMember(null);
    }
  };

  const handleCancelInvite = async (invitedUser) => {
    if (!workspace) return;

    const userId = invitedUser._id;

    setProcessingMember(userId);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/workspaces/${workspace._id}/invites/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setInvitedMembers(response.data.invitedMembers || []);

      // Notify parent
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated(response.data);
      }
    } catch (error) {
      console.error('Error canceling invite:', error);
      alert(error.response?.data?.message || 'Failed to cancel invite');
    } finally {
      setLoading(false);
      setProcessingMember(null);
    }
  };

  const getUserFromMember = (member) => {
    // Handle both populated and non-populated user objects
    if (member.user && typeof member.user === 'object') {
      return member.user;
    }
    return null;
  };

  const isOwner = (member) => {
    const user = getUserFromMember(member);
    if (!user || !workspace?.owner) return false;
    const userId = user._id || user;
    const ownerId = workspace.owner._id || workspace.owner;
    return userId.toString() === ownerId.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-neutral-50">
            Workspace Settings
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-neutral-400">
            Manage members and permissions for "{workspace?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Members Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-50 mb-3">
              Members ({members.length})
            </h3>

            <div className="space-y-2">
              {members.length > 0 ? (
                members.map((member) => {
                  const user = getUserFromMember(member);
                  if (!user) return null;

                  const userId = user._id || user;
                  const memberIsOwner = isOwner(member);
                  const isProcessing = processingMember === userId && loading;

                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="rounded-full size-8 bg-gray-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                          <User size={16} className="text-gray-700 dark:text-neutral-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-neutral-50 truncate flex items-center gap-2">
                            {user.name}
                            {memberIsOwner && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-neutral-400 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* Permission Toggle - Disabled for owner */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-neutral-400">
                          {member.permission === 'edit' ? 'Edit' : 'View'}
                        </span>
                        <button
                          onClick={() => handlePermissionToggle(member)}
                          disabled={memberIsOwner || isProcessing}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${
                            member.permission === 'edit'
                              ? 'bg-blue-600 dark:bg-blue-700'
                              : 'bg-gray-300 dark:bg-neutral-600'
                          } ${
                            memberIsOwner || isProcessing
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                          title={memberIsOwner ? 'Owner always has edit permission' : 'Toggle permission'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              member.permission === 'edit' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-sm text-gray-600 dark:text-neutral-400">
                  No members in this workspace
                </div>
              )}
            </div>
          </div>

          {/* Pending Invites Section */}
          {invitedMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-50 mb-3">
                Pending Invites ({invitedMembers.length})
              </h3>

              <div className="space-y-2">
                {invitedMembers.map((invitedUser) => {
                  const userId = invitedUser._id;
                  const isProcessing = processingMember === userId && loading;

                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="rounded-full size-8 bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center shrink-0">
                          <User size={16} className="text-yellow-700 dark:text-yellow-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-neutral-50 truncate">
                            {invitedUser.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-neutral-400 truncate">
                            {invitedUser.email}
                          </div>
                        </div>
                      </div>

                      {/* Cancel Invite Button */}
                      <button
                        onClick={() => handleCancelInvite(invitedUser)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cancel invite"
                      >
                        <Close size={20} className="text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceSettingsModal;
