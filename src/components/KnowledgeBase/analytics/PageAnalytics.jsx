import React, { useState, useEffect } from 'react';
import { X, BarChart3, Eye, Users, Clock, TrendingUp, Calendar } from 'lucide-react';

const PageAnalytics = ({ pageId, pageTitle, onFetchAnalytics, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!pageId || !onFetchAnalytics) return;
      setLoading(true);
      try {
        const data = await onFetchAnalytics(pageId, period);
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pageId, period]);

  const totalViews = analytics?.reduce((sum, d) => sum + (d.views || 0), 0) || 0;
  const totalUnique = analytics?.reduce((sum, d) => sum + (d.uniqueViewers?.length || 0), 0) || 0;
  const avgTime = analytics?.length > 0
    ? Math.round(analytics.reduce((sum, d) => sum + (d.avgTimeOnPage || 0), 0) / analytics.length)
    : 0;

  // Simple bar chart data - last 7 days
  const last7 = analytics?.slice(-7) || [];
  const maxViews = Math.max(...last7.map(d => d.views || 0), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Page Analytics</h2>
              <p className="text-xs text-gray-500">{pageTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
              className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Views</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalViews}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium">Unique Viewers</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalUnique}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Avg. Time</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {avgTime > 60 ? `${Math.floor(avgTime / 60)}m` : `${avgTime}s`}
                  </p>
                </div>
              </div>

              {/* Simple bar chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Views (Last 7 days)
                </h3>
                <div className="flex items-end gap-1 h-32">
                  {last7.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400">{day.views || 0}</span>
                      <div
                        className="w-full bg-blue-400 dark:bg-blue-500 rounded-t transition-all"
                        style={{ height: `${((day.views || 0) / maxViews) * 100}%`, minHeight: '2px' }}
                      />
                      <span className="text-[10px] text-gray-400">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily breakdown */}
              {analytics && analytics.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Breakdown</h3>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white dark:bg-gray-800">
                        <tr className="text-gray-400 border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left py-1.5 font-medium">Date</th>
                          <th className="text-right py-1.5 font-medium">Views</th>
                          <th className="text-right py-1.5 font-medium">Unique</th>
                          <th className="text-right py-1.5 font-medium">Avg Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...analytics].reverse().map((day, idx) => (
                          <tr key={idx} className="border-b border-gray-50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300">
                            <td className="py-1.5">{new Date(day.date).toLocaleDateString()}</td>
                            <td className="text-right">{day.views || 0}</td>
                            <td className="text-right">{day.uniqueViewers?.length || 0}</td>
                            <td className="text-right">{day.avgTimeOnPage ? `${Math.round(day.avgTimeOnPage)}s` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageAnalytics;
