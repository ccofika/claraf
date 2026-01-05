import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Plus, Download, Trash2, Settings, User, ChevronDown, RefreshCw,
  BarChart3, PieChart, LineChart, TrendingUp, Table, Activity, Grid3X3,
  X, Check, Eye, Copy, FileImage, FileText, FileSpreadsheet,
  GripVertical, Maximize2, Minimize2, Save, Loader2
} from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp, modalOverlay, modalContent, scaleIn, duration, easing } from '../utils/animations';
import {
  PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart as RechartsLine, Line,
  AreaChart, Area,
  ComposedChart
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CHART_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

// Custom CSS for react-grid-layout resize handles
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
    border-right: 2px solid rgba(0, 0, 0, 0.3);
    border-bottom: 2px solid rgba(0, 0, 0, 0.3);
  }
  .react-grid-item > .react-resizable-handle-sw {
    bottom: 0;
    left: 0;
    cursor: sw-resize;
    transform: rotate(90deg);
  }
  .react-grid-item > .react-resizable-handle-se {
    bottom: 0;
    right: 0;
    cursor: se-resize;
  }
  .react-grid-item > .react-resizable-handle-nw {
    top: 0;
    left: 0;
    cursor: nw-resize;
    transform: rotate(180deg);
  }
  .react-grid-item > .react-resizable-handle-ne {
    top: 0;
    right: 0;
    cursor: ne-resize;
    transform: rotate(270deg);
  }
  .react-grid-item > .react-resizable-handle-w,
  .react-grid-item > .react-resizable-handle-e {
    top: 50%;
    margin-top: -10px;
    cursor: ew-resize;
  }
  .react-grid-item > .react-resizable-handle-w {
    left: 0;
  }
  .react-grid-item > .react-resizable-handle-e {
    right: 0;
  }
  .react-grid-item > .react-resizable-handle-n,
  .react-grid-item > .react-resizable-handle-s {
    left: 50%;
    margin-left: -10px;
    cursor: ns-resize;
  }
  .react-grid-item > .react-resizable-handle-n {
    top: 0;
  }
  .react-grid-item > .react-resizable-handle-s {
    bottom: 0;
  }
  .react-grid-item.react-grid-placeholder {
    background: rgba(59, 130, 246, 0.2);
    border: 2px dashed rgba(59, 130, 246, 0.5);
    border-radius: 12px;
  }
  .react-grid-item.react-draggable-dragging {
    opacity: 0.8;
    z-index: 100;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  }
`;

const CHART_TYPES = [
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'area', label: 'Area Chart', icon: TrendingUp },
  { value: 'table', label: 'Table', icon: Table },
  { value: 'kpi', label: 'KPI Card', icon: Activity },
  { value: 'heatmap', label: 'Heatmap', icon: Grid3X3 }
];

const TIME_RANGES = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'all', label: 'All Time' }
];

const QAStatistics = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;
  const gridRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cards, setCards] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [statisticsUsers, setStatisticsUsers] = useState([]);
  const [viewingUserId, setViewingUserId] = useState(null); // null = own cards
  const [isViewMode, setIsViewMode] = useState(false);

  // Builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderData, setBuilderData] = useState({
    title: '',
    chartType: 'bar',
    metric: '',
    agentType: 'cs', // 'cs' or 'qa'
    timeRange: 'last30days',
    filters: [],
    groupBy: 'agent', // Default to grouping by agent for charts
    aggregation: 'avg'
  });
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Template dialog
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  // Export dialog
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportCardId, setExportCardId] = useState(null);

  // Auto refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes

  // Fetch initial data
  useEffect(() => {
    fetchMetadata();
    fetchTemplates();
    fetchStatisticsUsers();
  }, []);

  useEffect(() => {
    fetchCards();
  }, [viewingUserId]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAllCards();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/qa/statistics/metadata`);
      setMetadata(res.data.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      toast.error('Failed to load metadata');
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/qa/statistics/templates`);
      setTemplates(res.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchStatisticsUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/qa/statistics/users`);
      setStatisticsUsers(res.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCards = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/qa/statistics/cards`;
      if (viewingUserId) {
        url = `${API_URL}/api/qa/statistics/user/${viewingUserId}`;
      }
      const res = await axios.get(url);
      const cardsWithData = await Promise.all(
        res.data.data.map(async (card) => {
          const data = await fetchCardData(card._id);
          return { ...card, chartData: data };
        })
      );
      setCards(cardsWithData);
      setIsViewMode(!!viewingUserId);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchCardData = async (cardId) => {
    try {
      const res = await axios.post(`${API_URL}/api/qa/statistics/cards/${cardId}/data`);
      return res.data.data;
    } catch (error) {
      console.error('Error fetching card data:', error);
      return null;
    }
  };

  const refreshAllCards = async () => {
    const updatedCards = await Promise.all(
      cards.map(async (card) => {
        const data = await fetchCardData(card._id);
        return { ...card, chartData: data };
      })
    );
    setCards(updatedCards);
    toast.success('Data refreshed');
  };

  const refreshCard = async (cardId) => {
    const data = await fetchCardData(cardId);
    setCards(cards.map(c => c._id === cardId ? { ...c, chartData: data } : c));
  };

  const handlePreview = async () => {
    if (!builderData.metric) {
      toast.error('Please select a metric');
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/qa/statistics/cards/preview/data`, {
        metric: builderData.metric,
        agentType: builderData.agentType,
        timeRange: { type: builderData.timeRange },
        conditions: [], // Simplified - no filters for now
        groupBy: builderData.groupBy || 'none',
        aggregation: builderData.aggregation || 'count'
      });
      console.log('Preview data:', res.data); // Debug log
      setPreviewData(res.data.data);
    } catch (error) {
      console.error('Error previewing:', error);
      toast.error('Failed to preview data: ' + (error.response?.data?.message || error.message));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSaveCard = async () => {
    if (!builderData.title || !builderData.metric) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const cardData = {
        title: builderData.title,
        chartType: builderData.chartType,
        metric: builderData.metric,
        agentType: builderData.agentType,
        timeRange: { type: builderData.timeRange },
        conditions: [], // Simplified - no filters for now
        groupBy: builderData.groupBy || 'agent',
        aggregation: builderData.aggregation || 'avg',
        layout: {
          x: 0,
          y: Infinity, // Place at bottom
          w: 6,
          h: 4,
          minW: 3,
          minH: 2
        }
      };

      if (editingCard) {
        await axios.put(`${API_URL}/api/qa/statistics/cards/${editingCard._id}`, cardData);
        toast.success('Card updated');
      } else {
        await axios.post(`${API_URL}/api/qa/statistics/cards`, cardData);
        toast.success('Card created');
      }
      resetBuilder();
      fetchCards();
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    try {
      await axios.delete(`${API_URL}/api/qa/statistics/cards/${cardId}`);
      setCards(cards.filter(c => c._id !== cardId));
      toast.success('Card deleted');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setBuilderData({
      title: card.title,
      chartType: card.chartType,
      metric: card.metric,
      agentType: card.agentType || 'cs',
      timeRange: card.timeRange?.type || 'last30days',
      filters: card.conditions || [],
      groupBy: card.groupBy || '',
      aggregation: card.aggregation || 'count'
    });
    setShowBuilder(true);
  };

  const handleDuplicateCard = async (card) => {
    try {
      const newCard = {
        title: `${card.title} (Copy)`,
        chartType: card.chartType,
        metric: card.metric,
        agentType: card.agentType,
        timeRange: card.timeRange,
        conditions: card.conditions,
        groupBy: card.groupBy,
        aggregation: card.aggregation,
        layout: {
          ...card.layout,
          y: Infinity
        }
      };
      await axios.post(`${API_URL}/api/qa/statistics/cards`, newCard);
      toast.success('Card duplicated');
      fetchCards();
    } catch (error) {
      console.error('Error duplicating card:', error);
      toast.error('Failed to duplicate card');
    }
  };

  const handleCreateFromTemplate = async (template) => {
    try {
      await axios.post(`${API_URL}/api/qa/statistics/from-template`, {
        templateId: template.id
      });
      toast.success(`Created: ${template.title}`);
      fetchCards();
      setShowTemplateDialog(false);
    } catch (error) {
      console.error('Error creating from template:', error);
      toast.error('Failed to create from template');
    }
  };

  const handleLayoutChange = async (layout) => {
    if (isViewMode) return;

    const updates = layout.map(l => ({
      id: l.i,
      layout: { x: l.x, y: l.y, w: l.w, h: l.h }
    }));

    try {
      await axios.put(`${API_URL}/api/qa/statistics/layouts`, { updates });
    } catch (error) {
      console.error('Error saving layouts:', error);
    }
  };

  const resetBuilder = () => {
    setBuilderData({
      title: '',
      chartType: 'bar',
      metric: '',
      agentType: 'cs',
      timeRange: 'last30days',
      filters: [],
      groupBy: 'agent',
      aggregation: 'avg'
    });
    setPreviewData(null);
    setEditingCard(null);
    setShowBuilder(false);
  };

  // Export functions
  const exportToPNG = async (cardId) => {
    const cardElement = document.getElementById(`card-${cardId}`);
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `statistic-${cardId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Exported as PNG');
    } catch (error) {
      console.error('Error exporting PNG:', error);
      toast.error('Failed to export');
    }
  };

  const exportToPDF = async (cardId) => {
    const cardElement = document.getElementById(`card-${cardId}`);
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, { backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`statistic-${cardId}.pdf`);
      toast.success('Exported as PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export');
    }
  };

  const exportToCSV = (card) => {
    if (!card.chartData) return;

    const data = card.chartData;
    let csv = '';

    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      csv = headers.join(',') + '\n';
      data.forEach(row => {
        csv += headers.map(h => JSON.stringify(row[h] || '')).join(',') + '\n';
      });
    } else if (typeof data === 'object') {
      csv = 'Key,Value\n';
      Object.entries(data).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = `${card.title}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success('Exported as CSV');
  };

  const exportAllToPDF = async () => {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      let first = true;

      for (const card of cards) {
        const cardElement = document.getElementById(`card-${card._id}`);
        if (!cardElement) continue;

        if (!first) pdf.addPage();
        first = false;

        const canvas = await html2canvas(cardElement, { backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, 190));
      }

      pdf.save('all-statistics.pdf');
      toast.success('Exported all cards as PDF');
    } catch (error) {
      console.error('Error exporting all:', error);
      toast.error('Failed to export');
    }
  };

  // Get metrics based on agent type
  const getMetricsForAgentType = (type) => {
    if (!metadata || !metadata.metrics || !Array.isArray(metadata.metrics)) return [];
    if (type === 'qa') {
      return metadata.metrics.filter(m => m && m.value && m.value.startsWith('grader'));
    }
    return metadata.metrics.filter(m => m && m.value && !m.value.startsWith('grader'));
  };

  // Add filter condition
  const addFilter = () => {
    setBuilderData(prev => ({
      ...prev,
      filters: [...prev.filters, { field: '', operator: 'equals', value: '', logic: 'AND' }]
    }));
  };

  const removeFilter = (index) => {
    setBuilderData(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const updateFilter = (index, key, value) => {
    setBuilderData(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => i === index ? { ...f, [key]: value } : f)
    }));
  };

  // Render chart based on type
  const renderChart = (card) => {
    const data = card.chartData;
    if (!data) return <div className="flex items-center justify-center h-full text-gray-400">No data</div>;

    switch (card.chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={Array.isArray(data) ? data : []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {(Array.isArray(data) ? data : []).map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Array.isArray(data) ? data : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={Array.isArray(data) ? data : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </RechartsLine>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={Array.isArray(data) ? data : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f680" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'kpi':
        const kpiValue = typeof data === 'object' && !Array.isArray(data)
          ? data.value || data.total || Object.values(data)[0]
          : data;
        const kpiLabel = typeof data === 'object' && !Array.isArray(data)
          ? data.label || card.title
          : card.title;
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl font-bold text-gray-900 dark:text-white">
              {typeof kpiValue === 'number' ? kpiValue.toLocaleString() : kpiValue}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">{kpiLabel}</div>
            {data.change !== undefined && (
              <div className={`text-sm mt-1 ${data.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.change >= 0 ? '+' : ''}{data.change}%
              </div>
            )}
          </div>
        );

      case 'table':
        if (!Array.isArray(data) || data.length === 0) {
          return <div className="flex items-center justify-center h-full text-gray-400">No data</div>;
        }
        const columns = Object.keys(data[0]);
        return (
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800 sticky top-0">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    {columns.map(col => (
                      <td key={col} className="px-3 py-2 text-gray-900 dark:text-white">
                        {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'heatmap':
        // Simple heatmap representation
        if (!Array.isArray(data)) return <div className="text-gray-400">Invalid data format</div>;
        const maxValue = Math.max(...data.map(d => d.value || 0));
        return (
          <div className="grid grid-cols-7 gap-1 p-2 h-full">
            {data.map((d, i) => (
              <div
                key={i}
                className="rounded-sm flex items-center justify-center text-xs"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${(d.value || 0) / maxValue})`,
                  aspectRatio: '1'
                }}
                title={`${d.name}: ${d.value}`}
              >
                {d.value}
              </div>
            ))}
          </div>
        );

      default:
        return <div className="text-gray-400">Unknown chart type</div>;
    }
  };

  // Get grid layouts - simple array format for GridLayout
  const getGridLayout = () => {
    return cards.map(card => ({
      i: card._id,
      x: card.layout?.x ?? 0,
      y: card.layout?.y ?? 0,
      w: card.layout?.w ?? 6,
      h: card.layout?.h ?? 4,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 8
    }));
  };

  // Calculate grid width based on container
  const [gridWidth, setGridWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (gridRef.current) {
        const newWidth = gridRef.current.offsetWidth;
        if (newWidth > 0) {
          setGridWidth(newWidth);
        }
      }
    };
    // Initial update with small delay to ensure DOM is ready
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration.normal }}
    >
      {/* Custom grid styles */}
      <style dangerouslySetInnerHTML={{ __html: gridStyles }} />

      {/* Header with user switching */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>

          {/* User switching cards */}
          <div className="flex gap-2 ml-4">
            {statisticsUsers.map((u, index) => (
              <motion.button
                key={u._id}
                onClick={() => setViewingUserId(u._id === user._id ? null : u._id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                  ${(viewingUserId === u._id || (!viewingUserId && u._id === user._id))
                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-neutral-900 dark:text-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                  }
                `}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: duration.fast }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User className="w-4 h-4" />
                <span className="font-medium">{u.name}'s Statistics</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`
              p-2 rounded-lg border transition-colors
              ${autoRefresh
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-400'
              }
            `}
            title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>

          {/* Manual refresh */}
          <button
            onClick={refreshAllCards}
            className="p-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-800"
            title="Refresh all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Export all */}
          <button
            onClick={exportAllToPDF}
            className="p-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-800"
            title="Export all as PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {!isViewMode && (
            <>
              {/* Templates button */}
              <button
                onClick={() => setShowTemplateDialog(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
              >
                <Copy className="w-4 h-4" />
                Templates
              </button>

              {/* Add card button */}
              <button
                onClick={() => setShowBuilder(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Viewing mode indicator */}
      {isViewMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Eye className="w-4 h-4" />
            <span>Viewing {statisticsUsers.find(u => u._id === viewingUserId)?.name}'s statistics (read-only)</span>
          </div>
          <button
            onClick={() => setViewingUserId(null)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            Back to my statistics
          </button>
        </div>
      )}

      {/* Statistics Grid */}
      {cards.length > 0 ? (
        <motion.div
          ref={gridRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, delay: 0.1 }}
        >
          <GridLayout
            layout={getGridLayout()}
            cols={12}
            rowHeight={80}
            width={gridWidth || 1200}
            onLayoutChange={(layout) => handleLayoutChange(layout)}
            isDraggable={!isViewMode}
            isResizable={!isViewMode}
            draggableHandle=".drag-handle"
            margin={[16, 16]}
            compactType="vertical"
            preventCollision={false}
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          >
          {cards.map(card => (
            <div
              key={card._id}
              id={`card-${card._id}`}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-2">
                  {!isViewMode && (
                    <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                  <h3 className="font-medium text-gray-900 dark:text-white">{card.title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
                    {TIME_RANGES.find(t => t.value === card.timeRange?.type)?.label || 'All Time'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => refreshCard(card._id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Export dropdown */}
                  <div className="relative group">
                    <button
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                      title="Export"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                      <button
                        onClick={() => exportToPNG(card._id)}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <FileImage className="w-3.5 h-3.5" /> PNG
                      </button>
                      <button
                        onClick={() => exportToPDF(card._id)}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button
                        onClick={() => exportToCSV(card)}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                      </button>
                    </div>
                  </div>

                  {!isViewMode && (
                    <>
                      <button
                        onClick={() => handleDuplicateCard(card)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditCard(card)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        title="Edit"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Card content */}
              <div className="flex-1 p-4 min-h-0">
                {renderChart(card)}
              </div>
            </div>
          ))}
          </GridLayout>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
          <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isViewMode ? 'No statistics yet' : 'Create your first statistic'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isViewMode
              ? 'This user has not created any statistics yet.'
              : 'Add cards to visualize your QA data with charts, tables, and KPIs.'}
          </p>
          {!isViewMode && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowTemplateDialog(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
              >
                <Copy className="w-4 h-4" />
                Use Template
              </button>
              <button
                onClick={() => setShowBuilder(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
                Create Custom
              </button>
            </div>
          )}
        </div>
      )}

      {/* Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCard ? 'Edit Statistic Card' : 'Create Statistic Card'}
              </h2>
              <button
                onClick={resetBuilder}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left side - Configuration */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Card Title *
                    </label>
                    <input
                      type="text"
                      value={builderData.title}
                      onChange={(e) => setBuilderData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                      placeholder="Enter card title..."
                    />
                  </div>

                  {/* Agent Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Agent Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBuilderData(prev => ({ ...prev, agentType: 'cs', metric: '' }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                          ${builderData.agentType === 'cs'
                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700'
                          }
                        `}
                      >
                        Customer Support Agents
                      </button>
                      <button
                        onClick={() => setBuilderData(prev => ({ ...prev, agentType: 'qa', metric: '' }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                          ${builderData.agentType === 'qa'
                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700'
                          }
                        `}
                      >
                        QA Agents (Graders)
                      </button>
                    </div>
                  </div>

                  {/* Chart Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Chart Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {CHART_TYPES.map(type => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setBuilderData(prev => ({ ...prev, chartType: type.value }))}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors
                              ${builderData.chartType === type.value
                                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400'
                              }
                            `}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metric */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metric *
                    </label>
                    <select
                      value={builderData.metric}
                      onChange={(e) => setBuilderData(prev => ({ ...prev, metric: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select metric...</option>
                      {getMetricsForAgentType(builderData.agentType).map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Range
                    </label>
                    <select
                      value={builderData.timeRange}
                      onChange={(e) => setBuilderData(prev => ({ ...prev, timeRange: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                    >
                      {TIME_RANGES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Group By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Group By
                    </label>
                    <select
                      value={builderData.groupBy}
                      onChange={(e) => setBuilderData(prev => ({ ...prev, groupBy: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                    >
                      <option value="none">No grouping (single value)</option>
                      <option value="agent">By CS Agent</option>
                      <option value="grader">By QA Agent (Grader)</option>
                      <option value="category">By Category</option>
                      <option value="priority">By Priority</option>
                      <option value="day">By Day</option>
                      <option value="week">By Week</option>
                      <option value="month">By Month</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Choose "No grouping" for KPI cards, or group data for charts
                    </p>
                  </div>
                </div>

                {/* Right side - Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Preview
                    </label>
                    <button
                      onClick={handlePreview}
                      disabled={previewLoading || !builderData.metric}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {previewLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Preview
                    </button>
                  </div>

                  <div className="h-80 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-center">
                    {previewData ? (
                      <div className="w-full h-full p-4">
                        {renderChart({ ...builderData, chartData: previewData })}
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-center">
                        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Configure your card and click Preview to see the chart</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
              <button
                onClick={resetBuilder}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCard}
                disabled={saving || !builderData.title || !builderData.metric}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingCard ? 'Update Card' : 'Create Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Choose a Template</h2>
              <button
                onClick={() => setShowTemplateDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Customer Support Agent Templates
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {templates.filter(t => t.category === 'cs-agent').map(template => {
                    const TypeIcon = CHART_TYPES.find(c => c.value === template.chartType)?.icon || BarChart3;
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleCreateFromTemplate(template)}
                        className="flex items-start gap-3 p-4 text-left border border-gray-200 dark:border-neutral-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                      >
                        <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                          <TypeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{template.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  QA Agent (Grader) Templates
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {templates.filter(t => t.category === 'qa-agent').map(template => {
                    const TypeIcon = CHART_TYPES.find(c => c.value === template.chartType)?.icon || BarChart3;
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleCreateFromTemplate(template)}
                        className="flex items-start gap-3 p-4 text-left border border-gray-200 dark:border-neutral-700 rounded-lg hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
                      >
                        <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-900/30">
                          <TypeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{template.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default QAStatistics;
