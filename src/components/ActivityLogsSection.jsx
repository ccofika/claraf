import React from 'react';
import { FileText, AlertCircle, Activity, RefreshCw, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

const ActivityLogsSection = ({
  logs,
  logStats,
  logPagination,
  logFilters,
  logsLoading,
  levelFilter,
  moduleFilter,
  searchFilter,
  onLevelFilterChange,
  onModuleFilterChange,
  onSearchFilterChange,
  onPageChange,
  onRefreshLogs
}) => {
  const handleClearFilters = () => {
    onLevelFilterChange('');
    onModuleFilterChange('');
    onSearchFilterChange('');
  };

  const hasActiveFilters = levelFilter || moduleFilter || searchFilter;

  return (
    <div className="space-y-4">
      {/* Log Statistics Cards */}
      {logStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className={`bg-white dark:bg-neutral-900 rounded-lg p-6 border-2 cursor-pointer transition-all ${
              levelFilter === ''
                ? 'border-blue-500 dark:border-blue-400'
                : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
            }`}
            onClick={() => onLevelFilterChange('')}
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Total Logs</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-neutral-50">{logStats.total}</p>
            {hasActiveFilters && (
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                Filtered: {logStats.filtered.total}
              </p>
            )}
          </div>

          <div
            className={`bg-white dark:bg-neutral-900 rounded-lg p-6 border-2 cursor-pointer transition-all ${
              levelFilter === 'error'
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-700'
            }`}
            onClick={() => onLevelFilterChange(levelFilter === 'error' ? '' : 'error')}
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Errors</h3>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{logStats.errors}</p>
            {hasActiveFilters && (
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                Filtered: {logStats.filtered.errors}
              </p>
            )}
          </div>

          <div
            className={`bg-white dark:bg-neutral-900 rounded-lg p-6 border-2 cursor-pointer transition-all ${
              levelFilter === 'warn'
                ? 'border-yellow-500 dark:border-yellow-400'
                : 'border-gray-200 dark:border-neutral-800 hover:border-yellow-300 dark:hover:border-yellow-700'
            }`}
            onClick={() => onLevelFilterChange(levelFilter === 'warn' ? '' : 'warn')}
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Warnings</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{logStats.warnings}</p>
            {hasActiveFilters && (
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                Filtered: {logStats.filtered.warnings}
              </p>
            )}
          </div>

          <div
            className={`bg-white dark:bg-neutral-900 rounded-lg p-6 border-2 cursor-pointer transition-all ${
              levelFilter === 'info'
                ? 'border-blue-500 dark:border-blue-400'
                : 'border-gray-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
            onClick={() => onLevelFilterChange(levelFilter === 'info' ? '' : 'info')}
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-neutral-50">Info</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{logStats.info}</p>
            {hasActiveFilters && (
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                Filtered: {logStats.filtered.info}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Filters:</span>
          </div>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => onModuleFilterChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Modules</option>
            {logFilters.availableModules.map((module) => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => onSearchFilterChange(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-neutral-50 border border-gray-300 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Clear Filters
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefreshLogs}
            disabled={logsLoading}
            className="ml-auto px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
              Activity Logs
            </h3>
            {logPagination && (
              <span className="text-sm text-gray-500 dark:text-neutral-500">
                ({logPagination.totalCount} total)
              </span>
            )}
          </div>

          {/* Pagination Info */}
          {logPagination && logPagination.totalPages > 1 && (
            <div className="text-sm text-gray-600 dark:text-neutral-400">
              Page {logPagination.currentPage} of {logPagination.totalPages}
            </div>
          )}
        </div>

        {logsLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500 dark:text-neutral-400">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
            {hasActiveFilters
              ? 'No logs found matching your filters. Try adjusting your search criteria.'
              : 'No activity logs yet. Logs will appear here as users interact with the system.'}
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className={`p-3 rounded-md border ${
                    log.level === 'error'
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : log.level === 'warn'
                      ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded shrink-0 ${
                      log.level === 'error'
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        : log.level === 'warn'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-neutral-50 font-medium">{log.message}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600 dark:text-neutral-400">
                        <span className="font-mono">Module: {log.module}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        {log.metadata?.userEmail && (
                          <span className="font-mono">User: {log.metadata.userEmail}</span>
                        )}
                        {log.metadata?.ip && (
                          <span className="font-mono">IP: {log.metadata.ip}</span>
                        )}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 dark:text-neutral-500 cursor-pointer hover:text-gray-700 dark:hover:text-neutral-300">
                            Show metadata
                          </summary>
                          <pre className="mt-1 p-2 text-xs text-gray-600 dark:text-neutral-400 font-mono bg-gray-100 dark:bg-neutral-900 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {logPagination && logPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-neutral-800">
                <button
                  onClick={() => onPageChange(logPagination.currentPage - 1)}
                  disabled={!logPagination.hasPrevPage}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, logPagination.totalPages))].map((_, idx) => {
                    let pageNum;
                    if (logPagination.totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (logPagination.currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (logPagination.currentPage >= logPagination.totalPages - 2) {
                      pageNum = logPagination.totalPages - 4 + idx;
                    } else {
                      pageNum = logPagination.currentPage - 2 + idx;
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => onPageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          pageNum === logPagination.currentPage
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => onPageChange(logPagination.currentPage + 1)}
                  disabled={!logPagination.hasNextPage}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsSection;
