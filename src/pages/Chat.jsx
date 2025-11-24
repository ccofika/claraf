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
  const { activeChannel, threadMessage, setThreadMessage, channels, setActiveChannel } = useChat();
  const [showMemberList, setShowMemberList] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [workspaces, setWorkspaces] = useState([]);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
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

  // Keyboard shortcut handler for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K for Quick Switcher
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSwitcher(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    </div>
  );
};

export default Chat;
