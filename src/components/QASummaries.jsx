import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  RefreshCw,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// Modal component - defined OUTSIDE to prevent re-creation on every render
const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div
        className="relative bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-neutral-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const QASummaries = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // State
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summaryDates, setSummaryDates] = useState([]);
  const [viewingSummary, setViewingSummary] = useState(null);
  const [copied, setCopied] = useState(false);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Dialog states
  const [editDialog, setEditDialog] = useState({ open: false, summary: null, content: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, summaryId: null });

  // Get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  // Fetch summaries for current month
  const fetchSummaries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/summaries?month=${calendarMonth + 1}&year=${calendarYear}`,
        getAuthHeaders()
      );
      setSummaries(response.data.summaries || []);
    } catch (error) {
      console.error('Failed to fetch summaries:', error);
      toast.error('Failed to load summaries');
    } finally {
      setLoading(false);
    }
  }, [API_URL, calendarMonth, calendarYear, getAuthHeaders]);

  // Fetch dates with summaries for calendar highlighting
  const fetchSummaryDates = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/summaries/dates?month=${calendarMonth + 1}&year=${calendarYear}`,
        getAuthHeaders()
      );
      setSummaryDates(response.data.dates || []);
    } catch (error) {
      console.error('Failed to fetch summary dates:', error);
    }
  }, [API_URL, calendarMonth, calendarYear, getAuthHeaders]);

  // Load data on mount and when calendar changes
  useEffect(() => {
    fetchSummaries();
    fetchSummaryDates();
  }, [fetchSummaries, fetchSummaryDates]);

  // Get Monday of current week
  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Check if date is selectable (within current week, up to today)
  const isDateSelectable = (date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const monday = getMondayOfWeek(today);
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0);
    return checkDate >= monday && checkDate <= today;
  };

  // Generate new summary
  const handleCreateSummary = async () => {
    if (!isDateSelectable(selectedDate)) {
      toast.error('Date must be within current week (Monday to today)');
      return;
    }

    try {
      setGenerating(true);
      // Use local date components to avoid timezone shift
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const response = await axios.post(
        `${API_URL}/api/qa/summaries`,
        { date: dateStr },
        getAuthHeaders()
      );
      setSummaries([response.data, ...summaries]);
      setViewingSummary(response.data);
      toast.success('Summary generated successfully!');
      fetchSummaryDates();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate summary';
      if (error.response?.data?.existingSummaryId) {
        toast.error(message);
        const existing = summaries.find(s => s._id === error.response.data.existingSummaryId);
        if (existing) setViewingSummary(existing);
      } else {
        toast.error(message);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Update summary
  const handleUpdateSummary = async () => {
    if (!editDialog.summary || !editDialog.content.trim()) return;

    try {
      const response = await axios.put(
        `${API_URL}/api/qa/summaries/${editDialog.summary._id}`,
        { content: editDialog.content },
        getAuthHeaders()
      );
      setSummaries(summaries.map(s => s._id === response.data._id ? response.data : s));
      if (viewingSummary?._id === response.data._id) {
        setViewingSummary(response.data);
      }
      setEditDialog({ open: false, summary: null, content: '' });
      toast.success('Summary updated!');
    } catch (error) {
      toast.error('Failed to update summary');
    }
  };

  // Delete summary
  const handleDeleteSummary = async () => {
    if (!deleteDialog.summaryId) return;

    try {
      await axios.delete(
        `${API_URL}/api/qa/summaries/${deleteDialog.summaryId}`,
        getAuthHeaders()
      );
      setSummaries(summaries.filter(s => s._id !== deleteDialog.summaryId));
      if (viewingSummary?._id === deleteDialog.summaryId) {
        setViewingSummary(null);
      }
      setDeleteDialog({ open: false, summaryId: null });
      toast.success('Summary deleted!');
      fetchSummaryDates();
    } catch (error) {
      toast.error('Failed to delete summary');
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Calendar navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  // Check if a date has a summary
  const getDateSummaries = (day) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return summaryDates.find(d => d.date === dateStr);
  };

  // Render calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateInfo = getDateSummaries(day);
      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === calendarMonth &&
        new Date().getFullYear() === calendarYear;
      const isSelected = selectedDate.getDate() === day &&
        selectedDate.getMonth() === calendarMonth &&
        selectedDate.getFullYear() === calendarYear;

      days.push(
        <button
          key={day}
          onClick={() => {
            const newDate = new Date(calendarYear, calendarMonth, day);
            setSelectedDate(newDate);
            // Find summary for this date (use UTC for comparison)
            const summary = summaries.find(s => {
              const sDate = new Date(s.date);
              return sDate.getUTCDate() === day &&
                sDate.getUTCMonth() === calendarMonth &&
                sDate.getUTCFullYear() === calendarYear;
            });
            if (summary) {
              setViewingSummary(summary);
            } else {
              setViewingSummary(null);
            }
          }}
          className={`
            relative p-2 text-sm rounded-lg transition-all text-gray-900 dark:text-white
            ${isToday ? 'font-bold ring-2 ring-blue-500' : ''}
            ${isSelected ? 'bg-blue-600 !text-white' : 'hover:bg-gray-200 dark:hover:bg-neutral-700'}
            ${dateInfo && !isSelected ? 'bg-gray-200 dark:bg-neutral-700' : ''}
          `}
        >
          {day}
          {dateInfo && (
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {dateInfo.shifts.includes('Morning') && (
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Morning shift"></div>
              )}
              {dateInfo.shifts.includes('Afternoon') && (
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Afternoon shift"></div>
              )}
            </div>
          )}
        </button>
      );
    }

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-gray-900 dark:text-white">{monthNames[calendarMonth]} {calendarYear}</span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(name => (
            <div key={name} className="p-2 text-center text-xs text-gray-500 dark:text-neutral-400 font-medium">
              {name}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>Morning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>Afternoon</span>
          </div>
        </div>
      </div>
    );
  };

  // Render summary card
  const renderSummaryCard = (summary) => {
    return (
      <div
        key={summary._id}
        onClick={() => setViewingSummary(summary)}
        className={`
          bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 cursor-pointer transition-all
          hover:bg-gray-100 dark:hover:bg-neutral-750 border-2
          ${viewingSummary?._id === summary._id ? 'border-blue-500' : 'border-transparent'}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white">{summary.title}</h3>
          <div className="flex items-center gap-1">
            {summary.shift === 'Morning' ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-orange-500" />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-2">
          {summary.content.substring(0, 150)}...
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-neutral-500">
          <span>{summary.metadata?.agentsSummarized?.length || 0} agents</span>
          <span>|</span>
          <span>
            {(summary.metadata?.ticketCount?.selected || 0) +
              (summary.metadata?.ticketCount?.graded || 0) +
              (summary.metadata?.ticketCount?.both || 0)} tickets
          </span>
        </div>
      </div>
    );
  };

  // Render summary detail
  const renderSummaryDetail = () => {
    if (!viewingSummary) {
      return (
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px] border border-gray-200 dark:border-neutral-700">
          <FileText className="h-12 w-12 text-gray-400 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-neutral-400 mb-2">No Summary Selected</h3>
          <p className="text-sm text-gray-500 dark:text-neutral-500 mb-4">
            Select a date and create a summary, or click on an existing one to view it.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {viewingSummary.shift === 'Morning' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-orange-500" />
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{viewingSummary.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyToClipboard(viewingSummary.content)}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setEditDialog({
                open: true,
                summary: viewingSummary,
                content: viewingSummary.content
              })}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              title="Edit summary"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteDialog({
                open: true,
                summaryId: viewingSummary._id
              })}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              title="Delete summary"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-neutral-300 max-h-[500px] overflow-y-auto border border-gray-200 dark:border-neutral-700">
          {viewingSummary.content}
        </div>

        {/* Metadata */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-500">
          <span>Created: {new Date(viewingSummary.createdAt).toLocaleString()}</span>
          {viewingSummary.updatedAt !== viewingSummary.createdAt && (
            <span>Updated: {new Date(viewingSummary.updatedAt).toLocaleString()}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Summaries</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Generate and manage daily QA work summaries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSummaries();
              fetchSummaryDates();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleCreateSummary}
            disabled={generating || !isDateSelectable(selectedDate)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-neutral-700 disabled:text-gray-500 dark:disabled:text-neutral-400 rounded-lg transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Summary
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selected Date Info */}
      <div className="bg-gray-100 dark:bg-neutral-800/50 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
          <span className="text-sm text-gray-700 dark:text-neutral-300">
            Selected: <strong>{selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</strong>
          </span>
        </div>
        {!isDateSelectable(selectedDate) && (
          <span className="text-xs text-yellow-600 dark:text-yellow-500">
            Only dates from Monday to today can be used for new summaries
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Calendar */}
        <div className="col-span-4">
          {renderCalendar()}

          {/* Recent Summaries List */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-3">Recent Summaries</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-neutral-500" />
              </div>
            ) : summaries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-neutral-500 text-center py-4">No summaries this month</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {summaries.map(summary => renderSummaryCard(summary))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary Detail */}
        <div className="col-span-8">
          {renderSummaryDetail()}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, summary: null, content: '' })}
        title="Edit Summary"
        footer={
          <>
            <button
              onClick={() => setEditDialog({ open: false, summary: null, content: '' })}
              className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateSummary}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </>
        }
      >
        <textarea
          value={editDialog.content}
          onChange={(e) => setEditDialog({ ...editDialog, content: e.target.value })}
          className="w-full h-96 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg p-4 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Enter summary content..."
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, summaryId: null })}
        title="Delete Summary"
        footer={
          <>
            <button
              onClick={() => setDeleteDialog({ open: false, summaryId: null })}
              className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSummary}
              className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-neutral-400">
          Are you sure you want to delete this summary? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default QASummaries;
