import React, { useState } from 'react';
import {
  BarChart3, Star, StarOff, MoreHorizontal, Trash2, Copy,
  Calendar, FileText, ChevronRight, Grid3X3, Plus, Search,
  Layout, TrendingUp, PieChart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ReportsList = ({
  reports,
  onSelectReport,
  onDeleteReport,
  onDuplicateReport,
  onTogglePin,
  onCreateReport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedReports = filteredReports.filter(r => r.isPinned);
  const unpinnedReports = filteredReports.filter(r => !r.isPinned);

  const getReportIcon = (report) => {
    // Determine icon based on chart types in the report
    if (report.chartsCount === 0) return Layout;
    return BarChart3;
  };

  const ReportCard = ({ report }) => {
    const Icon = getReportIcon(report);
    const isMenuOpen = openMenu === report._id;

    return (
      <div
        className="group relative bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => onSelectReport(report._id)}
      >
        {/* Pin indicator */}
        {report.isPinned && (
          <div className="absolute top-3 right-3">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
        )}

        {/* Icon and title */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate pr-8">
              {report.title}
            </h3>
            {report.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {report.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Grid3X3 className="w-3.5 h-3.5" />
              {report.chartsCount || 0} charts
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })}
            </span>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(isMenuOpen ? null : report._id);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(null);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700 py-1 min-w-[160px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(report._id);
                      setOpenMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    {report.isPinned ? (
                      <>
                        <StarOff className="w-4 h-4" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        Pin to top
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateReport(report._id);
                      setOpenMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <div className="border-t border-gray-200 dark:border-neutral-700 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteReport(report._id);
                      setOpenMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hover arrow - positioned to not overlap with bottom meta info */}
        <div className="absolute right-4 top-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <ChevronRight className="w-5 h-5 text-blue-400" />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Search and filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {reports.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Create your first report
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Build custom dashboards with charts, tables, and KPIs to track your QA metrics.
          </p>
          <button
            onClick={onCreateReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned reports */}
          {pinnedReports.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Pinned
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedReports.map(report => (
                  <ReportCard key={report._id} report={report} />
                ))}
              </div>
            </div>
          )}

          {/* All reports */}
          {unpinnedReports.length > 0 && (
            <div>
              {pinnedReports.length > 0 && (
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  All Reports
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedReports.map(report => (
                  <ReportCard key={report._id} report={report} />
                ))}
              </div>
            </div>
          )}

          {filteredReports.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No reports found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsList;
