import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Database, Users, FolderOpen, FileText, Server, Clock, HardDrive, AlertCircle } from 'lucide-react';
import ActivityLogsSection from '../components/ActivityLogsSection';
import SecurityDashboard from '../components/SecurityDashboard';
import UserManagement from '../components/UserManagement';
import { useAuth } from '../context/AuthContext';

const DeveloperDashboard = () => {
  const { user: currentUser } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState({ total: 0, errors: 0, warnings: 0, info: 0 });
  const [logPagination, setLogPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [logFilters, setLogFilters] = useState({ availableModules: [] });
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Filter states
  const [levelFilter, setLevelFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [metricsRes, healthRes, dbStatsRes, usersRes, workspacesRes] = await Promise.all([
        axios.get(`${API_URL}/api/developer/metrics`, { headers }),
        axios.get(`${API_URL}/api/developer/health`, { headers }),
        axios.get(`${API_URL}/api/developer/database-stats`, { headers }),
        axios.get(`${API_URL}/api/developer/users`, { headers }),
        axios.get(`${API_URL}/api/developer/workspaces`, { headers }),
      ]);

      setMetrics(metricsRes.data);
      setHealth(healthRes.data);
      setDbStats(dbStatsRes.data);
      setUsers(usersRes.data.users);
      setWorkspaces(workspacesRes.data.workspaces);
      setLastRefresh(new Date());

      // Fetch logs separately to avoid blocking main data
      fetchLogs();
    } catch (err) {
      console.error('Error fetching developer data:', err);
      setError(err.response?.data?.message || 'Failed to fetch developer data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = currentPage) => {
    setLogsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 50);
      if (levelFilter) params.append('level', levelFilter);
      if (moduleFilter) params.append('module', moduleFilter);
      if (searchFilter) params.append('search', searchFilter);

      const response = await axios.get(`${API_URL}/api/developer/logs?${params}`, { headers });

      setLogs(response.data.logs);
      setLogStats(response.data.stats);
      setLogPagination(response.data.pagination);
      setLogFilters(response.data.filters);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds (except logs which update on filter change)
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch logs when filters change
  useEffect(() => {
    if (!loading) {
      fetchLogs(1); // Reset to page 1 when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, moduleFilter, searchFilter, loading]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-black">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-neutral-400">Loading developer dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-black">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">Developer Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Health Status */}
        {health && (
          <div className={`rounded-lg p-6 border-2 ${
            health.status === 'healthy'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <Activity className={`w-6 h-6 ${
                health.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`} />
              <div>
                <h2 className={`text-xl font-semibold ${
                  health.status === 'healthy' ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                }`}>
                  System Status: {health.status.toUpperCase()}
                </h2>
                <p className={`text-sm ${
                  health.status === 'healthy' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  Database: {health.database.status} | Response Time: {health.database.responseTime}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* System Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Users</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-50">
                {metrics.database.users.total}
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400 space-y-1">
                <div>Admins: {metrics.database.users.admins}</div>
                <div>Developers: {metrics.database.users.developers}</div>
                <div>Regular: {metrics.database.users.regularUsers}</div>
              </div>
            </div>

            {/* Total Workspaces */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <FolderOpen className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Workspaces</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-50">
                {metrics.database.workspaces.total}
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400 space-y-1">
                <div>Personal: {metrics.database.workspaces.personal}</div>
                <div>Announcements: {metrics.database.workspaces.announcements}</div>
              </div>
            </div>

            {/* Canvas Elements */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Canvas</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-50">
                {metrics.database.canvas.total}
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400">
                Elements: {metrics.database.canvas.elements}
              </div>
            </div>

            {/* System Uptime */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Uptime</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-neutral-50">
                {metrics.system.uptime}
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400">
                Node {metrics.system.nodeVersion}
              </div>
            </div>
          </div>
        )}

        {/* System Information */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Server Info */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">Server Information</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Hostname:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.system.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Platform:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.system.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Architecture:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.system.arch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Process ID:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.process.pid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Total Memory:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.system.totalMemory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Free Memory:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.system.freeMemory}</span>
                </div>
              </div>
            </div>

            {/* Process Memory */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">Process Memory</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">RSS:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.process.memoryUsageMB.rss} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Heap Total:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.process.memoryUsageMB.heapTotal} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Heap Used:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.process.memoryUsageMB.heapUsed} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">External:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.process.memoryUsageMB.external} MB</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-neutral-800">
                  <span className="text-gray-600 dark:text-neutral-400">CPU User:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.process.cpuUsage.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">CPU System:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{metrics.process.cpuUsage.system}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Statistics */}
        {dbStats && (
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">Database Statistics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Database Name:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{dbStats.database.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Collections:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{dbStats.database.collections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Data Size:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{dbStats.database.dataSize}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Storage Size:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{dbStats.database.storageSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Index Size:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{dbStats.database.indexSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-neutral-400">Total Size:</span>
                  <span className="text-gray-900 dark:text-neutral-50 font-mono">{dbStats.database.totalSize}</span>
                </div>
              </div>
            </div>

            {/* Collections Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Collection</th>
                    <th className="text-right py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Documents</th>
                    <th className="text-right py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Size</th>
                    <th className="text-right py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Avg Size</th>
                    <th className="text-right py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Indexes</th>
                  </tr>
                </thead>
                <tbody>
                  {dbStats.collections.map((col, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-neutral-800/50">
                      <td className="py-2 px-4 text-gray-900 dark:text-neutral-50 font-mono">{col.name}</td>
                      <td className="py-2 px-4 text-right text-gray-900 dark:text-neutral-50 font-mono">{col.count}</td>
                      <td className="py-2 px-4 text-right text-gray-900 dark:text-neutral-50 font-mono">{col.size}</td>
                      <td className="py-2 px-4 text-right text-gray-900 dark:text-neutral-50 font-mono">{col.avgObjSize}</td>
                      <td className="py-2 px-4 text-right text-gray-900 dark:text-neutral-50 font-mono">{col.indexes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">All Users ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Name</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Email</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Role</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">First Login</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 dark:border-neutral-800/50">
                    <td className="py-2 px-4 text-gray-900 dark:text-neutral-50">{user.name}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-neutral-50 font-mono text-xs">{user.email}</td>
                    <td className="py-2 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                        user.role === 'developer' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400' :
                        'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-600 dark:text-neutral-400">
                      {user.isFirstLogin ? 'Yes' : 'No'}
                    </td>
                    <td className="py-2 px-4 text-gray-600 dark:text-neutral-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workspaces Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <FolderOpen className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">All Workspaces ({workspaces.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Name</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Type</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Owner</th>
                  <th className="text-right py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Members</th>
                  <th className="text-right py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Elements</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-neutral-400 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((workspace) => (
                  <tr key={workspace._id} className="border-b border-gray-100 dark:border-neutral-800/50">
                    <td className="py-2 px-4 text-gray-900 dark:text-neutral-50">{workspace.name}</td>
                    <td className="py-2 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        workspace.type === 'announcements'
                          ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-400'
                      }`}>
                        {workspace.type}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-600 dark:text-neutral-400 text-xs">
                      {workspace.owner?.email || 'N/A'}
                    </td>
                    <td className="py-2 px-4 text-right text-gray-900 dark:text-neutral-50">
                      {workspace.stats.memberCount}
                    </td>
                    <td className="py-2 px-4 text-right text-gray-900 dark:text-neutral-50">
                      {workspace.stats.elementCount}
                    </td>
                    <td className="py-2 px-4 text-gray-600 dark:text-neutral-400 text-xs">
                      {new Date(workspace.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Management Section - Admin or Super Admin (filipkozomara@mebit.io) */}
        {(currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'filipkozomara@mebit.io') && (
          <UserManagement />
        )}

        {/* Security Dashboard Section */}
        <SecurityDashboard />


        {/* Activity Logs Section with Filters and Pagination */}
        <ActivityLogsSection
          logs={logs}
          logStats={logStats}
          logPagination={logPagination}
          logFilters={logFilters}
          logsLoading={logsLoading}
          levelFilter={levelFilter}
          moduleFilter={moduleFilter}
          searchFilter={searchFilter}
          onLevelFilterChange={setLevelFilter}
          onModuleFilterChange={setModuleFilter}
          onSearchFilterChange={setSearchFilter}
          onPageChange={fetchLogs}
          onRefreshLogs={() => fetchLogs(currentPage)}
        />
      </div>
    </div>
  );
};

export default DeveloperDashboard;
