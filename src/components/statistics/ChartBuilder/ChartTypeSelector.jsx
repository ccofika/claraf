import React from 'react';
import {
  BarChart3, LineChart, PieChart, TrendingUp, Table, Activity,
  Grid3X3, BarChart2, Filter, GitCompare, Gauge, BarChartHorizontal
} from 'lucide-react';

const CHART_ICONS = {
  kpi: Activity,
  column: BarChart3,
  bar: BarChartHorizontal,
  line: LineChart,
  area: TrendingUp,
  donut: PieChart,
  combo: BarChart2,
  heatmap: Grid3X3,
  table: Table,
  gauge: Gauge,
  funnel: Filter,
  comparison: GitCompare
};

const ChartTypeSelector = ({ value, onChange, chartTypes }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Chart Type
      </label>
      <div className="grid grid-cols-4 gap-2">
        {chartTypes.map(type => {
          const Icon = CHART_ICONS[type.value] || BarChart3;
          const isSelected = value === type.value;

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-all ${
                isSelected
                  ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-neutral-900'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChartTypeSelector;
