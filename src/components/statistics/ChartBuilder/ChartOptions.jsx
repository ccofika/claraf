import React from 'react';

const ChartOptions = ({ chartType, options, onChange }) => {
  // Common options
  const renderCommonOptions = () => (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show Legend</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.showLegend !== false}
            onChange={(e) => onChange({ showLegend: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show Data Labels</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.showDataLabels}
            onChange={(e) => onChange({ showDataLabels: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </>
  );

  // KPI specific options
  const renderKPIOptions = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Format
        </label>
        <select
          value={options.format || 'number'}
          onChange={(e) => onChange({ format: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        >
          <option value="number">Number</option>
          <option value="percentage">Percentage</option>
          <option value="currency">Currency</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Decimal Places
        </label>
        <input
          type="number"
          min="0"
          max="4"
          value={options.decimals ?? 1}
          onChange={(e) => onChange({ decimals: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prefix
          </label>
          <input
            type="text"
            value={options.prefix || ''}
            onChange={(e) => onChange({ prefix: e.target.value })}
            placeholder="e.g., $"
            className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Suffix
          </label>
          <input
            type="text"
            value={options.suffix || ''}
            onChange={(e) => onChange({ suffix: e.target.value })}
            placeholder="e.g., %"
            className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show Trend Indicator</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.showTrend !== false}
            onChange={(e) => onChange({ showTrend: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </>
  );

  // Line/Area specific options
  const renderLineOptions = () => (
    <>
      {renderCommonOptions()}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Smooth Line</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.smooth !== false}
            onChange={(e) => onChange({ smooth: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show Points</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.showPoints !== false}
            onChange={(e) => onChange({ showPoints: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {chartType === 'area' && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Stacked</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={options.stacked}
              onChange={(e) => onChange({ stacked: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      )}
    </>
  );

  // Bar/Column specific options
  const renderBarOptions = () => (
    <>
      {renderCommonOptions()}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Stacked</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.stacked}
            onChange={(e) => onChange({ stacked: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {options.stacked && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Show as 100%</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={options.relative}
              onChange={(e) => onChange({ relative: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      )}
    </>
  );

  // Donut specific options
  const renderDonutOptions = () => (
    <>
      {renderCommonOptions()}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show Center Text</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.showCenterText !== false}
            onChange={(e) => onChange({ showCenterText: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </>
  );

  // Table specific options
  const renderTableOptions = () => (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show Summary Row</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.showSummaryRow}
            onChange={(e) => onChange({ showSummaryRow: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Rows Per Page
        </label>
        <select
          value={options.pageSize || 10}
          onChange={(e) => onChange({ pageSize: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </>
  );

  // Gauge specific options
  const renderGaugeOptions = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Format
        </label>
        <select
          value={options.format || 'number'}
          onChange={(e) => onChange({ format: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        >
          <option value="number">Number</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Value
          </label>
          <input
            type="number"
            value={options.gaugeMin ?? 0}
            onChange={(e) => onChange({ gaugeMin: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Value
          </label>
          <input
            type="number"
            value={options.gaugeMax ?? 100}
            onChange={(e) => onChange({ gaugeMax: parseFloat(e.target.value) || 100 })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Display Options</h3>

      {chartType === 'kpi' && renderKPIOptions()}
      {(chartType === 'line' || chartType === 'area') && renderLineOptions()}
      {(chartType === 'bar' || chartType === 'column') && renderBarOptions()}
      {chartType === 'donut' && renderDonutOptions()}
      {chartType === 'table' && renderTableOptions()}
      {chartType === 'gauge' && renderGaugeOptions()}
      {(chartType === 'heatmap' || chartType === 'combo') && renderCommonOptions()}
    </div>
  );
};

export default ChartOptions;
