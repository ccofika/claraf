import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InfiniteCanvas from '../components/InfiniteCanvas';
import AppSidebar from '../components/AppSidebar';
import HashExplorerFinder from './HashExplorerFinder';
import VIPProgressCalculator from './VIPProgressCalculator';
import QuickLinks from './QuickLinks';
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';
import EditWorkspaceModal from '../components/modals/EditWorkspaceModal';

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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState(null);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        setSwitchingWorkspace(true);
        const token = localStorage.getItem('token');

        // Fetch all workspaces
        const workspacesRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workspaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWorkspaces(workspacesRes.data);

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
  }, [workspaceId]);

  const handleElementUpdate = async (updatedElement) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/canvas/elements/${updatedElement._id}`,
        updatedElement,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error updating element:', err);
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
      setElements([...elements, response.data]);
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
      setElements(elements.filter(el => el._id !== elementId));
    } catch (err) {
      console.error('Error deleting element:', err);
    }
  };

  const handleAddWorkspace = () => {
    setIsCreateModalOpen(true);
  };

  const handleWorkspaceCreated = (newWorkspace) => {
    setWorkspaces([...workspaces, newWorkspace]);
    navigate(`/workspace/${newWorkspace._id}`);
  };

  const handleEditWorkspace = (workspaceId) => {
    const ws = workspaces.find(w => w._id === workspaceId);
    if (ws) {
      setWorkspaceToEdit(ws);
      setIsEditModalOpen(true);
    }
  };

  const handleWorkspaceUpdated = (updatedWorkspace) => {
    setWorkspaces(workspaces.map(w =>
      w._id === updatedWorkspace._id ? updatedWorkspace : w
    ));
    if (workspace?._id === updatedWorkspace._id) {
      setWorkspace(updatedWorkspace);
    }
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

      setWorkspaces(workspaces.filter(w => w._id !== workspaceId));

      // If deleting current workspace, navigate to another one
      if (workspace?._id === workspaceId) {
        const remainingWorkspaces = workspaces.filter(w => w._id !== workspaceId);
        if (remainingWorkspaces.length > 0) {
          navigate(`/workspace/${remainingWorkspaces[0]._id}`);
        } else {
          navigate('/');
        }
      }
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
          onAddWorkspace={handleAddWorkspace}
          onEditWorkspace={handleEditWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onWorkspaceClick={handleWorkspaceClick}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <div className="flex-1 relative overflow-hidden">
          {activeSection === 'workspaces' && (
            <InfiniteCanvas
              workspaceId={workspaceId}
              elements={elements}
              onElementUpdate={handleElementUpdate}
              onElementCreate={handleElementCreate}
              onElementDelete={handleElementDelete}
              canEditContent={workspace?.permissions?.canEditContent}
              workspaces={workspaces}
              onElementNavigate={handleElementNavigate}
            />
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
    </>
  );
};

export default Workspace;
