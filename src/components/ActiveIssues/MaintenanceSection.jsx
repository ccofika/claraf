import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Wrench,
  Clock,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const MaintenanceSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const fetchMaintenance = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/maintenance/summary`
      );
      setData(response.data);
    } catch (error) {
      console.error('Error fetching maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const diffHours = Math.round(diffMs / 3600000);

    if (diffHours < 1) {
      const diffMins = Math.round(diffMs / 60000);
      return `${diffMins} min`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };

  const getImpactColor = (impact) => {
    const colors = {
      none: 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400',
      minor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      major: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return colors[impact] || colors.minor;
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: <Clock className="w-4 h-4 text-blue-500" />,
      in_progress: <AlertCircle className="w-4 h-4 text-orange-500 animate-pulse" />,
      completed: <CheckCircle className="w-4 h-4 text-green-500" />,
      cancelled: <XCircle className="w-4 h-4 text-gray-500" />,
    };
    return icons[status] || icons.scheduled;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/3" />
          <div className="h-16 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    );
  }

  // Don't render if no maintenance
  if (!data || (!data.hasActive && !data.hasUpcoming)) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Active Maintenance Banner */}
      {data.hasActive && data.active.map((maintenance) => (
        <div
          key={maintenance._id}
          className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">
                  Maintenance In Progress
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getImpactColor(maintenance.impact)}`}>
                  {maintenance.impact} impact
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {maintenance.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-neutral-400 line-clamp-2">
                {maintenance.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Started {formatDate(maintenance.actualStart || maintenance.scheduledStart)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Expected: {formatDuration(maintenance.scheduledStart, maintenance.scheduledEnd)}
                </span>
              </div>
              {maintenance.affectedComponents && maintenance.affectedComponents.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs text-gray-500 dark:text-neutral-400">Affects:</span>
                  {maintenance.affectedComponents.map((comp, idx) => (
                    <span
                      key={comp._id || idx}
                      className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded"
                    >
                      {comp.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Upcoming Maintenance */}
      {data.hasUpcoming && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Scheduled Maintenance
              </span>
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full font-medium">
                {data.upcoming.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {data.upcoming.map((maintenance) => (
              <div
                key={maintenance._id}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(maintenance.status)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {maintenance.title}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getImpactColor(maintenance.impact)}`}>
                        {maintenance.impact}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(maintenance.scheduledStart)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(maintenance.scheduledStart, maintenance.scheduledEnd)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceSection;
