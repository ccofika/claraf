import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import {
  Plus, Upload, Loader2, CheckCircle, XCircle, Clock, Trash2, Eye,
  FileText, AlertTriangle, RefreshCw, ChevronRight, MessageSquare,
  BookOpen, Flag, Settings, Brain
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import QAKnowledgeBase from './QAKnowledgeBase';
import QAFlaggedTickets from './QAFlaggedTickets';
import QAEvaluationSessions from './QAEvaluationSessions';

const API_URL = process.env.REACT_APP_API_URL;

// Submenu tabs configuration
const SUBMENU_TABS = [
  { id: 'sessions', label: 'Import Sessions', icon: Upload },
  { id: 'evaluations', label: 'AI Evaluations', icon: Brain },
  { id: 'flagged', label: 'Flagged Tickets', icon: Flag },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen }
];

const QAImportTickets = ({ agents, currentUser }) => {
  // Active submenu tab
  const [activeSubmenu, setActiveSubmenu] = useState('sessions');

  // Check if user is Knowledge Base admin (admin or qa-admin role)
  const isKnowledgeAdmin = currentUser?.role === 'admin' || currentUser?.role === 'qa-admin';

  // State
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showConversationsView, setShowConversationsView] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [scrapeProgress, setScrapeProgress] = useState({});

  // Login state
  const [loginStatus, setLoginStatus] = useState({ hasCookies: false, checking: true });
  const [loginInProgress, setLoginInProgress] = useState(false);

  // Socket ref
  const socketRef = useRef(null);

  // Auth headers
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Check login status
  const checkLoginStatus = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/scrape/login/status`,
        getAuthHeaders()
      );
      setLoginStatus({ ...response.data, checking: false });
    } catch (error) {
      console.error('Error checking login status:', error);
      setLoginStatus({ hasCookies: false, checking: false });
    }
  }, []);

  // Open login browser
  const handleOpenLogin = async () => {
    try {
      setLoginInProgress(true);
      await axios.post(
        `${API_URL}/api/qa/scrape/login`,
        {},
        getAuthHeaders()
      );
      toast.info('Browser opened! Log into Intercom, then click "Save Login"');
    } catch (error) {
      console.error('Error opening login browser:', error);
      toast.error(error.response?.data?.message || 'Failed to open login browser');
      setLoginInProgress(false);
    }
  };

  // Save login cookies
  const handleSaveLogin = async () => {
    try {
      await axios.post(
        `${API_URL}/api/qa/scrape/login/save`,
        {},
        getAuthHeaders()
      );
      toast.success('Login saved successfully!');
      setLoginInProgress(false);
      checkLoginStatus();
    } catch (error) {
      console.error('Error saving login:', error);
      toast.error(error.response?.data?.message || 'Failed to save login');
    }
  };

  // Cancel login
  const handleCancelLogin = async () => {
    try {
      await axios.post(
        `${API_URL}/api/qa/scrape/login/cancel`,
        {},
        getAuthHeaders()
      );
      setLoginInProgress(false);
    } catch (error) {
      console.error('Error cancelling login:', error);
    }
  };

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/scrape/sessions`,
        getAuthHeaders()
      );
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load scrape sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSessions();
    checkLoginStatus();
  }, [fetchSessions, checkLoginStatus]);

  // Socket.io for real-time progress
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected for scrape progress');
      socketRef.current.emit('authenticate', { token });
    });

    // Listen for progress updates
    sessions.forEach(session => {
      if (session.status === 'running') {
        socketRef.current.on(`scrape-progress:${session._id}`, (data) => {
          setScrapeProgress(prev => ({
            ...prev,
            [session._id]: data
          }));

          // Update session status if completed/failed
          if (data.status === 'completed' || data.status === 'failed') {
            fetchSessions();
          }
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessions, fetchSessions]);

  // Fetch conversations for a session
  const fetchConversations = async (sessionId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/scrape/sessions/${sessionId}/conversations`,
        getAuthHeaders()
      );
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  // Fetch single conversation
  const fetchConversation = async (conversationId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/scrape/conversations/${conversationId}`,
        getAuthHeaders()
      );
      setSelectedConversation(response.data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session and all its conversations?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/qa/scrape/sessions/${sessionId}`,
        getAuthHeaders()
      );
      toast.success('Session deleted');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error.response?.data?.message || 'Failed to delete session');
    }
  };

  // Cancel session
  const handleCancelSession = async (sessionId) => {
    try {
      await axios.post(
        `${API_URL}/api/qa/scrape/sessions/${sessionId}/cancel`,
        {},
        getAuthHeaders()
      );
      toast.success('Session cancelled');
      fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  };

  // View session conversations
  const handleViewSession = (session) => {
    setSelectedSession(session);
    setShowConversationsView(true);
    fetchConversations(session._id);
  };

  // Status badge component
  const StatusBadge = ({ status, progress }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400', icon: Clock, label: 'Pending' },
      running: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400', icon: Loader2, label: 'Running' },
      completed: { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400', icon: CheckCircle, label: 'Completed' },
      failed: { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400', icon: XCircle, label: 'Failed' },
      cancelled: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400', icon: XCircle, label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
        {config.label}
        {status === 'running' && progress && (
          <span className="ml-1">({progress}%)</span>
        )}
      </span>
    );
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render submenu navigation
  const renderSubmenu = () => (
    <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg w-fit">
      {SUBMENU_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSubmenu === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveSubmenu(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${isActive
                ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // Render based on active submenu
  if (activeSubmenu === 'knowledge') {
    return (
      <div className="space-y-4">
        {renderSubmenu()}
        <QAKnowledgeBase isAdmin={isKnowledgeAdmin} />
      </div>
    );
  }

  if (activeSubmenu === 'evaluations') {
    return (
      <div className="space-y-4">
        {renderSubmenu()}
        <QAEvaluationSessions sessions={sessions} />
      </div>
    );
  }

  if (activeSubmenu === 'flagged') {
    return (
      <div className="space-y-4">
        {renderSubmenu()}
        <QAFlaggedTickets sessions={sessions} />
      </div>
    );
  }

  // Empty state for sessions
  if (!loading && sessions.length === 0) {
    return (
      <div className="space-y-4">
        {renderSubmenu()}
        <div className="space-y-6">
        {/* Login Status Card - also show in empty state */}
        {!loginStatus.checking && !loginStatus.hasCookies && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Intercom Login Required
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You need to log into Intercom before scraping can work. Click the button to open a browser window for login.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {loginInProgress ? (
                    <>
                      <button
                        onClick={handleSaveLogin}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Save Login
                      </button>
                      <button
                        onClick={handleCancelLogin}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">
                        Log in to Intercom in the browser window, then click Save Login
                      </span>
                    </>
                  ) : (
                    <button
                      onClick={handleOpenLogin}
                      className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Open Intercom Login
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Success Badge */}
        {!loginStatus.checking && loginStatus.hasCookies && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            Intercom login saved
          </div>
        )}

        {/* Empty state content */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Import Sessions
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6 text-center max-w-md">
            Import tickets from Intercom by uploading a CSV report. The system will automatically scrape conversations and extract images.
          </p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Import Session
          </button>
        </div>

        {/* Create Dialog */}
        <CreateSessionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          agents={agents}
          onSuccess={() => {
            setShowCreateDialog(false);
            fetchSessions();
          }}
        />
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {renderSubmenu()}
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Conversations view
  if (showConversationsView && selectedSession) {
    return (
      <div className="space-y-4">
        {renderSubmenu()}
        <ConversationsView
          session={selectedSession}
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={(conv) => {
            fetchConversation(conv._id);
          }}
          onBack={() => {
            setShowConversationsView(false);
            setSelectedSession(null);
            setConversations([]);
            setSelectedConversation(null);
          }}
        />
      </div>
    );
  }

  // Sessions list
  return (
    <div className="space-y-4">
      {renderSubmenu()}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import Sessions</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSessions}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>

      {/* Login Status Card */}
      {!loginStatus.checking && !loginStatus.hasCookies && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Intercom Login Required
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You need to log into Intercom before scraping can work. Click the button to open a browser window for login.
              </p>
              <div className="mt-3 flex items-center gap-2">
                {loginInProgress ? (
                  <>
                    <button
                      onClick={handleSaveLogin}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save Login
                    </button>
                    <button
                      onClick={handleCancelLogin}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      Log in to Intercom in the browser window, then click Save Login
                    </span>
                  </>
                ) : (
                  <button
                    onClick={handleOpenLogin}
                    className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Open Intercom Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Success Badge */}
      {!loginStatus.checking && loginStatus.hasCookies && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          Intercom login saved
        </div>
      )}

      {/* Sessions list */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {sessions.map((session) => {
            const progress = scrapeProgress[session._id];

            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {session.agent?.name || 'Unknown Agent'}
                        </span>
                        <StatusBadge
                          status={session.status}
                          progress={progress?.progress || session.progress}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-neutral-400">
                        <span>{session.totalConversations} conversations</span>
                        <span className="text-gray-300 dark:text-neutral-600">|</span>
                        <span>{formatDate(session.createdAt)}</span>
                        {session.csvFileName && (
                          <>
                            <span className="text-gray-300 dark:text-neutral-600">|</span>
                            <span className="truncate max-w-[200px]">{session.csvFileName}</span>
                          </>
                        )}
                      </div>
                      {/* Progress bar for running sessions */}
                      {session.status === 'running' && (
                        <div className="mt-2 w-64">
                          <div className="h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${progress?.progress || session.progress || 0}%` }}
                            />
                          </div>
                          {progress && (
                            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                              Scraping: {progress.current}/{progress.total}
                            </p>
                          )}
                        </div>
                      )}
                      {/* Error message */}
                      {session.status === 'failed' && session.errorMessage && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {session.errorMessage}
                        </p>
                      )}
                      {/* Stats for completed */}
                      {session.status === 'completed' && (
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-neutral-400 mt-1">
                          <span className="text-green-600 dark:text-green-400">
                            {session.scrapedCount} scraped
                          </span>
                          {session.failedCount > 0 && (
                            <span className="text-red-500">
                              {session.failedCount} failed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {session.status === 'running' && (
                      <button
                        onClick={() => handleCancelSession(session._id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    {session.status === 'completed' && (
                      <button
                        onClick={() => handleViewSession(session)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="View Conversations"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {session.status !== 'running' && (
                      <button
                        onClick={() => handleDeleteSession(session._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleViewSession(session)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Create Dialog */}
      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        agents={agents}
        onSuccess={() => {
          setShowCreateDialog(false);
          fetchSessions();
        }}
      />
    </div>
  );
};

// Create Session Dialog Component
const CreateSessionDialog = ({ open, onOpenChange, agents, onSuccess }) => {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setParsing(true);

    try {
      const text = await file.text();
      setCsvContent(text);

      // Parse preview
      const response = await axios.post(
        `${API_URL}/api/qa/scrape/parse-csv`,
        { csvContent: text },
        getAuthHeaders()
      );

      setPreview(response.data);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV file');
      setCsvFile(null);
      setCsvContent('');
    } finally {
      setParsing(false);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedAgent || !csvContent) {
      toast.error('Please select an agent and upload a CSV file');
      return;
    }

    setLoading(true);

    try {
      // Create session
      const createResponse = await axios.post(
        `${API_URL}/api/qa/scrape/sessions`,
        {
          agentId: selectedAgent,
          csvContent: csvContent,
          csvFileName: csvFile?.name || 'upload.csv'
        },
        getAuthHeaders()
      );

      const { session, conversationIds } = createResponse.data;

      // Start scraping
      await axios.post(
        `${API_URL}/api/qa/scrape/sessions/${session._id}/start`,
        { conversationIds },
        getAuthHeaders()
      );

      toast.success(`Started scraping ${conversationIds.length} conversations`);
      onSuccess();

      // Reset form
      setSelectedAgent('');
      setCsvFile(null);
      setCsvContent('');
      setPreview(null);

    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedAgent('');
      setCsvFile(null);
      setCsvContent('');
      setPreview(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-neutral-900 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            New Import Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agent Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5 block">
              Agent <span className="text-red-500">*</span>
            </Label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select agent...</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name} {agent.team ? `(${agent.team})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              Only agents assigned to you are shown
            </p>
          </div>

          {/* File Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5 block">
              CSV Report File <span className="text-red-500">*</span>
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${csvFile
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {parsing ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Parsing CSV...</span>
                </div>
              ) : csvFile ? (
                <div className="space-y-1">
                  <FileText className="w-8 h-8 mx-auto text-green-500" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {csvFile.name}
                  </p>
                  {preview && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {preview.count} conversation IDs found
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    Drop CSV file here or click to browse
                  </p>
                  <p className="text-xs text-gray-400 dark:text-neutral-500">
                    Intercom CSV export with Conversation IDs
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && preview.count > 0 && (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Preview ({preview.count} total)
              </p>
              <div className="flex flex-wrap gap-1">
                {preview.preview.slice(0, 5).map((id, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {id}
                  </Badge>
                ))}
                {preview.count > 5 && (
                  <Badge variant="outline" className="text-xs text-gray-400">
                    +{preview.count - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedAgent || !csvContent}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Start Scraping
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Conversations View Component
const ConversationsView = ({ session, conversations, selectedConversation, onSelectConversation, onBack }) => {
  return (
    <div className="h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Sessions
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {session.agent?.name} - {conversations.length} Conversations
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {session.csvFileName} | {new Date(session.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Split View */}
      <div className="flex gap-4 h-full">
        {/* Conversations List */}
        <div className="w-80 flex-shrink-0 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Conversations</h3>
          </div>
          <div className="overflow-y-auto h-[calc(100%-48px)]">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-neutral-400">
                No conversations found
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => onSelectConversation(conv)}
                  className={`
                    w-full p-3 text-left border-b border-gray-100 dark:border-neutral-800 transition-colors
                    ${selectedConversation?._id === conv._id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-neutral-800'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      #{conv.conversationId}
                    </span>
                    {conv.status === 'failed' && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-neutral-400">
                    <MessageSquare className="w-3 h-3" />
                    {conv.messageCount || 0} messages
                    {conv.images?.length > 0 && (
                      <span className="text-blue-500">
                        | {conv.images.length} images
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation Detail / Chat View */}
        <div className="flex-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          {selectedConversation ? (
            <ConversationChatView conversation={selectedConversation} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-neutral-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Conversation Chat View Component
const ConversationChatView = ({ conversation }) => {
  // Parse messages from exportedText if messages array is empty
  const messages = conversation.messages?.length > 0
    ? conversation.messages
    : parseMessagesFromText(conversation.exportedText, conversation.images);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Conversation #{conversation.conversationId}
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              {messages.length} messages | Scraped {new Date(conversation.scrapedAt).toLocaleString()}
            </p>
          </div>
          {conversation.images?.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {conversation.images.length} images
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-neutral-400 py-8">
            <p>No messages parsed from this conversation.</p>
            {conversation.exportedText && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg text-left">
                <p className="text-xs font-medium mb-2">Raw exported text:</p>
                <pre className="text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {conversation.exportedText}
                </pre>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[70%] rounded-lg p-3
                  ${msg.role === 'agent'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white'
                  }
                `}
              >
                <div className="text-xs opacity-75 mb-1">
                  {msg.sender || (msg.role === 'agent' ? 'Agent' : 'Customer')}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.imageUrls?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.imageUrls.map((url, j) => (
                      <a
                        key={j}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={url}
                          alt="Attached image"
                          className="max-w-full rounded-lg border border-white/20"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper function to parse messages from text
function parseMessagesFromText(text, images = []) {
  if (!text) return [];

  const messages = [];
  const lines = text.split('\n');
  let currentMessage = null;

  for (const line of lines) {
    // Try to match message header pattern: "Name (timestamp)" or similar
    const headerMatch = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/);

    if (headerMatch) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }

      const sender = headerMatch[1].trim();
      const isAgent = !sender.toLowerCase().includes('customer') &&
                      !sender.toLowerCase().includes('user') &&
                      !sender.toLowerCase().includes('visitor');

      currentMessage = {
        role: isAgent ? 'agent' : 'customer',
        sender: sender,
        content: '',
        imageUrls: []
      };
    } else if (currentMessage) {
      // Check for image references
      const imageMatch = line.match(/\[Image[:\s]+"?([^"\]]+)"?\]/i);
      if (imageMatch) {
        const matchingImage = images.find(img =>
          img.url.includes(imageMatch[1].split('?')[0])
        );
        if (matchingImage) {
          currentMessage.imageUrls.push(matchingImage.url);
        }
      }
      currentMessage.content += line + '\n';
    }
  }

  if (currentMessage && currentMessage.content.trim()) {
    messages.push(currentMessage);
  }

  return messages;
}

export default QAImportTickets;
