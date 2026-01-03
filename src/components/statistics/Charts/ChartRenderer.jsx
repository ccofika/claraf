import React from 'react';
import {
  PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart as RechartsLine, Line,
  AreaChart, Area,
  ComposedChart,
  RadialBarChart, RadialBar,
  ReferenceLine
} from 'recharts';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CHART_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#6366f1', '#a855f7', '#10b981', '#f43f5e', '#0ea5e9'
];

const ChartRenderer = ({ chart, data, error, loading }) => {

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[150px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-red-500">
        <AlertCircle className="w-6 h-6 mb-2" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[150px] text-gray-400">
        No data available
      </div>
    );
  }

  // No wrapper needed - we'll use fixed height in ResponsiveContainer

  switch (chart.chartType) {
    case 'kpi':
      return <KPIChart chart={chart} data={data} />;
    case 'bar':
      return <BarChartComponent chart={chart} data={data} />;
    case 'column':
      return <ColumnChartComponent chart={chart} data={data} />;
    case 'line':
      return <LineChartComponent chart={chart} data={data} />;
    case 'area':
      return <AreaChartComponent chart={chart} data={data} />;
    case 'donut':
      return <DonutChartComponent chart={chart} data={data} />;
    case 'combo':
      return <ComboChartComponent chart={chart} data={data} />;
    case 'table':
      return <TableComponent chart={chart} data={data} />;
    case 'heatmap':
      return <HeatmapComponent chart={chart} data={data} />;
    case 'gauge':
      return <GaugeChartComponent chart={chart} data={data} />;
    default:
      return <div className="text-gray-400">Unknown chart type: {chart.chartType}</div>;
  }
};

// KPI Card Component
const KPIChart = ({ chart, data }) => {
  const value = typeof data === 'object' && !Array.isArray(data)
    ? data.value
    : data;

  const formattedValue = formatValue(value, chart.options?.format, chart.options?.decimals);
  const target = chart.target?.value;
  const comparison = data.comparison;

  // Determine trend
  let trendIcon = <Minus className="w-4 h-4" />;
  let trendColor = 'text-gray-500';
  let trendText = '';

  if (comparison !== undefined) {
    const change = ((value - comparison) / comparison) * 100;
    if (change > 0) {
      trendIcon = <TrendingUp className="w-4 h-4" />;
      trendColor = 'text-green-500';
      trendText = `+${change.toFixed(1)}%`;
    } else if (change < 0) {
      trendIcon = <TrendingDown className="w-4 h-4" />;
      trendColor = 'text-red-500';
      trendText = `${change.toFixed(1)}%`;
    }
  }

  // Target progress
  const progress = target ? Math.min((value / target) * 100, 100) : null;
  const isAboveTarget = target && value >= target;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-gray-900 dark:text-white">
        {chart.options?.prefix}{formattedValue}{chart.options?.suffix}
      </div>

      {chart.options?.showTrend && comparison !== undefined && (
        <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
          {trendIcon}
          <span className="text-sm font-medium">{trendText}</span>
          <span className="text-xs text-gray-400 ml-1">vs previous</span>
        </div>
      )}

      {target && (
        <div className="w-full max-w-[200px] mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Target: {target}</span>
            <span className={isAboveTarget ? 'text-green-500' : 'text-gray-500'}>
              {isAboveTarget ? '✓ Achieved' : `${progress?.toFixed(0)}%`}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isAboveTarget ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Column Chart (Vertical Bars)
const ColumnChartComponent = ({ chart, data }) => {
  const chartData = normalizeToArray(data);
  const options = chart.options || {};

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {options.showLegend !== false && <Legend />}
        <Bar
          dataKey="value"
          fill={CHART_COLORS[0]}
          radius={[4, 4, 0, 0]}
          label={options.showDataLabels ? { position: 'top', fontSize: 11 } : false}
        />
        {chart.target?.showLine && (
          <ReferenceLine y={chart.target.value} stroke="#ef4444" strokeDasharray="5 5" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

// Bar Chart (Horizontal Bars)
const BarChartComponent = ({ chart, data }) => {
  const chartData = normalizeToArray(data);
  const options = chart.options || {};

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11 }}
          width={100}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {options.showLegend !== false && <Legend />}
        <Bar
          dataKey="value"
          fill={CHART_COLORS[0]}
          radius={[0, 4, 4, 0]}
          label={options.showDataLabels ? { position: 'right', fontSize: 11 } : false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Line Chart
const LineChartComponent = ({ chart, data }) => {
  const chartData = normalizeToArray(data);
  const options = chart.options || {};

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsLine data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {options.showLegend !== false && <Legend />}
        <Line
          type={options.smooth !== false ? 'monotone' : 'linear'}
          dataKey="value"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={options.showPoints !== false ? { r: 4 } : false}
          activeDot={{ r: 6 }}
        />
      </RechartsLine>
    </ResponsiveContainer>
  );
};

// Area Chart
const AreaChartComponent = ({ chart, data }) => {
  const chartData = normalizeToArray(data);
  const options = chart.options || {};

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {options.showLegend !== false && <Legend />}
        <Area
          type={options.smooth !== false ? 'monotone' : 'linear'}
          dataKey="value"
          stroke={CHART_COLORS[0]}
          fill={`${CHART_COLORS[0]}40`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Donut Chart
const DonutChartComponent = ({ chart, data }) => {
  const chartData = normalizeToArray(data);
  const options = chart.options || {};
  const total = chartData.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsPie>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={2}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {options.showLegend !== false && <Legend />}
        {options.showCenterText && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-900 dark:fill-white"
          >
            <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold">
              {total.toLocaleString()}
            </tspan>
            <tspan x="50%" dy="1.5em" fontSize="12" className="fill-gray-500">
              Total
            </tspan>
          </text>
        )}
      </RechartsPie>
    </ResponsiveContainer>
  );
};

// Combo Chart (Column + Line)
const ComboChartComponent = ({ chart, data }) => {
  const chartData = normalizeToArray(data);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="count" stroke={CHART_COLORS[1]} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Table Component
const TableComponent = ({ chart, data }) => {
  const tableData = normalizeToArray(data);

  if (tableData.length === 0) {
    return <div className="p-5 text-gray-500 dark:text-gray-400">No data available</div>;
  }

  // Get columns from chart options or auto-generate from data keys
  const allKeys = Object.keys(tableData[0]).filter(key => key !== '_id');

  // Use chart.options.columns only if it's a non-empty array
  const configuredColumns = chart.options?.columns;
  const columns = (Array.isArray(configuredColumns) && configuredColumns.length > 0)
    ? configuredColumns
    : allKeys.map(key => ({
        field: key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
      }));

  return (
    <div className="overflow-auto h-full">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0">
          <tr className="bg-gray-100 dark:bg-neutral-800">
            {columns.map(col => (
              <th
                key={col.field}
                className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-neutral-700 whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, i) => (
            <tr
              key={i}
              className={`${i % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-gray-50 dark:bg-neutral-800/50'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
            >
              {columns.map(col => (
                <td
                  key={col.field}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-neutral-800"
                >
                  {row[col.field] !== undefined ? String(row[col.field]) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Heatmap Component
const HeatmapComponent = ({ chart, data }) => {
  const heatmapData = normalizeToArray(data);
  const maxValue = Math.max(...heatmapData.map(d => d.value || 0), 1);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create grid data
  const grid = {};
  heatmapData.forEach(d => {
    const key = `${d.day || d.dayOfWeek}-${d.hour}`;
    grid[key] = d.value || 0;
  });

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[600px]">
        <div className="flex">
          <div className="w-12" /> {/* Spacer for day labels */}
          <div className="flex-1 flex justify-between px-1 text-[10px] text-gray-500 mb-1">
            {hours.filter(h => h % 3 === 0).map(h => (
              <span key={h}>{h}:00</span>
            ))}
          </div>
        </div>
        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center mb-1">
            <div className="w-12 text-xs text-gray-500 text-right pr-2">{day}</div>
            <div className="flex-1 flex gap-0.5">
              {hours.map(hour => {
                const value = grid[`${dayIndex + 1}-${hour}`] || 0;
                const intensity = value / maxValue;
                return (
                  <div
                    key={hour}
                    className="flex-1 aspect-square rounded-sm"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, intensity)})`,
                    }}
                    title={`${day} ${hour}:00 - ${value}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Gauge Chart Component
const GaugeChartComponent = ({ chart, data }) => {
  const value = typeof data === 'object' ? data.value : data;
  const min = chart.options?.gaugeMin || 0;
  const max = chart.options?.gaugeMax || 100;
  const percentage = ((value - min) / (max - min)) * 100;

  const gaugeData = [
    { name: 'value', value: percentage, fill: CHART_COLORS[0] },
    { name: 'empty', value: 100 - percentage, fill: '#e5e7eb' }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-full max-w-[200px] aspect-square">
        <ResponsiveContainer width="100%" height={280}>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={gaugeData}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar dataKey="value" cornerRadius={5} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatValue(value, chart.options?.format)}
          </span>
          {chart.target?.value && (
            <span className="text-sm text-gray-500">
              Target: {chart.target.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to normalize data for charts that expect arrays
// When viewBy === 'none', backend returns {value, count} instead of [{name, value}]
function normalizeToArray(data, defaultName = 'Total') {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'value' in data) {
    return [{ name: defaultName, value: data.value, count: data.count }];
  }
  return [];
}

// Helper functions
function formatValue(value, format, decimals = 1) {
  if (value === null || value === undefined) return 'N/A';

  switch (format) {
    case 'percentage':
      return `${Number(value).toFixed(decimals)}%`;
    case 'currency':
      return `$${Number(value).toLocaleString()}`;
    case 'duration':
      const mins = Math.round(value / 60000);
      const hours = Math.floor(mins / 60);
      if (hours > 0) return `${hours}h ${mins % 60}m`;
      return `${mins}m`;
    default:
      return typeof value === 'number'
        ? value.toLocaleString(undefined, { maximumFractionDigits: decimals })
        : value;
  }
}

function formatCellValue(value, format) {
  if (value === null || value === undefined) return '-';
  if (format === 'percentage') return `${Number(value).toFixed(1)}%`;
  if (format === 'number') return Number(value).toLocaleString();
  if (format === 'date') return new Date(value).toLocaleDateString();
  return value;
}

export default ChartRenderer;
