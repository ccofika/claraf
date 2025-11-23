import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { X, Users, Hash, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import UserSearchModal from './UserSearchModal';

const CreateChannelModal = ({ onClose }) => {
  const { createChannel, createDM } = useChat();
  const [channelType, setChannelType] = useState('group'); // 'dm' or 'group'
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleCreate = async () => {
    console.log('🔵 Create button clicked');
    console.log('Channel type:', channelType);
    console.log('Channel name:', channelName);
    console.log('Selected members:', selectedMembers);

    // For DM, need exactly 1 member
    if (channelType === 'dm') {
      if (selectedMembers.length !== 1) {
        alert('Please select exactly one person for direct message');
        setShowUserSearch(true);
        return;
      }
    }

    // For group, name is required
    if (channelType === 'group' && !channelName.trim()) {
      alert('Please enter a channel name');
      return;
    }

    console.log('✅ Validation passed, creating channel...');
    setIsCreating(true);

    try {
      console.log('Calling createChannel with params:', {
        type: channelType,
        name: channelType === 'group' ? channelName.trim() : undefined,
        description: channelDescription.trim(),
        memberIds: selectedMembers
      });

      const newChannel = await createChannel(
        channelType,
        channelType === 'group' ? channelName.trim() : undefined,
        channelDescription.trim(),
        selectedMembers
      );

      console.log('✅ Channel created successfully:', newChannel);
      onClose();
    } catch (error) {
      console.error('❌ Failed to create channel:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to create channel: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create New Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel Type Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setChannelType('dm')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                channelType === 'dm'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">Direct Message</div>
            </button>

            <button
              onClick={() => setChannelType('group')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                channelType === 'group'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
              }`}
            >
              <Hash className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">Group Chat</div>
            </button>
          </div>

          {/* Group Channel Fields */}
          {channelType === 'group' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g., Team Discussion"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  placeholder="What's this channel about?"
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </>
          )}

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              {channelType === 'dm' ? 'Select Person' : 'Add Members (optional)'}
            </label>

            {selectedMembers.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-2">
                  {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
                </div>
                <button
                  type="button"
                  onClick={() => setShowUserSearch(true)}
                  className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Change Selection
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowUserSearch(true)}
                className="w-full px-3 py-8 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-center hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <UserPlus className="w-5 h-5 mx-auto mb-2 text-gray-400 dark:text-neutral-500" />
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Click to {channelType === 'dm' ? 'select person' : 'add members'}
                </p>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || (channelType === 'group' && !channelName.trim()) || (channelType === 'dm' && selectedMembers.length !== 1)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </DialogContent>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onSelectUsers={setSelectedMembers}
        selectedUserIds={selectedMembers}
        multiSelect={channelType === 'group'}
        title={channelType === 'dm' ? 'Select Person' : 'Add Members'}
      />
    </Dialog>
  );
};

export default CreateChannelModal;
