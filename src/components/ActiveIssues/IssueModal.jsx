import React, { useState } from 'react';
import axios from 'axios';
import {
  X,
  CheckCircle,
  Clock,
  ArrowRight,
  Send,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  ExternalLink,
} from 'lucide-react';
import PostmortemView from './PostmortemView';

// Helper to format relative time
const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
};

// Format full date
const formatFullDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Severity badge component
const SeverityBadge = ({ severity }) => {
  const config = {
    critical: { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400', icon: AlertOctagon, label: 'Critical' },
    major: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400', icon: AlertTriangle, label: 'Major' },
    minor: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400', icon: AlertCircle, label: 'Minor' },
  };

  const { color, icon: Icon, label } = config[severity] || config.minor;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  const config = {
    reported: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400', label: 'Reported' },
    investigating: { color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400', label: 'Investigating' },
    identified: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400', label: 'Identified' },
    monitoring: { color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400', label: 'Monitoring' },
    resolved: { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400', label: 'Resolved' },
  };

  const { color, label } = config[status] || config.reported;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

// Timeline update item
const TimelineItem = ({ update, isLast }) => {
  const getStatusColor = (status) => {
    const colors = {
      reported: 'bg-blue-500',
      investigating: 'bg-purple-500',
      identified: 'bg-orange-500',
      monitoring: 'bg-cyan-500',
      resolved: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  return (
    <div className="relative flex gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[9px] top-5 w-0.5 h-[calc(100%-4px)] bg-gray-200 dark:bg-neutral-800" />
      )}

      {/* Timeline dot */}
      <div className={`relative z-10 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
        update.statusChange ? getStatusColor(update.statusChange.to) : 'bg-gray-200 dark:bg-neutral-700'
      }`}>
        {update.statusChange ? (
          <ArrowRight className="w-3 h-3 text-white" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-neutral-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {update.author?.name || 'System'}
          </span>
          <span className="text-xs text-gray-400 dark:text-neutral-500">
            {formatFullDate(update.createdAt)}
          </span>
        </div>

        {update.statusChange && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs text-gray-500 dark:text-neutral-400">Status:</span>
            <span className="text-xs text-gray-400 dark:text-neutral-500 capitalize">{update.statusChange.from}</span>
            <ArrowRight className="w-3 h-3 text-gray-400 dark:text-neutral-600" />
            <span className={`text-xs font-medium capitalize ${
              update.statusChange.to === 'resolved' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
            }`}>
              {update.statusChange.to}
            </span>
          </div>
        )}

        <p className="text-xs text-gray-600 dark:text-neutral-300">{update.message}</p>

        {/* Update images */}
        {update.images && update.images.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {update.images.map((img, idx) => (
              <a
                key={idx}
                href={img}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-16 h-16 rounded overflow-hidden border border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600 transition-colors"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const IssueModal = ({ issue, onClose, onUpdate, canEdit }) => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [newUpdate, setNewUpdate] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'reported', label: 'Reported' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'identified', label: 'Identified' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const handleAddUpdate = async () => {
    if (!newUpdate.trim() && !newStatus) return;

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      if (newStatus && newStatus !== issue.status) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/issues/${issue._id}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (newUpdate.trim()) {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/issues/${issue._id}/updates`,
          { message: newUpdate.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onUpdate(response.data);
      } else if (newStatus) {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/issues/${issue._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onUpdate(response.data);
      }

      setNewUpdate('');
      setNewStatus('');
    } catch (err) {
      console.error('Error adding update:', err);
      setError('Failed to add update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedUpdates = [...(issue.updates || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <SeverityBadge severity={issue.severity} />
                <StatusBadge status={issue.status} />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{issue.title}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(issue.createdAt)}
                </span>
                {issue.resolvedAt && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    Resolved {formatRelativeTime(issue.resolvedAt)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-neutral-800 px-5">
          {['timeline', 'details'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors relative capitalize ${
                activeTab === tab
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'timeline' ? (
            <div>
              {sortedUpdates.length > 0 ? (
                sortedUpdates.map((update, idx) => (
                  <TimelineItem
                    key={update._id || idx}
                    update={update}
                    isLast={idx === sortedUpdates.length - 1}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-gray-400 dark:text-neutral-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">No updates yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Description</h3>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{issue.description}</p>
              </div>

              {/* Affected Areas */}
              {issue.affectedAreas && issue.affectedAreas.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Affected Areas</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {issue.affectedAreas.map((area, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs rounded">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {issue.images && issue.images.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Attachments</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {issue.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-video rounded overflow-hidden border border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600 transition-colors group relative"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Created By</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{issue.createdBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Created At</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{formatFullDate(issue.createdAt)}</p>
                </div>
                {issue.resolvedAt && (
                  <>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Resolved By</h3>
                      <p className="text-sm text-gray-900 dark:text-white">{issue.resolvedBy?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Resolved At</h3>
                      <p className="text-sm text-gray-900 dark:text-white">{formatFullDate(issue.resolvedAt)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Postmortem / Post-Incident Report */}
              <PostmortemView
                issue={issue}
                canEdit={canEdit}
                onUpdate={onUpdate}
              />
            </div>
          )}
        </div>

        {/* Add Update Form */}
        {canEdit && (
          <div className="flex-shrink-0 px-5 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            {error && (
              <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded text-red-700 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="">Status...</option>
                {statusOptions
                  .filter(opt => opt.value !== issue.status)
                  .map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))
                }
              </select>

              <input
                type="text"
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddUpdate()}
                placeholder="Add an update..."
                className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />

              <button
                onClick={handleAddUpdate}
                disabled={isSubmitting || (!newUpdate.trim() && !newStatus)}
                className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueModal;
