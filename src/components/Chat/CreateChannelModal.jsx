import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { X, Users, Hash, UserPlus, Loader2 } from 'lucide-react';
import UserSearchModal from './UserSearchModal';

const CreateChannelModal = ({ onClose }) => {
  const { createChannel } = useChat();
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
        <div
          className="w-full max-w-lg bg-white dark:bg-[#1A1D21] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-900 dark:text-white" />
              <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                Create New Conversation
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Channel Type Selection */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-600 dark:text-neutral-400 mb-2">
                  Conversation Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChannelType('dm')}
                    className={`flex-1 px-4 py-3 border transition-all ${
                      channelType === 'dm'
                        ? 'border-[#1164A3] bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    <Users className="w-5 h-5 mx-auto mb-1 text-gray-900 dark:text-white" />
                    <div className="text-[15px] font-medium text-gray-900 dark:text-white">Direct Message</div>
                  </button>

                  <button
                    onClick={() => setChannelType('group')}
                    className={`flex-1 px-4 py-3 border transition-all ${
                      channelType === 'group'
                        ? 'border-[#1164A3] bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    <Hash className="w-5 h-5 mx-auto mb-1 text-gray-900 dark:text-white" />
                    <div className="text-[15px] font-medium text-gray-900 dark:text-white">Group Chat</div>
                  </button>
                </div>
              </div>

              {/* Group Channel Fields */}
              {channelType === 'group' && (
                <>
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-neutral-400 mb-2">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="e.g., Team Discussion"
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-700 text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:border-[#1164A3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-neutral-400 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={channelDescription}
                      onChange={(e) => setChannelDescription(e.target.value)}
                      placeholder="What's this channel about?"
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-700 text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:border-[#1164A3] resize-none"
                    />
                  </div>
                </>
              )}

              {/* Member Selection */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-600 dark:text-neutral-400 mb-2">
                  {channelType === 'dm' ? 'Select Person' : 'Add Members (optional)'}
                </label>

                {selectedMembers.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[13px] text-gray-600 dark:text-neutral-400 mb-2">
                      {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUserSearch(true)}
                      className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-[15px] text-[#1164A3] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Change Selection
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUserSearch(true)}
                    className="w-full px-3 py-8 bg-gray-50 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-center hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <UserPlus className="w-5 h-5 mx-auto mb-2 text-gray-400 dark:text-neutral-500" />
                    <p className="text-[15px] text-gray-600 dark:text-neutral-400">
                      Click to {channelType === 'dm' ? 'select person' : 'add members'}
                    </p>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[15px] font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || (channelType === 'group' && !channelName.trim()) || (channelType === 'dm' && selectedMembers.length !== 1)}
              className="px-4 py-2 text-[15px] font-medium text-white bg-[#1164A3] hover:bg-[#0E5A8A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onSelectUsers={setSelectedMembers}
        selectedUserIds={selectedMembers}
        multiSelect={channelType === 'group'}
        title={channelType === 'dm' ? 'Select Person' : 'Add Members'}
      />
    </>
  );
};

export default CreateChannelModal;
