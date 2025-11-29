import React, { useState, useEffect } from 'react';
import { X, Hash, Settings, Bell, BellOff, Users, LogOut, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChannelSettingsModal = ({ isOpen, onClose, channel }) => {
  const { user } = useAuth();
  const { fetchChannels, setActiveChannel } = useChat();

  const [activeTab, setActiveTab] = useState('about');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');

  // Notification settings
  const [notifyOn, setNotifyOn] = useState('all');

  // Convert DM states
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertName, setConvertName] = useState('');
  const [convertDescription, setConvertDescription] = useState('');

  // Leave confirmation
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Check if user is admin
  const isAdmin = channel?.members?.some(
    m => m.userId?._id === user?._id && m.role === 'admin'
  );

  // Initialize form values when channel changes
  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setDescription(channel.description || '');
      setTopic(channel.topic || '');
      fetchNotificationSettings();
    }
  }, [channel]);

  const fetchNotificationSettings = async () => {
    if (!channel?._id) return;

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${API_URL}/api/chat/channels/${channel._id}/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifyOn(data.notifyOn || 'all');
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const handleSaveAbout = async () => {
    if (!isAdmin) {
      toast.error('Only admins can edit channel settings');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/chat/channels/${channel._id}`,
        { name, description, topic },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Channel settings updated');
      await fetchChannels();
      onClose();
    } catch (error) {
      console.error('Error updating channel:', error);
      toast.error(error.response?.data?.message || 'Failed to update channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/chat/channels/${channel._id}/notifications`,
        { notifyOn },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Notifications set to: ${notifyOn}`);
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToGroup = async () => {
    if (!convertName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/api/chat/channels/${channel._id}/convert-to-group`,
        { name: convertName, description: convertDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Converted to group channel');
      await fetchChannels();
      setActiveChannel(data.channel);
      onClose();
    } catch (error) {
      console.error('Error converting to group:', error);
      toast.error(error.response?.data?.message || 'Failed to convert to group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveChannel = async () => {
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
      setShowLeaveConfirm(false);
    }
  };

  if (!isOpen || !channel) return null;

  const tabs = [
    { id: 'about', label: 'About', icon: Hash },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(channel.type !== 'dm' ? [{ id: 'members', label: 'Members', icon: Users }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1A1D21] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {channel.type === 'dm' ? 'Conversation Settings' : 'Channel Settings'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#1164A3] text-[#1164A3]'
                      : 'border-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Channel Name */}
              {channel.type !== 'dm' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#1164A3] focus:border-transparent disabled:opacity-50"
                    placeholder="Channel name"
                  />
                </div>
              )}

              {/* Topic */}
              {channel.type !== 'dm' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Topic
                    <span className="ml-2 text-xs text-gray-500 dark:text-neutral-500">
                      (Shows in channel header)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={!isAdmin}
                    maxLength={250}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#1164A3] focus:border-transparent disabled:opacity-50"
                    placeholder="Add a topic to let others know what this channel is about"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-neutral-500">
                    {topic.length}/250 characters
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isAdmin && channel.type !== 'dm'}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#1164A3] focus:border-transparent disabled:opacity-50 resize-none"
                  placeholder="Describe what this channel is for"
                />
              </div>

              {/* Save Button */}
              {isAdmin && channel.type !== 'dm' && (
                <button
                  onClick={handleSaveAbout}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-[#1164A3] hover:bg-[#0d5289] text-white font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              )}

              {/* Convert DM to Group */}
              {channel.type === 'dm' && (
                <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                  {!showConvertForm ? (
                    <button
                      onClick={() => setShowConvertForm(true)}
                      className="flex items-center gap-2 text-[#1164A3] hover:text-[#0d5289] font-medium"
                    >
                      <Users className="w-4 h-4" />
                      Convert to Group Channel
                    </button>
                  ) : (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Convert to Group Channel
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        This will convert your DM into a group channel. You can then add more members.
                      </p>
                      <input
                        type="text"
                        value={convertName}
                        onChange={(e) => setConvertName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1164A3]"
                        placeholder="Group name (required)"
                      />
                      <input
                        type="text"
                        value={convertDescription}
                        onChange={(e) => setConvertDescription(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1164A3]"
                        placeholder="Description (optional)"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleConvertToGroup}
                          disabled={isLoading || !convertName.trim()}
                          className="px-4 py-2 bg-[#1164A3] hover:bg-[#0d5289] text-white font-medium disabled:opacity-50"
                        >
                          {isLoading ? 'Converting...' : 'Convert'}
                        </button>
                        <button
                          onClick={() => setShowConvertForm(false)}
                          className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Leave Channel */}
              {channel.type !== 'dm' && (
                <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                  {!showLeaveConfirm ? (
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      className="flex items-center gap-2 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Leave Channel
                    </button>
                  ) : (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-800 dark:text-red-200">
                            Leave {channel.name}?
                          </h4>
                          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                            You will no longer have access to this channel's messages.
                            You'll need to be added back by an admin to rejoin.
                          </p>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={handleLeaveChannel}
                              disabled={isLoading}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
                            >
                              {isLoading ? 'Leaving...' : 'Leave Channel'}
                            </button>
                            <button
                              onClick={() => setShowLeaveConfirm(false)}
                              className="px-4 py-2 bg-white dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Notify me about...
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                    <input
                      type="radio"
                      name="notifyOn"
                      value="all"
                      checked={notifyOn === 'all'}
                      onChange={(e) => setNotifyOn(e.target.value)}
                      className="w-4 h-4 text-[#1164A3] focus:ring-[#1164A3]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        <span className="font-medium text-gray-900 dark:text-white">All messages</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                        Get notified for every new message in this channel
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                    <input
                      type="radio"
                      name="notifyOn"
                      value="mentions"
                      checked={notifyOn === 'mentions'}
                      onChange={(e) => setNotifyOn(e.target.value)}
                      className="w-4 h-4 text-[#1164A3] focus:ring-[#1164A3]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-neutral-400 font-mono">@</span>
                        <span className="font-medium text-gray-900 dark:text-white">Mentions only</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                        Only get notified when someone mentions you
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                    <input
                      type="radio"
                      name="notifyOn"
                      value="nothing"
                      checked={notifyOn === 'nothing'}
                      onChange={(e) => setNotifyOn(e.target.value)}
                      className="w-4 h-4 text-[#1164A3] focus:ring-[#1164A3]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BellOff className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        <span className="font-medium text-gray-900 dark:text-white">Nothing</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                        Don't receive any notifications from this channel
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSaveNotifications}
                disabled={isLoading}
                className="px-4 py-2.5 bg-[#1164A3] hover:bg-[#0d5289] text-white font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && channel.type !== 'dm' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {channel.members?.length || 0} members
              </h3>
              <div className="space-y-2">
                {channel.members?.map((member) => (
                  <div
                    key={member.userId?._id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
                  >
                    {member.userId?.avatar ? (
                      <img
                        src={member.userId.avatar}
                        alt={member.userId.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1164A3] flex items-center justify-center text-white font-medium">
                        {member.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {member.userId?.name || 'Unknown'}
                        </span>
                        {member.role === 'admin' && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-[#1164A3]/10 text-[#1164A3] rounded">
                            Admin
                          </span>
                        )}
                        {member.userId?._id === user?._id && (
                          <span className="text-xs text-gray-500 dark:text-neutral-500">
                            (you)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-neutral-400 truncate">
                        {member.userId?.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelSettingsModal;
