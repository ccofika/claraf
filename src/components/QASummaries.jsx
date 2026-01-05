import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  staggerContainer,
  staggerItem,
  fadeInUp,
  cardVariants,
  calendarDay,
  duration
} from '../utils/animations';

const QASummaries = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summaryDates, setSummaryDates] = useState([]);
  const [viewingSummary, setViewingSummary] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [editDialog, setEditDialog] = useState({ open: false, summary: null, content: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, summaryId: null });

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

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

  useEffect(() => {
    fetchSummaries();
    fetchSummaryDates();
  }, [fetchSummaries, fetchSummaryDates]);

  const stats = useMemo(() => {
    const totalSummaries = summaries.length;
    const morningSummaries = summaries.filter(s => s.shift === 'Morning').length;
    const afternoonSummaries = summaries.filter(s => s.shift === 'Afternoon').length;
    let totalTickets = 0;
    summaries.forEach(s => {
      const ticketCount = s.metadata?.ticketCount;
      if (ticketCount) {
        totalTickets += (ticketCount.selected || 0) + (ticketCount.graded || 0) + (ticketCount.both || 0);
      }
    });
    const avgTicketsPerSummary = totalSummaries > 0 ? Math.round(totalTickets / totalSummaries) : 0;
    return { totalSummaries, morningSummaries, afternoonSummaries, avgTicketsPerSummary };
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => {
      const matchesSearch = searchQuery === '' ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesShift = shiftFilter === 'all' || s.shift === shiftFilter;
      return matchesSearch && matchesShift;
    });
  }, [summaries, searchQuery, shiftFilter]);

  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const isDateSelectable = (date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const monday = getMondayOfWeek(today);
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0);
    return checkDate >= monday && checkDate <= today;
  };

  const handleCreateSummary = async () => {
    if (!isDateSelectable(selectedDate)) {
      toast.error('Date must be within current week (Monday to today)');
      return;
    }
    try {
      setGenerating(true);
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const response = await axios.post(`${API_URL}/api/qa/summaries`, { date: dateStr }, getAuthHeaders());
      setSummaries([response.data, ...summaries]);
      setViewingSummary(response.data);
      toast.success('Summary generated successfully!');
      fetchSummaryDates();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate summary';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateSummary = async () => {
    if (!editDialog.summary || !editDialog.content.trim()) return;
    try {
      const response = await axios.put(`${API_URL}/api/qa/summaries/${editDialog.summary._id}`, { content: editDialog.content }, getAuthHeaders());
      setSummaries(summaries.map(s => s._id === response.data._id ? response.data : s));
      if (viewingSummary?._id === response.data._id) setViewingSummary(response.data);
      setEditDialog({ open: false, summary: null, content: '' });
      toast.success('Summary updated!');
    } catch (error) {
      toast.error('Failed to update summary');
    }
  };

  const handleDeleteSummary = async () => {
    if (!deleteDialog.summaryId) return;
    try {
      await axios.delete(`${API_URL}/api/qa/summaries/${deleteDialog.summaryId}`, getAuthHeaders());
      setSummaries(summaries.filter(s => s._id !== deleteDialog.summaryId));
      if (viewingSummary?._id === deleteDialog.summaryId) setViewingSummary(null);
      setDeleteDialog({ open: false, summaryId: null });
      toast.success('Summary deleted!');
      fetchSummaryDates();
    } catch (error) {
      toast.error('Failed to delete summary');
    }
  };

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

  const handlePrevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
    else { setCalendarMonth(calendarMonth - 1); }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
    else { setCalendarMonth(calendarMonth + 1); }
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => { const day = new Date(year, month, 1).getDay(); return day === 0 ? 6 : day - 1; };
  const getDateSummaries = (day) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return summaryDates.find(d => d.date === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const days = [];

    for (let i = 0; i < firstDay; i++) { days.push(<div key={`empty-${i}`} className="p-1 sm:p-2"></div>); }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateInfo = getDateSummaries(day);
      const isToday = new Date().getDate() === day && new Date().getMonth() === calendarMonth && new Date().getFullYear() === calendarYear;
      const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === calendarMonth && selectedDate.getFullYear() === calendarYear;
      const checkDate = new Date(calendarYear, calendarMonth, day);
      const canSelect = isDateSelectable(checkDate);

      days.push(
        <motion.button
          key={day}
          variants={calendarDay}
          initial="initial"
          animate="animate"
          whileHover={canSelect ? "hover" : undefined}
          whileTap={canSelect ? "tap" : undefined}
          onClick={() => {
            const newDate = new Date(calendarYear, calendarMonth, day);
            setSelectedDate(newDate);
            const summary = summaries.find(s => {
              const sDate = new Date(s.date);
              return sDate.getUTCDate() === day && sDate.getUTCMonth() === calendarMonth && sDate.getUTCFullYear() === calendarYear;
            });
            setViewingSummary(summary || null);
          }}
          className={`relative aspect-square p-1 sm:p-2 text-xs sm:text-sm rounded-lg transition-colors
            ${isToday ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900 font-bold' : ''}
            ${isSelected ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : canSelect ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-600'}
            ${dateInfo && !isSelected ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
        >
          <span className="relative z-10">{day}</span>
          {dateInfo && (
            <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {dateInfo.shifts.includes('Morning') && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400 shadow-sm"></div>}
              {dateInfo.shifts.includes('Afternoon') && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500 shadow-sm"></div>}
            </div>
          )}
        </motion.button>
      );
    }

    return (
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-center justify-between">
            <motion.button whileTap={{ scale: 0.95 }} onClick={handlePrevMonth} className="p-1.5 sm:p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-600 dark:text-neutral-400" />
            </motion.button>
            <CardTitle className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white">{monthNames[calendarMonth]} {calendarYear}</CardTitle>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleNextMonth} className="p-1.5 sm:p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-600 dark:text-neutral-400" />
            </motion.button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
            {dayNames.map(name => <div key={name} className="p-1 sm:p-2 text-center text-[10px] sm:text-xs text-neutral-500 font-medium">{name}</div>)}
          </div>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-7 gap-0.5 sm:gap-1">{days}</motion.div>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs text-neutral-500">
            <div className="flex items-center gap-1 sm:gap-1.5"><Sun className="h-3 w-3 text-amber-400" /><span>Morning</span></div>
            <div className="flex items-center gap-1 sm:gap-1.5"><Moon className="h-3 w-3 text-orange-500" /><span>Afternoon</span></div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSummaryCard = (summary, index) => {
    const isActive = viewingSummary?._id === summary._id;
    const ticketCount = (summary.metadata?.ticketCount?.selected || 0) + (summary.metadata?.ticketCount?.graded || 0) + (summary.metadata?.ticketCount?.both || 0);

    return (
      <motion.div
        key={summary._id}
        variants={staggerItem}
        initial="initial"
        animate="animate"
        whileHover={{ y: -2 }}
        onClick={() => setViewingSummary(summary)}
        className={`group relative rounded-xl p-3 sm:p-4 cursor-pointer transition-all
          ${isActive ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 ring-2 ring-blue-500 shadow-lg shadow-blue-500/10' : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/50'}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`flex-shrink-0 p-1.5 rounded-lg ${summary.shift === 'Morning' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
              {summary.shift === 'Morning' ? <Sun className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />}
            </div>
            <h3 className="font-medium text-neutral-900 dark:text-white text-sm truncate">{summary.title}</h3>
          </div>
          <Badge variant="secondary" className={`text-[10px] flex-shrink-0 ${summary.shift === 'Morning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'}`}>{summary.shift}</Badge>
        </div>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">{summary.content.substring(0, 120)}...</p>
        <div className="flex items-center gap-3 text-[10px] sm:text-xs text-neutral-500">
          <div className="flex items-center gap-1"><Users className="h-3 w-3" /><span>{summary.metadata?.agentsSummarized?.length || 0} agents</span></div>
          <div className="flex items-center gap-1"><FileText className="h-3 w-3" /><span>{ticketCount} tickets</span></div>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(summary.content); }} className="p-1.5 bg-white dark:bg-neutral-700 rounded-md shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors" title="Copy">
            <Copy className="h-3 w-3 text-neutral-600 dark:text-neutral-300" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const renderSummaryDetail = () => {
    if (!viewingSummary) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-full min-h-[400px] flex flex-col items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center text-center py-12">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Summary Selected</h3>
              <p className="text-sm text-neutral-500 max-w-xs">Select a date from the calendar and create a summary, or click on an existing one to view details.</p>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    const ticketCount = (viewingSummary.metadata?.ticketCount?.selected || 0) + (viewingSummary.metadata?.ticketCount?.graded || 0) + (viewingSummary.metadata?.ticketCount?.both || 0);

    return (
      <motion.div key={viewingSummary._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.normal }}>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className={`flex-shrink-0 p-2.5 rounded-xl ${viewingSummary.shift === 'Morning' ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30' : 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/30'}`}>
                  {viewingSummary.shift === 'Morning' ? <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" /> : <Moon className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                </motion.div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-neutral-900 dark:text-white">{viewingSummary.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs border-neutral-300 dark:border-neutral-600"><Users className="h-3 w-3 mr-1" />{viewingSummary.metadata?.agentsSummarized?.length || 0} agents</Badge>
                    <Badge variant="outline" className="text-xs border-neutral-300 dark:border-neutral-600"><FileText className="h-3 w-3 mr-1" />{ticketCount} tickets</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleCopyToClipboard(viewingSummary.content)} className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Copy">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleExportSummary(viewingSummary)} className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Export"><Download className="h-4 w-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditDialog({ open: true, summary: viewingSummary, content: viewingSummary.content })} className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Edit"><Edit className="h-4 w-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDeleteDialog({ open: true, summaryId: viewingSummary._id })} className="p-2 text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></motion.button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {viewingSummary.metadata?.agentsSummarized?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Agents Summarized</h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingSummary.metadata.agentsSummarized.map((agent, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}>
                      <Badge variant="secondary" className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-0">
                        {agent.agentName}{agent.ticketCount > 0 && <span className="ml-1 text-neutral-400 dark:text-neutral-500">({agent.ticketCount})</span>}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 max-h-[400px] sm:max-h-[500px] overflow-y-auto border border-neutral-100 dark:border-neutral-700/50">
              {viewingSummary.content}
            </motion.div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Created: {new Date(viewingSummary.createdAt).toLocaleString()}</span>
              {viewingSummary.updatedAt !== viewingSummary.createdAt && <span className="flex items-center gap-1"><Edit className="h-3 w-3" />Updated: {new Date(viewingSummary.updatedAt).toLocaleString()}</span>}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const statsData = [
    { icon: FileText, label: 'Summaries', value: stats.totalSummaries, color: 'blue' },
    { icon: Sun, label: 'Morning', value: stats.morningSummaries, color: 'amber' },
    { icon: Moon, label: 'Afternoon', value: stats.afternoonSummaries, color: 'orange' },
    { icon: TrendingUp, label: 'Avg Tickets', value: stats.avgTicketsPerSummary, color: 'green' }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Summaries</h2>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0">{stats.totalSummaries} this month</Badge>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">Generate and manage your daily QA work summaries</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { fetchSummaries(); fetchSummaryDates(); }} className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors">
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Refresh</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleCreateSummary} disabled={generating || !isDateSelectable(selectedDate)} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-neutral-300 disabled:to-neutral-400 dark:disabled:from-neutral-700 dark:disabled:to-neutral-600 disabled:text-neutral-500 dark:disabled:text-neutral-400 rounded-lg transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none">
            {generating ? <><Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /><span>Generating...</span></> : <><Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>Create Summary</span></>}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsData.map((stat, index) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}><stat.icon className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-neutral-500 font-medium uppercase tracking-wider">{stat.label}</p>
                    <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Selected Date Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"><CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
              <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">Selected: <strong className="text-neutral-900 dark:text-white">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
            </div>
            {!isDateSelectable(selectedDate) && <Badge variant="outline" className="text-[10px] sm:text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700">Only Monday to today available</Badge>}
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input type="text" placeholder="Search summaries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-white placeholder-neutral-400" />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'Morning', 'Afternoon'].map((filter) => (
            <motion.button key={filter} whileTap={{ scale: 0.95 }} onClick={() => setShiftFilter(filter)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${shiftFilter === filter ? (filter === 'all' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : filter === 'Morning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300') : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>
              {filter === 'Morning' && <Sun className="h-3 w-3" />}
              {filter === 'Afternoon' && <Moon className="h-3 w-3" />}
              {filter === 'all' ? 'All' : filter}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-4 xl:col-span-4 space-y-4 sm:space-y-6">
          {renderCalendar()}
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-white">{searchQuery || shiftFilter !== 'all' ? 'Filtered Results' : 'Recent Summaries'}</CardTitle>
                <Badge variant="secondary" className="text-xs border-0">{filteredSummaries.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
              ) : filteredSummaries.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><FileText className="h-6 w-6 text-neutral-400 dark:text-neutral-500" /></div>
                  <p className="text-sm text-neutral-500">{searchQuery || shiftFilter !== 'all' ? 'No matching summaries' : 'No summaries this month'}</p>
                </motion.div>
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredSummaries.map((summary, index) => renderSummaryCard(summary, index))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-8 xl:col-span-8">
          <AnimatePresence mode="wait">{renderSummaryDetail()}</AnimatePresence>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, summary: null, content: '' })}>
        <DialogContent className="max-w-2xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-white">Edit Summary</DialogTitle>
            <DialogDescription className="text-neutral-500">Make changes to your summary content below.</DialogDescription>
          </DialogHeader>
          <textarea value={editDialog.content} onChange={(e) => setEditDialog({ ...editDialog, content: e.target.value })} className="w-full h-80 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Enter summary content..." />
          <DialogFooter>
            <button onClick={() => setEditDialog({ open: false, summary: null, content: '' })} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Cancel</button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleUpdateSummary} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Save Changes</motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, summaryId: null })}>
        <DialogContent className="max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-white">Delete Summary</DialogTitle>
            <DialogDescription className="text-neutral-500">Are you sure you want to delete this summary? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteDialog({ open: false, summaryId: null })} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Cancel</button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleDeleteSummary} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Delete</motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default QASummaries;
