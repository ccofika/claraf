import React, { useState } from 'react';
import { X, AlertTriangle, LogOut } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useChat } from '../../context/ChatContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LeaveChannelModal = ({ isOpen, onClose, channel }) => {
  const { fetchChannels, setActiveChannel } = useChat();
  const [isLoading, setIsLoading] = useState(false);

  const handleLeave = async () => {
    if (!channel?._id) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/chat/channels/${channel._id}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Left channel successfully');
      setActiveChannel(null);
      await fetchChannels();
      onClose();
    } catch (error) {
      console.error('Error leaving channel:', error);
      toast.error(error.response?.data?.message || 'Failed to leave channel');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !channel) return null;

  const channelName = channel.name || 'this channel';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1A1D21] w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <LogOut className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Leave Channel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Leave #{channelName}?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                You will no longer have access to this channel's messages and files.
                To rejoin, you'll need to be added back by a channel admin.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-neutral-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLeave}
            disabled={isLoading}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Leave Channel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveChannelModal;
