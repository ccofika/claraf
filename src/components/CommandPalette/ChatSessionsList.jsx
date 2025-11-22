import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const ChatSessionsList = ({ onSelectSession, onNewChat }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/canvas/chat-sessions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/canvas/chat-sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSessions(sessions.filter(s => s._id !== sessionId));
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete chat');
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-neutral-400">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Sessions List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent"
        style={{ maxHeight: 'calc(85vh - 100px)' }}>
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-neutral-700 mb-3" />
            <p className="text-gray-500 dark:text-neutral-400 text-sm">
              No chat history yet
            </p>
            <p className="text-gray-400 dark:text-neutral-500 text-xs mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session._id}
              onClick={() => onSelectSession(session._id)}
              className="group p-3 rounded-lg border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={12} className="text-gray-400 dark:text-neutral-500" />
                    <span className="text-xs text-gray-500 dark:text-neutral-400">
                      {formatDate(session.lastMessageAt)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-neutral-500">
                      · {session.messages.length} messages
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session._id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                >
                  <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSessionsList;
