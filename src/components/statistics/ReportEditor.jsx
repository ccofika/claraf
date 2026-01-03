import React, { useState } from 'react';
import { Save, X, Loader2 } from 'lucide-react';
import FilterBuilder from './Filters/FilterBuilder';

const ReportEditor = ({ report, metadata, onSave, onCancel }) => {
  const [config, setConfig] = useState({
    title: report.title || '',
    description: report.description || '',
    visibility: report.visibility || 'private',
    dateRange: report.dateRange || { type: 'last30days' },
    dateField: report.dateField || 'dateEntered',
    filters: report.filters || null,
    autoRefresh: report.autoRefresh || { enabled: false, interval: 300000 }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!config.title.trim()) {
      return;
    }
    setSaving(true);
    await onSave(config);
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Report Settings
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Title *
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Default Date Range
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Date Range
                </label>
                <select
                  value={config.dateRange?.type || 'last30days'}
                  onChange={(e) => setConfig({
                    ...config,
                    dateRange: { ...config.dateRange, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                >
                  {(metadata?.dateRangeOptions || []).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Date Field
                </label>
                <select
                  value={config.dateField}
                  onChange={(e) => setConfig({ ...config, dateField: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                >
                  <option value="dateEntered">Date Entered</option>
                  <option value="gradedDate">Graded Date</option>
                  <option value="createdAt">Created At</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report-level Filters */}
          <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Report Filters
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              These filters apply to all charts in this report.
            </p>
            <FilterBuilder
              filters={config.filters}
              metadata={metadata}
              onChange={(filters) => setConfig({ ...config, filters })}
            />
          </div>

          {/* Auto Refresh */}
          <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Auto Refresh
            </h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.autoRefresh?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  autoRefresh: { ...config.autoRefresh, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Automatically refresh data
              </span>
            </label>

            {config.autoRefresh?.enabled && (
              <div className="mt-3 ml-6">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Refresh interval
                </label>
                <select
                  value={config.autoRefresh.interval || 300000}
                  onChange={(e) => setConfig({
                    ...config,
                    autoRefresh: { ...config.autoRefresh, interval: parseInt(e.target.value) }
                  })}
                  className="w-48 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                >
                  <option value="60000">Every minute</option>
                  <option value="300000">Every 5 minutes</option>
                  <option value="600000">Every 10 minutes</option>
                  <option value="900000">Every 15 minutes</option>
                  <option value="1800000">Every 30 minutes</option>
                  <option value="3600000">Every hour</option>
                </select>
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Visibility
            </h3>
            <div className="space-y-2">
              {[
                { value: 'private', label: 'Private', description: 'Only you can see this report' },
                { value: 'shared', label: 'Shared', description: 'Visible to specific team members' },
                { value: 'public', label: 'Public', description: 'Visible to all statistics users' }
              ].map(option => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    config.visibility === option.value
                      ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={config.visibility === option.value}
                    onChange={(e) => setConfig({ ...config, visibility: e.target.value })}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !config.title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportEditor;
