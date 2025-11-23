import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppSidebar from './AppSidebar';
import axios from 'axios';

const PageLayout = ({ children, activeSection }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  // Fetch workspaces for sidebar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch workspaces
        const workspacesRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workspaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWorkspaces(workspacesRes.data);

        // Fetch bookmarks
        const bookmarksRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/bookmarks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookmarks(bookmarksRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handleSectionChange = (section) => {
    console.log('📍 PageLayout navigating to:', section);

    if (section === 'chat') {
      navigate('/chat');
    } else if (section === 'workspaces') {
      // Navigate to last workspace
      const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
      if (lastWorkspaceId) {
        navigate(`/workspace/${lastWorkspaceId}`);
      } else if (workspaces.length > 0) {
        navigate(`/workspace/${workspaces[0]._id}`);
      }
    } else {
      // Navigate to section's direct route
      navigate(`/${section}`);
    }
  };

  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleBookmarkClick = (bookmark) => {
    // Navigate to workspace with bookmark
    if (bookmark.workspace?._id) {
      navigate(`/workspace/${bookmark.workspace._id}`, {
        state: { scrollToElement: bookmark.element._id }
      });
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        currentWorkspace={null}
        workspaces={workspaces}
        bookmarks={bookmarks}
        onAddWorkspace={() => {}}
        onEditWorkspace={() => {}}
        onDeleteWorkspace={() => {}}
        onSettingsWorkspace={() => {}}
        onWorkspaceClick={handleWorkspaceClick}
        onBookmarkClick={handleBookmarkClick}
        onBookmarkUpdate={() => {}}
        onBookmarkDelete={() => {}}
        onCollapsedChange={() => {}}
        onRefreshWorkspaces={() => {}}
        viewMode="post-view"
      />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
