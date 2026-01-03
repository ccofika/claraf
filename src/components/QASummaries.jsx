import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  Download,
  TrendingUp,
  Users,
  Clock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

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

  // New feature states
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all'); // 'all', 'Morning', 'Afternoon'

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

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSummaries = summaries.length;
    const morningSummaries = summaries.filter(s => s.shift === 'Morning').length;
    const afternoonSummaries = summaries.filter(s => s.shift === 'Afternoon').length;

    let totalTickets = 0;
    let totalAgents = 0;

    summaries.forEach(s => {
      const ticketCount = s.metadata?.ticketCount;
      if (ticketCount) {
        totalTickets += (ticketCount.selected || 0) + (ticketCount.graded || 0) + (ticketCount.both || 0);
      }
      totalAgents += s.metadata?.agentsSummarized?.length || 0;
    });

    const avgTicketsPerSummary = totalSummaries > 0 ? Math.round(totalTickets / totalSummaries) : 0;

    return {
      totalSummaries,
      morningSummaries,
      afternoonSummaries,
      totalTickets,
      totalAgents,
      avgTicketsPerSummary
    };
  }, [summaries]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => {
      const matchesSearch = searchQuery === '' ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesShift = shiftFilter === 'all' || s.shift === shiftFilter;
      return matchesSearch && matchesShift;
    });
  }, [summaries, searchQuery, shiftFilter]);

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

  // Export summary as text file
  const handleExportSummary = (summary) => {
    const content = `${summary.title}\n${'='.repeat(summary.title.length)}\n\n${summary.content}\n\n---\nGenerated: ${new Date(summary.createdAt).toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${summary.date}-${summary.shift.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary exported!');
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
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-1 sm:p-2"></div>);
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
      const checkDate = new Date(calendarYear, calendarMonth, day);
      const canSelect = isDateSelectable(checkDate);

      days.push(
        <button
          key={day}
          onClick={() => {
            const newDate = new Date(calendarYear, calendarMonth, day);
            setSelectedDate(newDate);
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
            relative aspect-square p-1 sm:p-2 text-xs sm:text-sm rounded-lg transition-all duration-200
            ${isToday ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900 font-bold' : ''}
            ${isSelected
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
              : canSelect
                ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-neutral-600'}
            ${dateInfo && !isSelected ? 'bg-gray-100 dark:bg-neutral-800' : ''}
          `}
        >
          <span className="relative z-10">{day}</span>
          {dateInfo && (
            <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {dateInfo.shifts.includes('Morning') && (
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400 shadow-sm" title="Morning shift"></div>
              )}
              {dateInfo.shifts.includes('Afternoon') && (
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500 shadow-sm" title="Afternoon shift"></div>
              )}
            </div>
          )}
        </button>
      );
    }

    return (
      <Card className="border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-neutral-400" />
            </button>
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {monthNames[calendarMonth]} {calendarYear}
            </CardTitle>
            <button
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
          {/* Day names */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
            {dayNames.map(name => (
              <div key={name} className="p-1 sm:p-2 text-center text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500 font-medium">
                {name}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {days}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Sun className="h-3 w-3 text-amber-400" />
              <span>Morning</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Moon className="h-3 w-3 text-orange-500" />
              <span>Afternoon</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render summary card
  const renderSummaryCard = (summary) => {
    const isActive = viewingSummary?._id === summary._id;
    const ticketCount = (summary.metadata?.ticketCount?.selected || 0) +
      (summary.metadata?.ticketCount?.graded || 0) +
      (summary.metadata?.ticketCount?.both || 0);

    return (
      <div
        key={summary._id}
        onClick={() => setViewingSummary(summary)}
        className={`
          group relative rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-200
          ${isActive
            ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 ring-2 ring-blue-500 shadow-lg shadow-blue-500/10'
            : 'bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700/50'}
        `}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`
              flex-shrink-0 p-1.5 rounded-lg
              ${summary.shift === 'Morning'
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-orange-100 dark:bg-orange-900/30'}
            `}>
              {summary.shift === 'Morning' ? (
                <Sun className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{summary.title}</h3>
          </div>
          <Badge
            variant="secondary"
            className={`
              text-[10px] flex-shrink-0
              ${summary.shift === 'Morning'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'}
            `}
          >
            {summary.shift}
          </Badge>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400 line-clamp-2 mb-3">
          {summary.content.substring(0, 120)}...
        </p>

        <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{summary.metadata?.agentsSummarized?.length || 0} agents</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{ticketCount} tickets</span>
          </div>
        </div>

        {/* Quick actions on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyToClipboard(summary.content);
            }}
            className="p-1.5 bg-white dark:bg-neutral-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors"
            title="Copy"
          >
            <Copy className="h-3 w-3 text-gray-600 dark:text-neutral-300" />
          </button>
        </div>
      </div>
    );
  };

  // Render summary detail
  const renderSummaryDetail = () => {
    if (!viewingSummary) {
      return (
        <Card className="border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-full min-h-[400px] flex flex-col items-center justify-center">
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Summary Selected</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500 max-w-xs">
              Select a date from the calendar and create a summary, or click on an existing one to view details.
            </p>
          </CardContent>
        </Card>
      );
    }

    const ticketCount = (viewingSummary.metadata?.ticketCount?.selected || 0) +
      (viewingSummary.metadata?.ticketCount?.graded || 0) +
      (viewingSummary.metadata?.ticketCount?.both || 0);

    return (
      <Card className="border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`
                flex-shrink-0 p-2.5 rounded-xl
                ${viewingSummary.shift === 'Morning'
                  ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30'
                  : 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/30'}
              `}>
                {viewingSummary.shift === 'Morning' ? (
                  <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Moon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">{viewingSummary.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs border-gray-300 dark:border-neutral-600">
                    <Users className="h-3 w-3 mr-1" />
                    {viewingSummary.metadata?.agentsSummarized?.length || 0} agents
                  </Badge>
                  <Badge variant="outline" className="text-xs border-gray-300 dark:border-neutral-600">
                    <FileText className="h-3 w-3 mr-1" />
                    {ticketCount} tickets
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleCopyToClipboard(viewingSummary.content)}
                className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleExportSummary(viewingSummary)}
                className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Export as text file"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditDialog({
                  open: true,
                  summary: viewingSummary,
                  content: viewingSummary.content
                })}
                className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Edit summary"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteDialog({
                  open: true,
                  summaryId: viewingSummary._id
                })}
                className="p-2 text-gray-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete summary"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Agent breakdown */}
          {viewingSummary.metadata?.agentsSummarized?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Agents Summarized
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingSummary.metadata.agentsSummarized.map((agent, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border-0"
                  >
                    {agent.agentName}
                    {agent.ticketCount > 0 && (
                      <span className="ml-1 text-gray-400 dark:text-neutral-500">
                        ({agent.ticketCount})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5 whitespace-pre-wrap text-sm text-gray-700 dark:text-neutral-300 max-h-[400px] sm:max-h-[500px] overflow-y-auto border border-gray-100 dark:border-neutral-700/50">
            {viewingSummary.content}
          </div>

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-neutral-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created: {new Date(viewingSummary.createdAt).toLocaleString()}
            </span>
            {viewingSummary.updatedAt !== viewingSummary.createdAt && (
              <span className="flex items-center gap-1">
                <Edit className="h-3 w-3" />
                Updated: {new Date(viewingSummary.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Stats cards
  const renderStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500 font-medium uppercase tracking-wider">Summaries</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSummaries}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500 font-medium uppercase tracking-wider">Morning</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.morningSummaries}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500 font-medium uppercase tracking-wider">Afternoon</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.afternoonSummaries}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500 font-medium uppercase tracking-wider">Avg Tickets</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.avgTicketsPerSummary}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Summaries</h2>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0">
              {stats.totalSummaries} this month
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Generate and manage your daily QA work summaries
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              fetchSummaries();
              fetchSummaryDates();
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleCreateSummary}
            disabled={generating || !isDateSelectable(selectedDate)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-neutral-700 dark:disabled:to-neutral-600 disabled:text-gray-500 dark:disabled:text-neutral-400 rounded-lg transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none"
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Create Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Selected Date Info */}
      <Card className="border-gray-200 dark:border-neutral-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-neutral-300">
              Selected: <strong className="text-gray-900 dark:text-white">{selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</strong>
            </span>
          </div>
          {!isDateSelectable(selectedDate) && (
            <Badge variant="outline" className="text-[10px] sm:text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700">
              Only Monday to today available
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500"
          />
        </div>

        {/* Shift filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShiftFilter('all')}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
              shiftFilter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setShiftFilter('Morning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
              shiftFilter === 'Morning'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
          >
            <Sun className="h-3 w-3" />
            Morning
          </button>
          <button
            onClick={() => setShiftFilter('Afternoon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
              shiftFilter === 'Afternoon'
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
          >
            <Moon className="h-3 w-3" />
            Afternoon
          </button>
        </div>
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Calendar + Summary List */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4 sm:space-y-6">
          {renderCalendar()}

          {/* Recent Summaries List */}
          <Card className="border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                  {searchQuery || shiftFilter !== 'all' ? 'Filtered Results' : 'Recent Summaries'}
                </CardTitle>
                <Badge variant="secondary" className="text-xs border-0">
                  {filteredSummaries.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : filteredSummaries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-gray-400 dark:text-neutral-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-neutral-500">
                    {searchQuery || shiftFilter !== 'all' ? 'No matching summaries' : 'No summaries this month'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredSummaries.map(summary => renderSummaryCard(summary))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary Detail */}
        <div className="lg:col-span-8 xl:col-span-8">
          {renderSummaryDetail()}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, summary: null, content: '' })}>
        <DialogContent className="max-w-2xl bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Edit Summary</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-neutral-400">
              Make changes to your summary content below.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={editDialog.content}
            onChange={(e) => setEditDialog({ ...editDialog, content: e.target.value })}
            className="w-full h-80 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Enter summary content..."
          />
          <DialogFooter>
            <button
              onClick={() => setEditDialog({ open: false, summary: null, content: '' })}
              className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateSummary}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, summaryId: null })}>
        <DialogContent className="max-w-md bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Delete Summary</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-neutral-400">
              Are you sure you want to delete this summary? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteDialog({ open: false, summaryId: null })}
              className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSummary}
              className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QASummaries;
