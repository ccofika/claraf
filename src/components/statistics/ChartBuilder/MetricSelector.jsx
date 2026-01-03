import React from 'react';

const MetricSelector = ({ metric, aggregation, metrics, aggregations, onChange }) => {
  // Get available aggregations for selected metric
  const selectedMetric = metrics.find(m => m.value === metric);
  const availableAggregations = selectedMetric?.aggregations || ['avg', 'sum', 'count'];

  return (
    <div className="space-y-4">
      {/* Metric */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Metric *
        </label>
        <select
          value={metric}
          onChange={(e) => onChange({ metric: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select metric...</option>
          {metrics.map(m => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        {selectedMetric && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Type: {selectedMetric.type}
          </p>
        )}
      </div>

      {/* Aggregation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Aggregation
        </label>
        <select
          value={aggregation}
          onChange={(e) => onChange({ aggregation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {aggregations
            .filter(a => availableAggregations.includes(a.value) || availableAggregations.includes('all'))
            .map(a => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          How to combine multiple values
        </p>
      </div>
    </div>
  );
};

export default MetricSelector;
