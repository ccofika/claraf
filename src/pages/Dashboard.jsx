import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Megaphone, Plus, FolderOpen } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [announcementsWorkspace, setAnnouncementsWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workspaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const announcements = response.data.find(ws => ws.type === 'announcements');
        const personal = response.data.filter(ws => ws.type === 'personal');

        setAnnouncementsWorkspace(announcements);
        setWorkspaces(personal);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching workspaces:', err);
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateWorkspace = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/workspaces`,
        {
          name: `My Workspace ${workspaces.length + 1}`,
          type: 'personal'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces([...workspaces, response.data]);
      navigate(`/workspace/${response.data._id}`);
    } catch (err) {
      console.error('Error creating workspace:', err);
    }
  };

  // Check if user has access to QA Manager
  const hasQAAccess = () => {
    const allowedEmails = [
      'filipkozomara@mebit.io',
      'vasilijevitorovic@mebit.io',
      'nevena@mebit.io',
      'mladenjorganovic@mebit.io'
    ];
    return user?.email && allowedEmails.includes(user.email);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              {hasQAAccess() && (
                <button
                  onClick={() => navigate('/qa-manager')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  QA Manager
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Announcements Workspace */}
          {announcementsWorkspace && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Public Workspace</h2>
              <button
                onClick={() => navigate(`/workspace/${announcementsWorkspace._id}`)}
                className="w-full bg-blue-50 border-2 border-blue-200 rounded-lg p-6 hover:bg-blue-100 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <Megaphone className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {announcementsWorkspace.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Company-wide announcements and updates
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Personal Workspaces */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">My Workspaces</h2>
            <button
              onClick={handleCreateWorkspace}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create Workspace
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading workspaces...</p>
            </div>
          ) : workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((workspace) => (
                <button
                  key={workspace._id}
                  onClick={() => navigate(`/workspace/${workspace._id}`)}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      <FolderOpen className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{workspace.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {workspace.metadata?.elementCount || 0} elements
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No workspaces yet</p>
              <button
                onClick={handleCreateWorkspace}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create your first workspace
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
