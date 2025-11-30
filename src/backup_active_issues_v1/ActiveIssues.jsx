import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AppSidebar from '../components/AppSidebar';
import IssueCard from '../components/ActiveIssues/IssueCard';
import IssueModal from '../components/ActiveIssues/IssueModal';
import CreateIssueModal from '../components/ActiveIssues/CreateIssueModal';
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  Activity,
} from 'lucide-react';

const ActiveIssues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({ totalActive: 0, totalResolved: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  // Check if user can edit (admin or developer)
  const canEdit = user && (user.role === 'admin' || user.role === 'developer');

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams();
      if (showResolved) params.append('showResolved', 'true');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/issues?${params.toString()}`,
        { headers }
      );

      setIssues(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [showResolved, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/issues/stats`
      );
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Fetch workspaces for sidebar
  const fetchWorkspaces = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/workspaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces(response.data);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/bookmarks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookmarks(response.data);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
    fetchBookmarks();
    fetchStats();
  }, [fetchWorkspaces, fetchBookmarks, fetchStats]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchIssues();
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [fetchIssues]);

  // Filter issues based on search (client-side filtering for instant feedback)
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;

    const query = searchQuery.toLowerCase();
    return issues.filter(issue => {
      const titleMatch = issue.title?.toLowerCase().includes(query);
      const descMatch = issue.description?.toLowerCase().includes(query);
      const areaMatch = issue.affectedAreas?.some(area =>
        area.toLowerCase().includes(query)
      );
      const updateMatch = issue.updates?.some(update =>
        update.message?.toLowerCase().includes(query)
      );
      return titleMatch || descMatch || areaMatch || updateMatch;
    });
  }, [issues, searchQuery]);

  // Handle issue creation
  const handleCreateIssue = async (issueData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/issues`,
        issueData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIssues(prev => [response.data, ...prev]);
      setIsCreateModalOpen(false);
      fetchStats();
    } catch (err) {
      console.error('Error creating issue:', err);
      throw err;
    }
  };

  // Handle issue update
  const handleIssueUpdate = (updatedIssue) => {
    setIssues(prev => prev.map(issue =>
      issue._id === updatedIssue._id ? updatedIssue : issue
    ));
    setSelectedIssue(updatedIssue);
    fetchStats();
  };

  // Handle issue status change (for quick resolve)
  const handleStatusChange = async (issueId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/issues/${issueId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (newStatus === 'resolved' && !showResolved) {
        setIssues(prev => prev.filter(issue => issue._id !== issueId));
      } else {
        setIssues(prev => prev.map(issue =>
          issue._id === issueId ? response.data : issue
        ));
      }
      fetchStats();
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  // Sidebar handlers
  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleSectionChange = (section) => {
    if (section === 'chat') {
      navigate('/chat');
    } else if (section === 'workspaces') {
      if (workspaces.length > 0) {
        navigate(`/workspace/${workspaces[0]._id}`);
      }
    } else {
      navigate(`/${section}`);
    }
  };

  const handleBookmarkClick = (bookmark) => {
    if (bookmark.workspace?._id) {
      navigate(`/workspace/${bookmark.workspace._id}`);
    }
  };

  const handleBookmarkUpdate = async (bookmarkId, data) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/bookmarks/${bookmarkId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookmarks();
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
      fetchBookmarks();
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  };

  // Stat Card Component
  const StatCard = ({ icon: Icon, label, value, accent = 'gray' }) => {
    const accentColors = {
      red: 'text-red-600 dark:text-red-400',
      green: 'text-green-600 dark:text-green-400',
      yellow: 'text-yellow-600 dark:text-yellow-400',
      blue: 'text-blue-600 dark:text-blue-400',
      gray: 'text-gray-600 dark:text-gray-400'
    };

    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={accentColors[accent]}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  };

  // Button Component
  const Button = ({ children, variant = 'default', size = 'default', className = '', onClick, disabled }) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      default: 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200',
      secondary: 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-white border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700',
      ghost: 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      default: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <AppSidebar
        currentWorkspace={null}
        workspaces={workspaces}
        bookmarks={bookmarks}
        onAddWorkspace={() => {}}
        onEditWorkspace={() => {}}
        onDeleteWorkspace={() => {}}
        onSettingsWorkspace={() => {}}
        onWorkspaceClick={handleWorkspaceClick}
        onBookmarkClick={handleBookmarkClick}
        onBookmarkUpdate={handleBookmarkUpdate}
        onBookmarkDelete={handleBookmarkDelete}
        activeSection="workspaces"
        onSectionChange={handleSectionChange}
        onCollapsedChange={setIsSidebarCollapsed}
        onRefreshWorkspaces={fetchWorkspaces}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
          <div className="px-6 py-4">
            {/* Title Row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Active Issues</h1>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">Platform status and incident tracking</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { fetchIssues(); fetchStats(); }}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {canEdit && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Report Issue
                  </Button>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={AlertCircle}
                label="Active Issues"
                value={stats.totalActive}
                accent="red"
              />
              <StatCard
                icon={CheckCircle}
                label="Resolved"
                value={stats.totalResolved}
                accent="green"
              />
              <StatCard
                icon={Clock}
                label="This Week"
                value={issues.filter(i => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(i.createdAt) > weekAgo;
                }).length}
                accent="blue"
              />
              <StatCard
                icon={Activity}
                label="Updates Today"
                value={issues.reduce((acc, i) => {
                  const today = new Date().toDateString();
                  return acc + (i.updates?.filter(u => new Date(u.createdAt).toDateString() === today).length || 0);
                }, 0)}
                accent="yellow"
              />
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Toggle Buttons */}
              <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => setShowResolved(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    !showResolved
                      ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Active
                  {stats.totalActive > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs">
                      {stats.totalActive}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowResolved(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    showResolved
                      ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolved
                </button>
              </div>
            </div>

            {/* Search Result Count */}
            {searchQuery && (
              <div className="mt-3 text-xs text-gray-500 dark:text-neutral-400">
                Showing {filteredIssues.length} of {issues.length} issues
              </div>
            )}
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">{error}</h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Please try again</p>
              <Button variant="secondary" onClick={fetchIssues}>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Retry
              </Button>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                {searchQuery ? (
                  <Search className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                )}
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                {searchQuery ? 'No matching issues' : showResolved ? 'No resolved issues' : 'All systems operational'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
                {searchQuery ? 'Try adjusting your search' : showResolved ? 'Resolved issues will appear here' : 'No active issues at this time'}
              </p>
              {searchQuery && (
                <Button variant="secondary" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue._id}
                  issue={issue}
                  onClick={() => setSelectedIssue(issue)}
                  onStatusChange={canEdit ? handleStatusChange : null}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={handleIssueUpdate}
          canEdit={canEdit}
        />
      )}

      {/* Create Issue Modal */}
      {isCreateModalOpen && (
        <CreateIssueModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateIssue}
        />
      )}
    </div>
  );
};

export default ActiveIssues;
