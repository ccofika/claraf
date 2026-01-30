import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, History, Shield, Clock, User,
  Trash2, Plus, Search, ChevronRight, ExternalLink,
  BarChart3, Layout, MessageCircle, Eye, TrendingUp, Download, Star,
  FileText, Type, Hash, Pencil
} from 'lucide-react';
import { useKnowledgeBase } from '../../context/KnowledgeBaseContext';
import { toast } from 'sonner';
import PageEditor from '../../components/KnowledgeBase/editor/PageEditor';
import TemplateGallery from '../../components/KnowledgeBase/templates/TemplateGallery';
import SettingsPanel from '../../components/KnowledgeBase/admin/SettingsPanel';
import axios from 'axios';

// Lazy Template Gallery wrapper that fetches templates
const TemplateGalleryLazy = ({ onClose }) => {
  const { templates, fetchTemplates, useTemplate, createTemplate, deleteTemplate, isAdmin } = useKnowledgeBase();

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <TemplateGallery
      templates={templates}
      onUseTemplate={useTemplate}
      onCreateTemplate={createTemplate}
      onDeleteTemplate={deleteTemplate}
      isAdmin={isAdmin}
      onClose={onClose}
    />
  );
};

// Stats Card Component
const StatCard = ({ label, value, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-[28px] font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

// Admin User Management Section
const AdminSection = () => {
  const { getAdmins, addAdmin, removeAdmin, isSuperAdmin } = useKnowledgeBase();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await getAdmins();
      setAdmins(data);
    } catch (error) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    try {
      setAdding(true);
      await addAdmin(newAdminEmail.trim());
      toast.success('Admin added successfully');
      setNewAdminEmail('');
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (adminId, adminEmail) => {
    if (!window.confirm(`Remove ${adminEmail} as admin?`)) return;

    try {
      await removeAdmin(adminId);
      toast.success('Admin removed');
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove admin');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-8">
        <div className="flex items-center gap-3 text-gray-500 dark:text-neutral-400">
          <Shield size={24} />
          <span className="text-[15px]">Only superadmin can manage admins.</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-gray-400" />
            <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
              Admin Management
            </h2>
          </div>
          <span className="text-[13px] text-gray-500 dark:text-neutral-400">
            {admins.length} admin{admins.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Add Admin Form */}
      <form onSubmit={handleAddAdmin} className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800/50 bg-gray-50 dark:bg-neutral-900/50">
        <div className="flex gap-3">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Enter email to add as admin..."
            className="flex-1 px-4 py-2.5 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={adding || !newAdminEmail.trim()}
            className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium
              bg-blue-600 hover:bg-blue-700 text-white rounded-lg
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Admin List */}
      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {admins.map(admin => (
          <div key={admin._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800
                flex items-center justify-center text-[14px] font-semibold text-gray-600 dark:text-neutral-300">
                {admin.user?.name?.[0]?.toUpperCase() || admin.user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                    {admin.user?.name || admin.user?.email}
                  </span>
                  {admin.role === 'superadmin' && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide
                      bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-full">
                      Superadmin
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-gray-500 dark:text-neutral-400">
                  {admin.user?.email}
                </span>
              </div>
            </div>
            {!admin.isHardcoded && (
              <button
                onClick={() => handleRemoveAdmin(admin._id, admin.user?.email)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Recent Activity Section
const RecentActivity = () => {
  const { getEditLogs } = useKnowledgeBase();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getEditLogs(null, 10);
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const getActionStyles = (action) => {
    switch (action) {
      case 'create':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'update':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 'delete':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <History size={20} className="text-gray-400" />
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
      </div>

      {/* Activity List */}
      {logs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Clock size={40} className="mx-auto text-gray-300 dark:text-neutral-600 mb-3" />
          <p className="text-[14px] text-gray-500 dark:text-neutral-400">
            No activity yet
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {logs.map(log => (
            <div
              key={log._id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
              onClick={() => log.page?.slug && navigate(`/knowledge-base/${log.page.slug}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-full ${getActionStyles(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-[14px] font-medium text-gray-900 dark:text-white truncate">
                      {log.page?.title || 'Unknown page'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-neutral-400">
                    <User size={14} />
                    <span>{log.user?.name || log.user?.email}</span>
                    {log.changes?.summary && (
                      <>
                        <span>•</span>
                        <span className="truncate">{log.changes.summary}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-[12px] text-gray-400 dark:text-neutral-500 whitespace-nowrap">
                  {formatTime(log.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Content Overview Section
const ContentOverview = () => {
  const { fetchContentStats } = useKnowledgeBase();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchContentStats();
        setStats(data);
      } catch (error) {
        // Content stats are optional
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-gray-400" />
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
            Content Overview
          </h2>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-neutral-800">
        <div className="bg-white dark:bg-neutral-900 p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Published</p>
          <p className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400">{stats.publishedPages || 0}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Drafts</p>
          <p className="text-[22px] font-bold text-amber-600 dark:text-amber-400">{stats.draftPages || 0}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Total Blocks</p>
          <p className="text-[22px] font-bold text-blue-600 dark:text-blue-400">{stats.totalBlocks || 0}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Total Words</p>
          <p className="text-[22px] font-bold text-purple-600 dark:text-purple-400">{(stats.totalWords || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Block Type Distribution */}
      {stats.blockTypeDistribution && stats.blockTypeDistribution.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-800">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">Block Types</p>
          <div className="space-y-2">
            {stats.blockTypeDistribution.slice(0, 6).map(item => {
              const maxCount = stats.blockTypeDistribution[0]?.count || 1;
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="text-[12px] text-gray-500 dark:text-neutral-400 w-24 truncate capitalize">
                    {(item.type || 'unknown').replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 dark:bg-blue-400 rounded-full h-2 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-gray-400 w-8 text-right">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deleted pages */}
      {stats.deletedPages > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-[13px] text-gray-400">
            <Trash2 size={14} />
            <span>{stats.deletedPages} page{stats.deletedPages !== 1 ? 's' : ''} in trash</span>
          </div>
        </div>
      )}
    </div>
  );
};

// User Activity Section
const UserActivity = () => {
  const { fetchActiveEditors } = useKnowledgeBase();
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActiveEditors(30);
        setEditors(data || []);
      } catch (error) {
        // User activity is optional
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Pencil size={20} className="text-gray-400" />
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
            Most Active Editors
          </h2>
          <span className="text-[12px] text-gray-400 ml-auto">Last 30 days</span>
        </div>
      </div>

      {editors.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Users size={40} className="mx-auto text-gray-300 dark:text-neutral-600 mb-3" />
          <p className="text-[14px] text-gray-500 dark:text-neutral-400">No editor activity</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {editors.map((editor, idx) => (
            <div key={editor._id || idx} className="flex items-center gap-4 px-6 py-3.5">
              {/* Rank */}
              <span className={`text-[14px] font-bold w-5 text-center ${
                idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'
              }`}>
                {idx + 1}
              </span>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800
                flex items-center justify-center text-[13px] font-semibold text-gray-600 dark:text-neutral-300 flex-shrink-0">
                {(editor.name || editor.email || '?')[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-gray-900 dark:text-white truncate">
                  {editor.name || editor.email || 'Unknown'}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="text-emerald-500">{editor.creates || 0} created</span>
                  <span className="text-blue-500">{editor.updates || 0} edited</span>
                  {(editor.deletes || 0) > 0 && (
                    <span className="text-red-400">{editor.deletes} deleted</span>
                  )}
                </div>
              </div>

              {/* Total & Last Edit */}
              <div className="text-right flex-shrink-0">
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">{editor.editCount}</p>
                <p className="text-[11px] text-gray-400">{formatTime(editor.lastEdit)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Count pages recursively
const countPages = (tree) => {
  let count = 0;
  tree.forEach(node => {
    count += 1;
    if (node.children) {
      count += countPages(node.children);
    }
  });
  return count;
};

// Main Admin Component
const KBAdmin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, isSuperAdmin, loading, pageTree, updatePage, deletePage, fetchPageTree, fetchTopPages, fetchOverallStats, fetchContentStats, fetchActiveEditors, fetchTemplates, templates } = useKnowledgeBase();
  const [editingPage, setEditingPage] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

  // Check for edit param in URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !editingPage) {
      handleEditPage(editId);
    }
  }, [searchParams]);

  // Load admin count
  useEffect(() => {
    const loadAdminCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/knowledge-base/admins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAdmins(response.data);
      } catch (error) {
        // Ignore - only superadmin can see this
      }
    };
    if (isSuperAdmin) {
      loadAdminCount();
    }
  }, [isSuperAdmin, API_URL]);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        if (fetchTopPages) {
          const pages = await fetchTopPages(5);
          setTopPages(pages || []);
        }
        if (fetchOverallStats) {
          const stats = await fetchOverallStats();
          setOverallStats(stats);
        }
      } catch (error) {
        // Analytics are optional, don't block dashboard
      }
    };
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, fetchTopPages, fetchOverallStats]);

  const handleEditPage = async (pageId) => {
    try {
      setLoadingPage(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/pages/${pageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingPage(response.data);
    } catch (error) {
      toast.error('Failed to load page for editing');
      console.error(error);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleSavePage = async (updates) => {
    if (!editingPage) return;
    await updatePage(editingPage._id, updates);
    setEditingPage(null);
    navigate('/knowledge-base/admin', { replace: true });
  };

  const handleDeletePage = async (pageId) => {
    await deletePage(pageId);
    setEditingPage(null);
    navigate('/knowledge-base/admin', { replace: true });
  };

  const handleCloseEditor = () => {
    setEditingPage(null);
    navigate('/knowledge-base/admin', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
          <Shield size={32} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-[24px] font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-[15px] text-gray-500 dark:text-neutral-400 text-center mb-6">
          You don't have admin access to the Knowledge Base.
        </p>
        <button
          onClick={() => navigate('/knowledge-base')}
          className="flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  // Show page editor if editing
  if (editingPage) {
    return (
      <PageEditor
        page={editingPage}
        onSave={handleSavePage}
        onClose={handleCloseEditor}
        onDelete={handleDeletePage}
      />
    );
  }

  // Show loading while fetching page for edit
  if (loadingPage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const totalPages = countPages(pageTree);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-neutral-950"
    >
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/knowledge-base')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200
                hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-[24px] font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-[14px] text-gray-500 dark:text-neutral-400 mt-0.5">
                Manage your Knowledge Base
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Pages"
            value={totalPages}
            icon={({ size }) => (
              <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            )}
            color="blue"
          />
          {isSuperAdmin && (
            <StatCard
              label="Admins"
              value={admins.length}
              icon={Users}
              color="purple"
            />
          )}
          <StatCard
            label="Your Role"
            value={isSuperAdmin ? 'Super' : 'Admin'}
            icon={Shield}
            color={isSuperAdmin ? 'amber' : 'green'}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-[12px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/knowledge-base')}
              className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium
                bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                text-gray-700 dark:text-neutral-300 rounded-lg
                hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ExternalLink size={16} />
              View Knowledge Base
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium
                bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                text-gray-700 dark:text-neutral-300 rounded-lg
                hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Layout size={16} />
              Templates
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Admin Management */}
          <AdminSection />

          {/* Recent Activity */}
          <RecentActivity />
        </div>

        {/* Content & Activity Section */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Content Overview */}
          <ContentOverview />

          {/* User Activity */}
          <UserActivity />
        </div>

        {/* Settings Section */}
        {isSuperAdmin && (
          <div className="mt-6">
            <h2 className="text-[12px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
              Configuration
            </h2>
            <SettingsPanel />
          </div>
        )}

        {/* Analytics Section */}
        {(topPages.length > 0 || overallStats) && (
          <div className="mt-8">
            <h2 className="text-[12px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
              Analytics
            </h2>

            {/* Overall Stats Row */}
            {overallStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Total Views"
                  value={overallStats.totalViews || 0}
                  icon={Eye}
                  color="blue"
                />
                <StatCard
                  label="Unique Viewers"
                  value={overallStats.uniqueViewers || 0}
                  icon={Users}
                  color="green"
                />
                <StatCard
                  label="Pages with Content"
                  value={overallStats.pagesWithViews || 0}
                  icon={BarChart3}
                  color="purple"
                />
                <StatCard
                  label="Avg. Time on Page"
                  value={overallStats.avgTimeOnPage ? `${Math.round(overallStats.avgTimeOnPage)}s` : '0s'}
                  icon={Clock}
                  color="amber"
                />
              </div>
            )}

            {/* Top Pages */}
            {topPages.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-gray-400" />
                    <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                      Most Viewed Pages
                    </h3>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {topPages.map((page, idx) => (
                    <div
                      key={page._id || idx}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                      onClick={() => page.slug && navigate(`/knowledge-base/${page.slug}`)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400 w-5">{idx + 1}.</span>
                        <span className="text-lg">{page.icon || '📄'}</span>
                        <span className="text-[14px] font-medium text-gray-900 dark:text-white">
                          {page.title || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-gray-500">
                        <Eye size={14} />
                        <span>{page.totalViews || 0} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Gallery Modal */}
      {showTemplates && (
        <TemplateGalleryLazy onClose={() => setShowTemplates(false)} />
      )}
    </motion.div>
  );
};

export default KBAdmin;
