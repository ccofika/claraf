import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Trash2, CheckCircle, Clock, AlertTriangle, XCircle, RefreshCw, ChevronDown, User, Calendar, Globe, Monitor } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BugReportsAdmin = ({ getAuthHeaders, userEmail, userRole }) => {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;
  // Admin access based on role (admin or qa-admin)
  const isAdmin = userRole === 'admin' || userRole === 'qa-admin';

  const fetchBugReports = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/qa/bug-reports`, getAuthHeaders());
      setBugReports(response.data);
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      toast.error('Failed to fetch bug reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugReports();
  }, [isAdmin]);

  // Only show for admin
  if (!isAdmin) {
    return null;
  }

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/api/qa/bug-reports/${id}`, { status }, getAuthHeaders());
      setBugReports(prev => prev.map(bug =>
        bug._id === id ? { ...bug, status } : bug
      ));
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Error updating bug report:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteBugReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bug report?')) return;

    try {
      await axios.delete(`${API_URL}/api/qa/bug-reports/${id}`, getAuthHeaders());
      setBugReports(prev => prev.filter(bug => bug._id !== id));
      toast.success('Bug report deleted');
    } catch (error) {
      console.error('Error deleting bug report:', error);
      toast.error('Failed to delete bug report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'in_progress': return <Clock className="w-3.5 h-3.5" />;
      case 'resolved': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'closed': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
            <Bug className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Bug Reports</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
              {bugReports.length} report{bugReports.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchBugReports}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
        </motion.button>
      </div>

      {/* Bug Reports List */}
      {bugReports.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
          <Bug className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No bug reports yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bugReports.map((bug) => (
            <motion.div
              key={bug._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
            >
              {/* Main row */}
              <div
                className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                onClick={() => setExpandedId(expandedId === bug._id ? null : bug._id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                        {bug.title}
                      </h3>
                      <motion.div
                        animate={{ rotate: expandedId === bug._id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </motion.div>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="truncate">{bug.reporterEmail}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        {formatDate(bug.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 self-start">
                    <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium ${getStatusColor(bug.status)}`}>
                      {getStatusIcon(bug.status)}
                      <span className="hidden xs:inline">{bug.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium ${getPriorityColor(bug.priority)}`}>
                      {bug.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {expandedId === bug._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-gray-100 dark:border-neutral-800">
                      {/* Description */}
                      {bug.description && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 dark:text-neutral-300 whitespace-pre-wrap">
                            {bug.description}
                          </p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-neutral-400">
                        {bug.currentPage && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {bug.currentPage}
                          </span>
                        )}
                        {bug.userAgent && (
                          <span className="flex items-center gap-1 truncate max-w-xs" title={bug.userAgent}>
                            <Monitor className="w-3.5 h-3.5" />
                            {bug.userAgent.split(' ').slice(0, 3).join(' ')}...
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <select
                            value={bug.status}
                            onChange={(e) => updateStatus(bug._id, e.target.value)}
                            className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBugReport(bug._id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BugReportsAdmin;
