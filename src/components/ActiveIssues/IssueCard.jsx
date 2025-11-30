import React from 'react';
import {
  CheckCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  Image,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
} from 'lucide-react';

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

// Highlight search matches in text
const highlightText = (text, query) => {
  if (!query || !text) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// Severity badge component
const SeverityBadge = ({ severity }) => {
  const config = {
    critical: {
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
      icon: AlertOctagon,
      label: 'Critical'
    },
    major: {
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
      icon: AlertTriangle,
      label: 'Major'
    },
    minor: {
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      icon: AlertCircle,
      label: 'Minor'
    },
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

const IssueCard = ({ issue, onClick, onStatusChange, searchQuery }) => {
  const latestUpdate = issue.updates && issue.updates.length > 0
    ? issue.updates[issue.updates.length - 1]
    : null;

  const isResolved = issue.status === 'resolved';

  return (
    <div
      onClick={onClick}
      className={`group bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md dark:hover:shadow-neutral-900/50 hover:border-gray-300 dark:hover:border-neutral-700 ${
        isResolved ? 'opacity-60' : ''
      }`}
    >
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={issue.severity} />
              <StatusBadge status={issue.status} />
              <span className="text-xs text-gray-400 dark:text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(issue.createdAt)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {highlightText(issue.title, searchQuery)}
            </h3>
          </div>

          {/* Quick resolve button */}
          {onStatusChange && !isResolved && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(issue._id, 'resolved');
              }}
              className="flex-shrink-0 p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors opacity-0 group-hover:opacity-100"
              title="Mark as resolved"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-3 line-clamp-2">
          {highlightText(issue.description, searchQuery)}
        </p>

        {/* Latest Update Preview */}
        {latestUpdate && (
          <div className="bg-gray-50 dark:bg-neutral-950 rounded-md p-2.5 mb-3 border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Latest Update</span>
              <span className="text-xs text-gray-400 dark:text-neutral-500">
                {formatRelativeTime(latestUpdate.createdAt)}
              </span>
              {latestUpdate.statusChange && (
                <span className="text-xs text-gray-400 dark:text-neutral-500 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  <span className="capitalize">{latestUpdate.statusChange.to}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-neutral-300 line-clamp-1">
              {highlightText(latestUpdate.message, searchQuery)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Affected Areas */}
          {issue.affectedAreas && issue.affectedAreas.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {issue.affectedAreas.slice(0, 3).map((area, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 text-[10px] rounded"
                >
                  {highlightText(area, searchQuery)}
                </span>
              ))}
              {issue.affectedAreas.length > 3 && (
                <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                  +{issue.affectedAreas.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500 text-xs">
            {issue.updates && issue.updates.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {issue.updates.length}
              </span>
            )}
            {issue.images && issue.images.length > 0 && (
              <span className="flex items-center gap-1">
                <Image className="w-3 h-3" />
                {issue.images.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
