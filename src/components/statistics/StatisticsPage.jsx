import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Plus, Download, Settings, RefreshCw, LayoutGrid, List,
  MoreHorizontal, Trash2, Copy, Edit3, Star, StarOff,
  ChevronDown, Filter, Calendar, Share2, FileText,
  BarChart3, Loader2, FolderPlus, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

// Sub-components (will be created)
import ReportsList from './ReportsList';
import ReportView from './ReportView';
import ReportEditor from './ReportEditor';
import ChartBuilder from './ChartBuilder/ChartBuilder';

const StatisticsPage = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // View state
  const [view, setView] = useState('list'); // 'list', 'report', 'edit'
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Data state
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [showChartBuilder, setShowChartBuilder] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchMetadata();
    fetchReports();
  }, []);

  // Fetch report when selected
  useEffect(() => {
    if (selectedReportId) {
      fetchReport(selectedReportId);
    }
  }, [selectedReportId]);

  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports/metadata`);
      setMetadata(res.data.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      toast.error('Failed to load metadata');
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports`);
      setReports(res.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/reports/${id}`);
      setCurrentReport(res.data.data);
      setView('report');
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/api/reports`, data);
      toast.success('Report created');
      setReports([res.data.data, ...reports]);
      setSelectedReportId(res.data.data._id);
      setShowNewReportDialog(false);
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
    }
  };

  const updateReport = async (id, data) => {
    try {
      const res = await axios.put(`${API_URL}/api/reports/${id}`, data);
      setCurrentReport(res.data.data);
      setReports(reports.map(r => r._id === id ? res.data.data : r));
      toast.success('Report updated');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/reports/${id}`);
      setReports(reports.filter(r => r._id !== id));
      if (selectedReportId === id) {
        setSelectedReportId(null);
        setCurrentReport(null);
        setView('list');
      }
      toast.success('Report deleted');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const duplicateReport = async (id) => {
    try {
      const res = await axios.post(`${API_URL}/api/reports/${id}/duplicate`);
      setReports([res.data.data, ...reports]);
      toast.success('Report duplicated');
    } catch (error) {
      console.error('Error duplicating report:', error);
      toast.error('Failed to duplicate report');
    }
  };

  const togglePin = async (id) => {
    const report = reports.find(r => r._id === id);
    try {
      await axios.put(`${API_URL}/api/reports/${id}`, { isPinned: !report.isPinned });
      setReports(reports.map(r =>
        r._id === id ? { ...r, isPinned: !r.isPinned } : r
      ).sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }));
      toast.success(report.isPinned ? 'Unpinned' : 'Pinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  // Chart operations
  const addChart = async (chartData) => {
    if (!currentReport) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/reports/${currentReport._id}/charts`,
        chartData
      );
      setCurrentReport({
        ...currentReport,
        charts: [...currentReport.charts, res.data.data]
      });
      setShowChartBuilder(false);
      toast.success('Chart added');
    } catch (error) {
      console.error('Error adding chart:', error);
      toast.error('Failed to add chart');
    }
  };

  const updateChart = async (chartId, chartData) => {
    if (!currentReport) return;
    try {
      await axios.put(
        `${API_URL}/api/reports/${currentReport._id}/charts/${chartId}`,
        chartData
      );
      // Re-fetch the full report to get updated chart data
      await fetchReport(currentReport._id);
      setEditingChart(null);
      setShowChartBuilder(false);
      toast.success('Chart updated');
    } catch (error) {
      console.error('Error updating chart:', error);
      toast.error('Failed to update chart');
    }
  };

  const deleteChart = async (chartId) => {
    if (!currentReport) return;
    if (!window.confirm('Delete this chart?')) return;
    try {
      await axios.delete(
        `${API_URL}/api/reports/${currentReport._id}/charts/${chartId}`
      );
      setCurrentReport({
        ...currentReport,
        charts: currentReport.charts.filter(c => c._id !== chartId)
      });
      toast.success('Chart deleted');
    } catch (error) {
      console.error('Error deleting chart:', error);
      toast.error('Failed to delete chart');
    }
  };

  const handleEditChart = (chart) => {
    setEditingChart(chart);
    setShowChartBuilder(true);
  };

  const handleChartBuilderSave = (chartData) => {
    if (editingChart) {
      updateChart(editingChart._id, chartData);
    } else {
      addChart(chartData);
    }
  };

  const handleChartBuilderClose = () => {
    setShowChartBuilder(false);
    setEditingChart(null);
  };

  // Render
  if (loading && !reports.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex items-center gap-4">
          {view !== 'list' && (
            <button
              onClick={() => {
                setView('list');
                setSelectedReportId(null);
                setCurrentReport(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {view === 'list' ? 'Statistics & Reports' : currentReport?.title || 'Report'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {view === 'report' && currentReport?.canEdit && (
            <>
              <button
                onClick={() => setShowChartBuilder(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
                Add Chart
              </button>
              <button
                onClick={() => setView('edit')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

          {view === 'list' && (
            <button
              onClick={() => setShowNewReportDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
              New Report
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 dark:bg-neutral-900">
        {view === 'list' && (
          <ReportsList
            reports={reports}
            onSelectReport={(id) => setSelectedReportId(id)}
            onDeleteReport={deleteReport}
            onDuplicateReport={duplicateReport}
            onTogglePin={togglePin}
            onCreateReport={() => setShowNewReportDialog(true)}
          />
        )}

        {view === 'report' && currentReport && (
          <ReportView
            report={currentReport}
            metadata={metadata}
            onEditChart={handleEditChart}
            onDeleteChart={deleteChart}
            onUpdateReport={(data) => updateReport(currentReport._id, data)}
            onRefresh={() => fetchReport(currentReport._id)}
          />
        )}

        {view === 'edit' && currentReport && (
          <ReportEditor
            report={currentReport}
            metadata={metadata}
            onSave={(data) => {
              updateReport(currentReport._id, data);
              setView('report');
            }}
            onCancel={() => setView('report')}
          />
        )}
      </div>

      {/* New Report Dialog */}
      {showNewReportDialog && (
        <NewReportDialog
          onClose={() => setShowNewReportDialog(false)}
          onCreate={createReport}
        />
      )}

      {/* Chart Builder Modal */}
      {showChartBuilder && (
        <ChartBuilder
          chart={editingChart}
          metadata={metadata}
          reportFilters={currentReport?.filters}
          reportDateRange={currentReport?.dateRange}
          onSave={handleChartBuilderSave}
          onClose={handleChartBuilderClose}
        />
      )}
    </div>
  );
};

// New Report Dialog Component
const NewReportDialog = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setLoading(true);
    await onCreate({ title, description });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Report
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Report Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Performance Dashboard"
              className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this report tracks..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatisticsPage;
