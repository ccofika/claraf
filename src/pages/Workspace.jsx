import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InfiniteCanvas from '../components/InfiniteCanvas';
import AppSidebar from '../components/AppSidebar';
import HashExplorerFinder from './HashExplorerFinder';
import VIPProgressCalculator from './VIPProgressCalculator';
import QuickLinks from './QuickLinks';
import DeveloperDashboard from './DeveloperDashboard';
import AffiliateBonusFinder from './AffiliateBonusFinder';
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';
import EditWorkspaceModal from '../components/modals/EditWorkspaceModal';
import WorkspaceSettingsModal from '../components/modals/WorkspaceSettingsModal';
import TitleNavigation from '../components/TitleNavigation';

const Workspace = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [canvas, setCanvas] = useState(null);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('workspaces');
  const [bookmarks, setBookmarks] = useState([]);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState(null);
  const [workspaceToManage, setWorkspaceToManage] = useState(null);

  const fetchAllWorkspaces = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const workspacesRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/workspaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces(workspacesRes.data);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  }, []);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        setSwitchingWorkspace(true);
        const token = localStorage.getItem('token');

        // Fetch all workspaces
        await fetchAllWorkspaces();

        // Fetch current workspace
        const workspaceRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workspaces/${workspaceId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWorkspace(workspaceRes.data);

        // Fetch canvas
        const canvasRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/canvas/workspace/${workspaceId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCanvas(canvasRes.data);

        // Fetch canvas elements
        const elementsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/canvas/${canvasRes.data._id}/elements`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setElements(elementsRes.data);

        setLoading(false);
        setSwitchingWorkspace(false);
      } catch (err) {
        console.error('Error fetching workspace data:', err);
        setError(err.response?.data?.message || 'Failed to load workspace');
        setLoading(false);
        setSwitchingWorkspace(false);
      }
    };

    fetchWorkspaceData();
  }, [workspaceId, fetchAllWorkspaces]);

  // Fetch bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/bookmarks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookmarks(response.data);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
      }
    };

    fetchBookmarks();
  }, []);

  // Fetch and load view mode preference for current workspace
  useEffect(() => {
    const fetchViewModePreference = async () => {
      if (!workspaceId || !workspace?.permissions?.canEditContent) {
        setIsViewMode(true); // Force view mode if can't edit
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/user/preferences/workspace/${workspaceId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsViewMode(response.data.viewMode === 'view');
      } catch (err) {
        console.error('Error fetching view mode preference:', err);
        setIsViewMode(true); // Default to view mode on error (no preference saved yet)
      }
    };

    fetchViewModePreference();
  }, [workspaceId, workspace?.permissions?.canEditContent]);

  const handleElementUpdate = async (updatedElement) => {
    // Update local state immediately (optimistic update)
    setElements(prevElements =>
      prevElements.map(el => el._id === updatedElement._id ? updatedElement : el)
    );

    // Then save to backend
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/canvas/elements/${updatedElement._id}`,
        updatedElement,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error updating element:', err);
      // TODO: Optionally revert the optimistic update on error
    }
  };

  const handleElementCreate = async (newElement) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/canvas/${canvas._id}/elements`,
        newElement,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Use functional form to ensure we use the latest state
      setElements(prevElements => [...prevElements, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error creating element:', err);
      return null;
    }
  };

  const handleElementDelete = async (elementId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/canvas/elements/${elementId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Use functional form to ensure we use the latest state
      setElements(prevElements => prevElements.filter(el => el._id !== elementId));
    } catch (err) {
      console.error('Error deleting element:', err);
    }
  };

  const handleAddWorkspace = () => {
    setIsCreateModalOpen(true);
  };

  const handleWorkspaceCreated = (newWorkspace) => {
    // Use functional form to ensure we use the latest state
    setWorkspaces(prevWorkspaces => [...prevWorkspaces, newWorkspace]);
    navigate(`/workspace/${newWorkspace._id}`);
  };

  const handleEditWorkspace = (workspaceId) => {
    const ws = workspaces.find(w => w._id === workspaceId);
    if (ws) {
      setWorkspaceToEdit(ws);
      setIsEditModalOpen(true);
    }
  };

  const handleSettingsWorkspace = (workspaceId) => {
    const ws = workspaces.find(w => w._id === workspaceId);
    if (ws) {
      setWorkspaceToManage(ws);
      setIsSettingsModalOpen(true);
    }
  };

  const handleWorkspaceUpdated = async (updatedWorkspace) => {
    // Update the workspace in the list
    setWorkspaces(prevWorkspaces => prevWorkspaces.map(w =>
      w._id === updatedWorkspace._id ? updatedWorkspace : w
    ));

    // If it's the current workspace, update it
    if (workspace?._id === updatedWorkspace._id) {
      setWorkspace(updatedWorkspace);
    }

    // Also refresh the full workspaces list to get any new invited members, etc.
    await fetchAllWorkspaces();
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/workspaces/${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Use functional form to ensure we use the latest state
      setWorkspaces(prevWorkspaces => {
        const remainingWorkspaces = prevWorkspaces.filter(w => w._id !== workspaceId);

        // If deleting current workspace, navigate to another one
        if (workspace?._id === workspaceId) {
          if (remainingWorkspaces.length > 0) {
            navigate(`/workspace/${remainingWorkspaces[0]._id}`);
          } else {
            navigate('/');
          }
        }

        return remainingWorkspaces;
      });
    } catch (err) {
      console.error('Error deleting workspace:', err);
      alert(err.response?.data?.message || 'Failed to delete workspace');
    }
  };

  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleElementNavigate = useCallback((element) => {
    // Navigate to the workspace containing the element
    if (element.workspaceId && element.workspaceId !== workspaceId) {
      // Store the element to navigate to after workspace switch
      sessionStorage.setItem('pendingElementNavigation', JSON.stringify(element));
      navigate(`/workspace/${element.workspaceId}`);
    }
  }, [workspaceId, navigate]);

  const handleBookmarkClick = useCallback((bookmark) => {
    if (bookmark.workspace._id !== workspaceId) {
      // Navigate to different workspace with element ID
      navigate(`/workspace/${bookmark.workspace._id}?element=${bookmark.element._id}`);
    } else {
      // Zoom to element in current workspace
      const event = new CustomEvent('zoomToElement', { detail: bookmark.element });
      window.dispatchEvent(event);
    }
  }, [workspaceId, navigate]);

  const handleBookmarkUpdate = async (bookmarkId, newName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/bookmarks/${bookmarkId}`,
        { customName: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Use functional form to ensure we use the latest state
      setBookmarks(prevBookmarks => prevBookmarks.map(b => b._id === bookmarkId ? response.data : b));
    } catch (err) {
      console.error('Error updating bookmark:', err);
    }
  };

  const handleBookmarkDelete = async (bookmarkId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/bookmarks/${bookmarkId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Use functional form to ensure we use the latest state
      setBookmarks(prevBookmarks => prevBookmarks.filter(b => b._id !== bookmarkId));
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  };

  const handleBookmarkCreated = useCallback((newBookmark) => {
    setBookmarks(prevBookmarks => [...prevBookmarks, newBookmark]);
  }, []);

  const handleTitleClick = useCallback((element) => {
    // Zoom to the title element
    const event = new CustomEvent('zoomToElement', { detail: element });
    window.dispatchEvent(event);
  }, []);

  const handleViewModeToggle = async (newViewMode) => {
    setIsViewMode(newViewMode);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/user/preferences/workspace/${workspaceId}`,
        { viewMode: newViewMode ? 'view' : 'edit' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error saving view mode preference:', err);
    }
  };

  // Handle pending element navigation after workspace switch
  React.useEffect(() => {
    const pendingNav = sessionStorage.getItem('pendingElementNavigation');
    if (pendingNav && !switchingWorkspace && canvas) {
      try {
        const element = JSON.parse(pendingNav);
        sessionStorage.removeItem('pendingElementNavigation');

        // Find the element in current workspace
        const foundElement = elements.find(el => el._id === element._id);
        if (foundElement) {
          // Trigger zoom to element after a short delay to ensure canvas is ready
          setTimeout(() => {
            // This will be handled by the InfiniteCanvas component
            const event = new CustomEvent('zoomToElement', { detail: foundElement });
            window.dispatchEvent(event);
          }, 500);
        }
      } catch (err) {
        console.error('Error handling pending navigation:', err);
      }
    }
  }, [canvas, elements, switchingWorkspace]);

  // Auto-zoom to latest title element when workspace loads (unless there's pending navigation)
  const hasZoomedToLatestTitle = React.useRef(false);
  React.useEffect(() => {
    // Reset the flag when workspace changes
    if (workspaceId) {
      hasZoomedToLatestTitle.current = false;
    }
  }, [workspaceId]);

  React.useEffect(() => {
    // Only zoom if:
    // 1. No pending navigation
    // 2. Canvas is ready
    // 3. Elements are loaded
    // 4. Haven't zoomed yet for this workspace
    // 5. Not currently switching workspaces
    const pendingNav = sessionStorage.getItem('pendingElementNavigation');

    if (!pendingNav && canvas && elements.length > 0 && !switchingWorkspace && !hasZoomedToLatestTitle.current) {
      // Find the latest title element (sorted by createdAt descending)
      const titleElements = elements
        .filter(el => el.type === 'title')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const latestTitle = titleElements[0];

      if (latestTitle) {
        // Mark that we've zoomed to prevent re-triggering
        hasZoomedToLatestTitle.current = true;

        // Trigger zoom to latest title after a short delay to ensure canvas is ready
        setTimeout(() => {
          const event = new CustomEvent('zoomToElement', { detail: latestTitle });
          window.dispatchEvent(event);
        }, 500);
      }
    }
  }, [canvas, elements, switchingWorkspace]);

  // Auto-redirect to announcements workspace if access is denied
  useEffect(() => {
    if (error && error.toLowerCase().includes('access denied')) {
      const timer = setTimeout(() => {
        // Find announcements workspace
        const announcementsWorkspace = workspaces.find(w => w.type === 'announcements');
        if (announcementsWorkspace) {
          navigate(`/workspace/${announcementsWorkspace._id}`);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [error, workspaces, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-black">
        <div className="text-xl text-gray-600 dark:text-neutral-400">Loading workspace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-black">
        <div className="text-xl text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full h-screen bg-white dark:bg-black">
        {/* Sidebar */}
        <AppSidebar
          currentWorkspace={workspace}
          workspaces={workspaces}
          bookmarks={bookmarks}
          onAddWorkspace={handleAddWorkspace}
          onEditWorkspace={handleEditWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onSettingsWorkspace={handleSettingsWorkspace}
          onWorkspaceClick={handleWorkspaceClick}
          onBookmarkClick={handleBookmarkClick}
          onBookmarkUpdate={handleBookmarkUpdate}
          onBookmarkDelete={handleBookmarkDelete}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onCollapsedChange={setIsSidebarCollapsed}
          onRefreshWorkspaces={fetchAllWorkspaces}
        />

        {/* Main Content */}
        <div className="flex-1 relative overflow-hidden">
          {activeSection === 'workspaces' && (
            <>
              <InfiniteCanvas
                workspaceId={workspaceId}
                elements={elements}
                onElementUpdate={handleElementUpdate}
                onElementCreate={handleElementCreate}
                onElementDelete={handleElementDelete}
                canEditContent={workspace?.permissions?.canEditContent}
                isViewMode={isViewMode}
                onViewModeToggle={handleViewModeToggle}
                workspaces={workspaces}
                onElementNavigate={handleElementNavigate}
                onBookmarkCreated={handleBookmarkCreated}
              />
              <TitleNavigation
                elements={elements}
                onTitleClick={handleTitleClick}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            </>
          )}
          {activeSection === 'vip-calculator' && (
            <VIPProgressCalculator />
          )}
          {activeSection === 'hash-explorer' && (
            <HashExplorerFinder />
          )}
          {activeSection === 'quick-links' && (
            <QuickLinks />
          )}
          {activeSection === 'affiliate-bonus-finder' && (
            <AffiliateBonusFinder />
          )}
          {activeSection === 'developer-dashboard' && (
            <DeveloperDashboard />
          )}
        </div>

        {/* Workspace Switching Loader */}
        {switchingWorkspace && !loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-transparent border-t-gray-900 dark:border-t-neutral-50 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onWorkspaceCreated={handleWorkspaceCreated}
      />

      <EditWorkspaceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setWorkspaceToEdit(null);
        }}
        workspace={workspaceToEdit}
        onWorkspaceUpdated={handleWorkspaceUpdated}
      />

      <WorkspaceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setWorkspaceToManage(null);
        }}
        workspace={workspaceToManage}
        onWorkspaceUpdated={handleWorkspaceUpdated}
      />
    </>
  );
};

export default Workspace;
