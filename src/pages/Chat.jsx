import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import AppSidebar from '../components/AppSidebar';
import ChatSidebar from '../components/Chat/ChatSidebar';
import ChatMessageArea from '../components/Chat/ChatMessageArea';
import ChatMemberList from '../components/Chat/ChatMemberList';
import QuickSwitcher from '../components/Chat/QuickSwitcher';
import ActivityTab from '../components/Chat/ActivityTab';
import ThreadPanel from '../components/Chat/ThreadPanel';
import NotificationPrompt from '../components/Chat/NotificationPrompt';
import axios from 'axios';

const Chat = () => {
  const navigate = useNavigate();
  const { channelId } = useParams();
  const { user } = useAuth();
  const { activeChannel, threadMessage, setThreadMessage, channels, setActiveChannel, unreadCounts } = useChat();
  const [showMemberList, setShowMemberList] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [workspaces, setWorkspaces] = useState([]);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [chatView, setChatView] = useState('messages'); // 'messages' or 'activity'

  // Fetch workspaces for navigation
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workspaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWorkspaces(response.data);
      } catch (err) {
        console.error('Error fetching workspaces:', err);
      }
    };
    fetchWorkspaces();
  }, []);

  // Handle section change - navigate to proper routes
  const handleSectionChange = (section) => {
    console.log('📍 Chat navigating to section:', section);

    if (section === 'chat') {
      // Stay on chat page
      setActiveSection(section);
      return;
    }

    // Navigate to workspaces section
    if (section === 'workspaces') {
      const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
      if (lastWorkspaceId) {
        navigate(`/workspace/${lastWorkspaceId}`);
      } else if (workspaces.length > 0) {
        navigate(`/workspace/${workspaces[0]._id}`);
      } else {
        console.error('No workspaces available');
        alert('Please create or select a workspace first');
      }
      return;
    }

    // Navigate directly to section's route (VIP Calculator, Quick Links, etc.)
    navigate(`/${section}`);
  };

  // Update active channel when URL channelId changes
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const channel = channels.find(ch => ch._id === channelId);
      if (channel && (!activeChannel || activeChannel._id !== channelId)) {
        console.log('📍 Setting active channel from URL:', channelId);
        setActiveChannel(channel);
      }
    }
  }, [channelId, channels]);

  // Update URL when active channel changes
  useEffect(() => {
    if (activeChannel?._id) {
      const currentPath = window.location.pathname;
      const expectedPath = `/chat/${activeChannel._id}`;

      if (currentPath !== expectedPath) {
        console.log('📍 Updating URL to:', expectedPath);
        navigate(expectedPath, { replace: true });
      }
    }
  }, [activeChannel, navigate]);

  // Jump to first unread channel
  const jumpToUnread = () => {
    // Find first channel with unread messages
    const unreadChannel = channels.find(ch => (unreadCounts[ch._id] || 0) > 0);
    if (unreadChannel) {
      setActiveChannel(unreadChannel);
    }
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        // Allow Ctrl+/ even in inputs
        if (!((e.ctrlKey || e.metaKey) && e.key === '/')) {
          return;
        }
      }

      // Ctrl+K or Cmd+K for Quick Switcher
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSwitcher(true);
        return;
      }

      // Ctrl+/ for Keyboard Shortcuts Help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
        return;
      }

      // Ctrl+Shift+M for Activity/Mentions
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setChatView(prev => prev === 'activity' ? 'messages' : 'activity');
        return;
      }

      // Ctrl+J for Jump to Unread
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        jumpToUnread();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [channels, unreadCounts]);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-black">
      {/* Main App Sidebar (Icon Navigation) */}
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        currentWorkspace={null}
        workspaces={[]}
        bookmarks={[]}
        onAddWorkspace={() => {}}
        onEditWorkspace={() => {}}
        onDeleteWorkspace={() => {}}
        onSettingsWorkspace={() => {}}
        onWorkspaceClick={() => {}}
        onBookmarkClick={() => {}}
        onBookmarkUpdate={() => {}}
        onBookmarkDelete={() => {}}
        onCollapsedChange={() => {}}
        onRefreshWorkspaces={() => {}}
        viewMode="post-view"
      />

      {/* Chat Secondary Sidebar */}
      <ChatSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        chatView={chatView}
        onChatViewChange={setChatView}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {chatView === 'activity' ? (
          <ActivityTab />
        ) : activeChannel ? (
          <>
            <ChatMessageArea
              showMemberList={showMemberList}
              onToggleMemberList={() => setShowMemberList(!showMemberList)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400 dark:text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-2">
                No conversation selected
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Thread Panel (conditionally shown) */}
      {threadMessage && (
        <ThreadPanel
          parentMessage={threadMessage}
          onClose={() => setThreadMessage(null)}
        />
      )}

      {/* Member List Sidebar (conditionally shown) */}
      {activeChannel && showMemberList && !threadMessage && (
        <ChatMemberList channel={activeChannel} />
      )}

      {/* Quick Switcher Modal (Ctrl+K) */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
      />

      {/* Notification Permission Prompt */}
      <NotificationPrompt />

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowKeyboardShortcuts(false)}>
          <div className="bg-white dark:bg-[#1A1D21] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Navigation */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Navigation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Quick switcher</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+K</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Jump to unread</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+J</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Activity/Mentions</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+Shift+M</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Show shortcuts</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+/</kbd>
                  </div>
                </div>
              </div>

              {/* Formatting */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Formatting</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Bold</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+B</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Italic</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+I</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Strikethrough</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+Shift+X</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Code block</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+Shift+C</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Link</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Ctrl+Shift+U</kbd>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Messages</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Send message</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Enter</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">New line</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Shift+Enter</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Edit last message</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">↑</kbd>
                  </div>
                </div>
              </div>

              {/* On Hovered Message */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-3">On Hovered Message</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Edit message</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">E</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Add reaction</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">R</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Open thread</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">T</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Pin/Unpin</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">P</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[14px] text-gray-700 dark:text-neutral-300">Delete message</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-[12px] font-mono text-gray-600 dark:text-neutral-400">Delete</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
