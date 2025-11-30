import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Calendar, Info } from 'lucide-react';

const UptimeBar = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchUptimeHistory = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/system-components/uptime-history?days=90`
        );
        setData(response.data);
      } catch (error) {
        console.error('Error fetching uptime history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUptimeHistory();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      operational: 'bg-green-500 hover:bg-green-400',
      degraded: 'bg-yellow-500 hover:bg-yellow-400',
      partial_outage: 'bg-orange-500 hover:bg-orange-400',
      major_outage: 'bg-red-500 hover:bg-red-400',
    };
    return colors[status] || 'bg-gray-300 dark:bg-neutral-600';
  };

  const getStatusLabel = (status) => {
    const labels = {
      operational: 'Operational',
      degraded: 'Degraded Performance',
      partial_outage: 'Partial Outage',
      major_outage: 'Major Outage',
    };
    return labels[status] || 'No Data';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleMouseEnter = (day, event) => {
    const rect = event.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredDay(day);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4 mb-3" />
          <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
            90-Day Uptime History
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {data.overallUptime}%
          </span>
          <span className="text-xs text-gray-500 dark:text-neutral-500">uptime</span>
        </div>
      </div>

      {/* Uptime Bar */}
      <div className="flex gap-px w-full">
        {data.history.map((day, idx) => (
          <div
            key={day.date}
            className={`flex-1 h-8 rounded-sm cursor-pointer transition-all ${getStatusColor(day.status)}`}
            onMouseEnter={(e) => handleMouseEnter(day, e)}
            onMouseLeave={() => setHoveredDay(null)}
            style={{ minWidth: '2px' }}
          />
        ))}
      </div>

      {/* Date Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-neutral-500">
        <span>{formatDate(data.history[0]?.date)}</span>
        <span>{formatDate(data.history[data.history.length - 1]?.date)}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
          <span className="text-[10px] text-gray-500 dark:text-neutral-400">Operational</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />
          <span className="text-[10px] text-gray-500 dark:text-neutral-400">Degraded</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
          <span className="text-[10px] text-gray-500 dark:text-neutral-400">Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
          <span className="text-[10px] text-gray-500 dark:text-neutral-400">Outage</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-gray-900 dark:bg-neutral-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <div className="font-medium mb-1">{formatDate(hoveredDay.date)}</div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(hoveredDay.status).split(' ')[0]}`} />
            <span>{getStatusLabel(hoveredDay.status)}</span>
          </div>
          {hoveredDay.issueCount > 0 && (
            <div className="text-gray-400 mt-1">
              {hoveredDay.issueCount} issue{hoveredDay.issueCount !== 1 ? 's' : ''}
            </div>
          )}
          <div className="text-gray-400">
            {hoveredDay.uptimePercent}% uptime
          </div>
        </div>
      )}
    </div>
  );
};

export default UptimeBar;
