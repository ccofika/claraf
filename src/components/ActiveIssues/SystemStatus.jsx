import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Server,
  RefreshCw,
} from 'lucide-react';

const SystemStatus = ({ onRefresh }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/system-components`
      );
      setData(response.data);
      // Expand all groups by default
      const groups = {};
      Object.keys(response.data.groups || {}).forEach(group => {
        groups[group] = true;
      });
      setExpandedGroups(groups);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      operational: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />,
      degraded: <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
      partial_outage: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
      major_outage: <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
    };
    return icons[status] || icons.operational;
  };

  const getStatusLabel = (status) => {
    const labels = {
      operational: 'Operational',
      degraded: 'Degraded',
      partial_outage: 'Partial Outage',
      major_outage: 'Major Outage',
    };
    return labels[status] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      operational: 'text-green-600 dark:text-green-400',
      degraded: 'text-yellow-600 dark:text-yellow-400',
      partial_outage: 'text-orange-600 dark:text-orange-400',
      major_outage: 'text-red-600 dark:text-red-400',
    };
    return colors[status] || 'text-gray-600 dark:text-gray-400';
  };

  const getOverallStatusConfig = (status) => {
    const configs = {
      operational: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-900/50',
        text: 'text-green-800 dark:text-green-300',
        icon: <CheckCircle className="w-5 h-5" />,
        label: 'All Systems Operational',
      },
      degraded: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-900/50',
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: <AlertCircle className="w-5 h-5" />,
        label: 'Degraded Performance',
      },
      partial_outage: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-900/50',
        text: 'text-orange-800 dark:text-orange-300',
        icon: <AlertTriangle className="w-5 h-5" />,
        label: 'Partial System Outage',
      },
      major_outage: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-900/50',
        text: 'text-red-800 dark:text-red-300',
        icon: <XCircle className="w-5 h-5" />,
        label: 'Major System Outage',
      },
    };
    return configs[status] || configs.operational;
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    );
  }

  if (!data || !data.groups || Object.keys(data.groups).length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6 text-center">
        <Server className="w-8 h-8 text-gray-400 dark:text-neutral-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-neutral-400">No system components configured</p>
      </div>
    );
  }

  const overallConfig = getOverallStatusConfig(data.overallStatus);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      {/* Overall Status Banner */}
      <div className={`px-4 py-3 ${overallConfig.bg} border-b ${overallConfig.border}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${overallConfig.text}`}>
            {overallConfig.icon}
            <span className="font-medium">{overallConfig.label}</span>
          </div>
          <button
            onClick={() => { fetchComponents(); onRefresh && onRefresh(); }}
            className="p-1.5 rounded-md hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${overallConfig.text} ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Component Groups */}
      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {Object.entries(data.groups).map(([groupName, components]) => (
          <div key={groupName}>
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                {groupName}
              </span>
              {expandedGroups[groupName] ? (
                <ChevronUp className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
              )}
            </button>

            {/* Components */}
            {expandedGroups[groupName] && (
              <div className="px-4 pb-2 space-y-1">
                {components.map((component) => (
                  <div
                    key={component._id}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(component.status)}
                      <div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {component.name}
                        </span>
                        {component.description && (
                          <p className="text-xs text-gray-500 dark:text-neutral-400">
                            {component.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${getStatusColor(component.status)}`}>
                      {getStatusLabel(component.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatus;
