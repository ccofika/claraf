import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  RefreshCw, Download, Settings, Trash2, Copy, GripVertical,
  Loader2, Calendar, Filter, MoreHorizontal, Edit3, Maximize2,
  FileImage, FileText, FileSpreadsheet, ChevronDown, X, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Chart components
import ChartRenderer from './Charts/ChartRenderer';
import DateRangePicker from './Filters/DateRangePicker';
import FilterPills from './Filters/FilterPills';

// Custom grid styles
const gridStyles = `
  .react-grid-item > .react-resizable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    z-index: 10;
  }
  .react-grid-item > .react-resizable-handle::after {
    content: '';
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 8px;
    height: 8px;
    border-right: 2px solid rgba(0, 0, 0, 0.2);
    border-bottom: 2px solid rgba(0, 0, 0, 0.2);
  }
  .react-grid-item > .react-resizable-handle-sw { bottom: 0; left: 0; cursor: sw-resize; transform: rotate(90deg); }
  .react-grid-item > .react-resizable-handle-se { bottom: 0; right: 0; cursor: se-resize; }
  .react-grid-item > .react-resizable-handle-nw { top: 0; left: 0; cursor: nw-resize; transform: rotate(180deg); }
  .react-grid-item > .react-resizable-handle-ne { top: 0; right: 0; cursor: ne-resize; transform: rotate(270deg); }
  .react-grid-item > .react-resizable-handle-w,
  .react-grid-item > .react-resizable-handle-e { top: 50%; margin-top: -10px; cursor: ew-resize; }
  .react-grid-item > .react-resizable-handle-w { left: 0; }
  .react-grid-item > .react-resizable-handle-e { right: 0; }
  .react-grid-item > .react-resizable-handle-n,
  .react-grid-item > .react-resizable-handle-s { left: 50%; margin-left: -10px; cursor: ns-resize; }
  .react-grid-item > .react-resizable-handle-n { top: 0; }
  .react-grid-item > .react-resizable-handle-s { bottom: 0; }
  .react-grid-item.react-grid-placeholder {
    background: rgba(59, 130, 246, 0.2);
    border: 2px dashed rgba(59, 130, 246, 0.5);
    border-radius: 12px;
  }
  .react-grid-item.react-draggable-dragging {
    opacity: 0.9;
    z-index: 100;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  }
`;

const ReportView = ({
  report,
  metadata,
  onEditChart,
  onDeleteChart,
  onUpdateReport,
  onRefresh
}) => {
  const API_URL = process.env.REACT_APP_API_URL;
  const gridRef = useRef(null);

  // State
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gridWidth, setGridWidth] = useState(1200);
  const [openChartMenu, setOpenChartMenu] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterEditor, setShowFilterEditor] = useState(false);

  // Fetch all chart data when report changes
  useEffect(() => {
    if (report?.charts?.length > 0) {
      fetchAllChartData();
    } else {
      setLoading(false);
      setChartData({});
    }
  }, [report?._id, report?.updatedAt]);

  // Update grid width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (gridRef.current) {
        const newWidth = gridRef.current.clientWidth;
        if (newWidth > 0 && newWidth !== gridWidth) {
          setGridWidth(newWidth);
        }
      }
    };

    // Initial measurement after render
    updateWidth();
    const timer = setTimeout(updateWidth, 50);
    const timer2 = setTimeout(updateWidth, 200);

    // Listen for resize
    window.addEventListener('resize', updateWidth);

    // Use ResizeObserver for more accurate detection
    let resizeObserver;
    if (gridRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(gridRef.current);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateWidth);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [loading]);

  const fetchAllChartData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/reports/${report._id}/data`);
      setChartData(res.data.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleChartData = async (chartId) => {
    try {
      const res = await axios.get(`${API_URL}/api/reports/charts/${chartId}/data`);
      setChartData(prev => ({
        ...prev,
        [chartId]: { data: res.data.data.chartData, error: null }
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData(prev => ({
        ...prev,
        [chartId]: { data: null, error: error.message }
      }));
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await fetchAllChartData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleRefreshChart = async (chartId) => {
    await fetchSingleChartData(chartId);
    toast.success('Chart refreshed');
  };

  const handleLayoutChange = async (layout) => {
    if (!report.canEdit) return;

    const layouts = layout.map(l => ({
      chartId: l.i,
      layout: { x: l.x, y: l.y, w: l.w, h: l.h }
    }));

    try {
      await axios.put(`${API_URL}/api/reports/${report._id}/charts/layouts`, { layouts });
    } catch (error) {
      console.error('Error saving layouts:', error);
    }
  };

  const handleDateRangeChange = (newDateRange) => {
    onUpdateReport({ dateRange: newDateRange });
    setShowDatePicker(false);
    // Re-fetch data with new date range
    setTimeout(fetchAllChartData, 100);
  };

  // Export functions
  const exportChartToPNG = async (chartId) => {
    const element = document.getElementById(`chart-${chartId}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `chart-${chartId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Exported as PNG');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const exportChartToPDF = async (chartId) => {
    const element = document.getElementById(`chart-${chartId}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`chart-${chartId}.pdf`);
      toast.success('Exported as PDF');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const exportChartToCSV = (chart) => {
    const data = chartData[chart._id]?.data;
    if (!data) return;

    let csv = '';
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      csv = headers.join(',') + '\n';
      data.forEach(row => {
        csv += headers.map(h => JSON.stringify(row[h] || '')).join(',') + '\n';
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = `${chart.title}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success('Exported as CSV');
  };

  const exportAllToPDF = async () => {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      let first = true;

      for (const chart of (report.charts || [])) {
        const element = document.getElementById(`chart-${chart._id}`);
        if (!element) continue;

        if (!first) pdf.addPage();
        first = false;

        const canvas = await html2canvas(element, { backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, 190));
      }

      pdf.save(`${report.title}.pdf`);
      toast.success('Report exported as PDF');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  // Get layout for GridLayout
  const getLayout = () => {
    return (report.charts || []).map(chart => ({
      i: chart._id,
      x: chart.layout?.x ?? 0,
      y: chart.layout?.y ?? 0,
      w: chart.layout?.w ?? 6,
      h: chart.layout?.h ?? 4,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 10
    }));
  };

  // Get date range label
  const getDateRangeLabel = () => {
    const type = report.dateRange?.type;
    const option = metadata?.dateRangeOptions?.find(o => o.value === type);
    return option?.label || 'All Time';
  };

  if (!report) return null;

  return (
    <div className="flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: gridStyles }} />

      {/* Report toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          {/* Date range selector */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300"
            >
              <Calendar className="w-4 h-4" />
              {getDateRangeLabel()}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showDatePicker && (
              <DateRangePicker
                value={report.dateRange}
                options={metadata?.dateRangeOptions || []}
                onChange={handleDateRangeChange}
                onClose={() => setShowDatePicker(false)}
              />
            )}
          </div>

          {/* Filter pills */}
          {report.filters?.conditions?.length > 0 && (
            <FilterPills
              filters={report.filters}
              metadata={metadata}
              onEdit={() => setShowFilterEditor(true)}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50"
            title="Refresh all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export button */}
          <button
            onClick={exportAllToPDF}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
            title="Export report as PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Charts grid */}
      <div ref={gridRef}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !report.charts?.length ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 border-dashed">
            <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No charts yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Click "Add Chart" to create your first visualization
            </p>
          </div>
        ) : (
          <GridLayout
            layout={getLayout()}
            cols={12}
            rowHeight={80}
            width={gridWidth || 1200}
            onLayoutChange={handleLayoutChange}
            isDraggable={report.canEdit}
            isResizable={report.canEdit}
            draggableHandle=".drag-handle"
            margin={[12, 12]}
            containerPadding={[0, 12]}
            compactType="vertical"
            preventCollision={false}
            resizeHandles={['se']}
          >
            {(report.charts || []).map(chart => (
              <div
                key={chart._id}
                id={`chart-${chart._id}`}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm"
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {/* Chart header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {report.canEdit && (
                      <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {chart.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRefreshChart(chart._id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                      title="Refresh"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Chart menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenChartMenu(openChartMenu === chart._id ? null : chart._id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {openChartMenu === chart._id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenChartMenu(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700 py-1 min-w-[140px]">
                            {report.canEdit && (
                              <button
                                onClick={() => {
                                  onEditChart(chart);
                                  setOpenChartMenu(null);
                                }}
                                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => {
                                exportChartToPNG(chart._id);
                                setOpenChartMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <FileImage className="w-3.5 h-3.5" />
                              Export PNG
                            </button>
                            <button
                              onClick={() => {
                                exportChartToPDF(chart._id);
                                setOpenChartMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Export PDF
                            </button>
                            <button
                              onClick={() => {
                                exportChartToCSV(chart);
                                setOpenChartMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              Export CSV
                            </button>
                            {report.canEdit && (
                              <>
                                <div className="border-t border-gray-200 dark:border-neutral-700 my-1" />
                                <button
                                  onClick={() => {
                                    onDeleteChart(chart._id);
                                    setOpenChartMenu(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chart content */}
                <div className="p-4" style={{ flex: 1, minHeight: '150px', overflow: 'hidden' }}>
                  <ChartRenderer
                    chart={chart}
                    data={chartData[chart._id]?.data}
                    error={chartData[chart._id]?.error}
                    loading={!chartData[chart._id]}
                  />
                </div>
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  );
};

export default ReportView;
