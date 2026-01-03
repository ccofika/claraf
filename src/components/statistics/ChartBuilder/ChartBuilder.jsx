import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X, Save, Eye, Loader2, ChevronDown, Plus,
  BarChart3, LineChart, PieChart, TrendingUp, Table, Activity,
  Grid3X3, BarChart2, Filter, GitCompare, Gauge
} from 'lucide-react';
import { toast } from 'sonner';

import ChartTypeSelector from './ChartTypeSelector';
import MetricSelector from './MetricSelector';
import DimensionSelector from './DimensionSelector';
import FilterBuilder from '../Filters/FilterBuilder';
import ChartOptions from './ChartOptions';
import ChartRenderer from '../Charts/ChartRenderer';

const ChartBuilder = ({
  chart,
  metadata,
  reportFilters,
  reportDateRange,
  onSave,
  onClose
}) => {
  const API_URL = process.env.REACT_APP_API_URL;

  // Chart configuration state
  const [config, setConfig] = useState({
    title: '',
    description: '',
    chartType: 'column',
    dataset: 'tickets',
    metric: '',
    aggregation: 'avg',
    viewBy: 'none',
    segmentBy: '',
    topN: null,
    showOthers: true,
    sortBy: 'value',
    sortOrder: 'desc',
    filters: null,
    overrideDateRange: false,
    dateRange: null,
    target: null,
    comparison: { enabled: false },
    options: {
      showDataLabels: false,
      showLegend: true,
      smooth: true,
      showPoints: true,
      format: 'number',
      decimals: 1
    },
    layout: { x: 0, y: 0, w: 6, h: 4 }
  });

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Active tab in builder
  const [activeTab, setActiveTab] = useState('data'); // 'data', 'filters', 'display', 'target'

  // Initialize from existing chart
  useEffect(() => {
    if (chart) {
      setConfig({
        ...config,
        ...chart,
        options: { ...config.options, ...chart.options }
      });
    }
  }, [chart]);

  // Update config helper
  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Update options helper
  const updateOptions = (updates) => {
    setConfig(prev => ({
      ...prev,
      options: { ...prev.options, ...updates }
    }));
  };

  // Preview chart data
  const handlePreview = async () => {
    if (!config.metric) {
      toast.error('Please select a metric');
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/reports/charts/preview`, {
        ...config,
        reportFilters,
        dateRange: config.overrideDateRange ? config.dateRange : reportDateRange
      });
      setPreviewData(res.data.data);
    } catch (error) {
      console.error('Error previewing:', error);
      toast.error('Failed to preview: ' + (error.response?.data?.message || error.message));
    } finally {
      setPreviewLoading(false);
    }
  };

  // Save chart
  const handleSave = async () => {
    if (!config.title?.trim()) {
      toast.error('Please enter a chart title');
      return;
    }
    if (!config.metric) {
      toast.error('Please select a metric');
      return;
    }

    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  // Get metrics for current dataset
  const getMetricsForDataset = () => {
    if (!metadata?.metrics) return [];
    const datasetMetrics = metadata.metrics[config.dataset];
    return datasetMetrics || [];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {chart ? 'Edit Chart' : 'Create Chart'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left panel - Configuration */}
          <div className="w-1/2 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-neutral-800 px-4">
              {[
                { id: 'data', label: 'Data' },
                { id: 'filters', label: 'Filters' },
                { id: 'display', label: 'Display' },
                { id: 'target', label: 'Target' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'data' && (
                <div className="space-y-6">
                  {/* Chart Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Chart Title *
                    </label>
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) => updateConfig({ title: e.target.value })}
                      placeholder="e.g., Average Quality Score by Agent"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Chart Type */}
                  <ChartTypeSelector
                    value={config.chartType}
                    onChange={(value) => updateConfig({ chartType: value })}
                    chartTypes={metadata?.chartTypes || []}
                  />

                  {/* Dataset */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dataset
                    </label>
                    <select
                      value={config.dataset}
                      onChange={(e) => updateConfig({ dataset: e.target.value, metric: '' })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                    >
                      {(metadata?.datasets || []).map(ds => (
                        <option key={ds} value={ds}>
                          {ds.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Metric & Aggregation */}
                  <MetricSelector
                    metric={config.metric}
                    aggregation={config.aggregation}
                    metrics={getMetricsForDataset()}
                    aggregations={metadata?.aggregations || []}
                    onChange={(updates) => updateConfig(updates)}
                  />

                  {/* View By / Segment By */}
                  {config.chartType !== 'kpi' && (
                    <DimensionSelector
                      viewBy={config.viewBy}
                      segmentBy={config.segmentBy}
                      topN={config.topN}
                      sortBy={config.sortBy}
                      sortOrder={config.sortOrder}
                      options={metadata?.viewByOptions || []}
                      onChange={(updates) => updateConfig(updates)}
                    />
                  )}
                </div>
              )}

              {activeTab === 'filters' && (
                <div className="space-y-6">
                  <FilterBuilder
                    filters={config.filters}
                    metadata={metadata}
                    onChange={(filters) => updateConfig({ filters })}
                  />

                  {/* Override date range */}
                  <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.overrideDateRange}
                        onChange={(e) => updateConfig({ overrideDateRange: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Override report date range
                      </span>
                    </label>

                    {config.overrideDateRange && (
                      <div className="mt-3">
                        <select
                          value={config.dateRange?.type || 'last30days'}
                          onChange={(e) => updateConfig({ dateRange: { type: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                        >
                          {(metadata?.dateRangeOptions || []).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'display' && (
                <ChartOptions
                  chartType={config.chartType}
                  options={config.options}
                  onChange={updateOptions}
                />
              )}

              {activeTab === 'target' && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={!!config.target}
                        onChange={(e) => updateConfig({
                          target: e.target.checked ? { value: 85, showLine: true } : null
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable target
                      </span>
                    </label>

                    {config.target && (
                      <div className="space-y-4 pl-6">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Target Value
                          </label>
                          <input
                            type="number"
                            value={config.target.value || ''}
                            onChange={(e) => updateConfig({
                              target: { ...config.target, value: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.target.showLine}
                            onChange={(e) => updateConfig({
                              target: { ...config.target, showLine: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Show target line on chart
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-neutral-700">
                    <label className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={config.comparison?.enabled}
                        onChange={(e) => updateConfig({
                          comparison: { ...config.comparison, enabled: e.target.checked, type: 'previousPeriod' }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Compare to previous period
                      </span>
                    </label>

                    {config.comparison?.enabled && (
                      <div className="pl-6">
                        <select
                          value={config.comparison.type || 'previousPeriod'}
                          onChange={(e) => updateConfig({
                            comparison: { ...config.comparison, type: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                        >
                          <option value="previousPeriod">Previous period</option>
                          <option value="samePeriodLastWeek">Same period last week</option>
                          <option value="samePeriodLastMonth">Same period last month</option>
                          <option value="samePeriodLastYear">Same period last year</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Preview */}
          <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-neutral-800/50">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-neutral-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</span>
              <button
                onClick={handlePreview}
                disabled={previewLoading || !config.metric}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {previewLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Preview
              </button>
            </div>

            <div className="flex-1 p-6">
              <div className="h-full border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center">
                {previewData ? (
                  <div className="w-full h-full p-4">
                    <ChartRenderer
                      chart={config}
                      data={previewData}
                      loading={previewLoading}
                    />
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Configure your chart and click Preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !config.title || !config.metric}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            {chart ? 'Update Chart' : 'Create Chart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;
