import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import axios from 'axios';
import { Bell, MessageSquare, Heart, AtSign, CheckCheck, Trash2, Filter } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ActivityTab = () => {
  const { user, socket } = useChat();
  const [activities, setActivities] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({ totalUnread: 0, unreadByType: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, mention, reply, reaction
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Fetch activities
  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};

      if (filter !== 'all') params.type = filter;
      if (showOnlyUnread) params.isRead = false;

      const { data } = await axios.get(`${API_URL}/api/activities`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setActivities(data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread counts
  const fetchUnreadCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/activities/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnreadCounts(data);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchUnreadCounts();
  }, [filter, showOnlyUnread]);

  // Listen for new activities via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.on('activity:new', (data) => {
      // Add new activity to top of list
      setActivities(prev => [data, ...prev]);

      // Increment unread count
      setUnreadCounts(prev => ({
        totalUnread: prev.totalUnread + 1,
        unreadByType: {
          ...prev.unreadByType,
          [data.type]: (prev.unreadByType[data.type] || 0) + 1
        }
      }));

      // Show browser notification if tab not focused
      if (document.hidden && Notification.permission === 'granted') {
        new Notification('New Activity', {
          body: getActivityText(data),
          icon: '/favicon.ico'
        });
      }
    });

    socket.on('activities:marked_read', ({ filters }) => {
      // Update local state when activities marked as read
      if (!filters || !filters.type) {
        // All marked as read
        setActivities(prev => prev.map(a => ({ ...a, isRead: true })));
        setUnreadCounts({ totalUnread: 0, unreadByType: {} });
      } else {
        // Specific type marked as read
        setActivities(prev =>
          prev.map(a => (a.type === filters.type ? { ...a, isRead: true } : a))
        );
        setUnreadCounts(prev => ({
          totalUnread: prev.totalUnread - (prev.unreadByType[filters.type] || 0),
          unreadByType: { ...prev.unreadByType, [filters.type]: 0 }
        }));
      }
    });

    return () => {
      socket.off('activity:new');
      socket.off('activities:marked_read');
    };
  }, [socket]);

  // Mark activity as read
  const markAsRead = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/activities/${activityId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setActivities(prev =>
        prev.map(a => (a._id === activityId ? { ...a, isRead: true } : a))
      );

      // Decrement unread count
      const activity = activities.find(a => a._id === activityId);
      if (activity && !activity.isRead) {
        setUnreadCounts(prev => ({
          totalUnread: Math.max(0, prev.totalUnread - 1),
          unreadByType: {
            ...prev.unreadByType,
            [activity.type]: Math.max(0, (prev.unreadByType[activity.type] || 0) - 1)
          }
        }));
      }
    } catch (error) {
      console.error('Error marking activity as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {};

      if (filter !== 'all') {
        payload.type = filter;
      }

      await axios.post(`${API_URL}/api/activities/mark-all-read`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setActivities(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCounts({ totalUnread: 0, unreadByType: {} });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete activity
  const deleteActivity = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActivities(prev => prev.filter(a => a._id !== activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  // Get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-4 h-4 text-blue-500" />;
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'reaction':
        return <Heart className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get activity text
  const getActivityText = (activity) => {
    const userName = activity.triggeredBy?.name || 'Someone';
    const channelName = activity.channel?.name || 'a channel';

    switch (activity.type) {
      case 'mention':
        return `${userName} mentioned you in ${channelName}`;
      case 'reply':
        return `${userName} replied to your message in ${channelName}`;
      case 'reaction':
        return `${userName} reacted ${activity.metadata?.emoji || '❤️'} to your message in ${channelName}`;
      default:
        return `New activity from ${userName}`;
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 dark:text-neutral-400">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1D21]">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/60 dark:border-neutral-800/60">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
            Activity
          </h2>
          {unreadCounts.totalUnread > 0 && (
            <span className="px-2 py-0.5 bg-[#E01E5A] text-white text-[11px] font-bold rounded-full">
              {unreadCounts.totalUnread}
            </span>
          )}
        </div>

        <button
          onClick={markAllAsRead}
          disabled={unreadCounts.totalUnread === 0}
          className="px-3 py-1.5 flex items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Mark all as read"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-gray-200/60 dark:border-neutral-800/60 flex items-center gap-2">
        {[
          { id: 'all', label: 'All', count: unreadCounts.totalUnread },
          { id: 'mention', label: 'Mentions', count: unreadCounts.unreadByType.mention || 0 },
          { id: 'reply', label: 'Replies', count: unreadCounts.unreadByType.reply || 0 },
          { id: 'reaction', label: 'Reactions', count: unreadCounts.unreadByType.reaction || 0 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${
              filter === tab.id
                ? 'text-gray-900 dark:text-white border-b-2 border-[#1164A3]'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-[11px]">({tab.count})</span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => setShowOnlyUnread(!showOnlyUnread)}
          className={`px-3 py-1.5 flex items-center gap-2 text-[13px] font-medium transition-colors ${
            showOnlyUnread
              ? 'text-white bg-[#1164A3]'
              : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Unread only
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bell className="w-12 h-12 text-gray-300 dark:text-neutral-600 mb-3" />
            <p className="text-[15px] font-medium text-gray-900 dark:text-white mb-1">
              No activities yet
            </p>
            <p className="text-[13px] text-gray-500 dark:text-neutral-400">
              You'll see mentions, replies, and reactions here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/60 dark:divide-neutral-800/60">
            {activities.map(activity => (
              <div
                key={activity._id}
                className={`group px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer ${
                  !activity.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => !activity.isRead && markAsRead(activity._id)}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-gray-900 dark:text-white mb-1">
                      <span className="font-semibold">{activity.triggeredBy?.name}</span>
                      {activity.type === 'mention' && ' mentioned you'}
                      {activity.type === 'reply' && ' replied to your message'}
                      {activity.type === 'reaction' && (
                        <> reacted <span className="text-[16px]">{activity.metadata?.emoji || '❤️'}</span></>
                      )}
                      {' in '}
                      <span className="font-medium">#{activity.channel?.name}</span>
                    </p>

                    {/* Message excerpt */}
                    {activity.metadata?.excerpt && (
                      <p className="text-[13px] text-gray-600 dark:text-neutral-400 line-clamp-2 mb-1">
                        {activity.metadata.excerpt}
                      </p>
                    )}

                    <p className="text-[11px] text-gray-500 dark:text-neutral-500">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!activity.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(activity._id);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteActivity(activity._id);
                      }}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600 dark:text-neutral-400 hover:text-red-600" />
                    </button>
                  </div>

                  {/* Unread indicator */}
                  {!activity.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 bg-[#1164A3] rounded-full mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTab;
