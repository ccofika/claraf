import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  GraduationCap, ArrowLeft, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Copy, Check, ChevronDown, ChevronRight, X, FileText, BarChart3, Target,
  AlertCircle, CheckCircle2, Lightbulb, ExternalLink, Calendar, Share2, Trash2,
  Clock, Save, Users, User, Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { useQAManager } from '../../context/QAManagerContext';
import { Badge } from '../../components/ui/badge';
import { TicketContentDisplay } from '../../components/TicketRichTextEditor';
import { SCORE_COLORS, SHORT_LABELS, getScorecardValues } from '../../data/scorecardConfig';

const QACoachingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useQAManager();

  // State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notes
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesTimeout, setNotesTimeout] = useState(null);
  const notesRef = useRef(null);

  // Status
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Ticket preview
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fullTicketData, setFullTicketData] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    bad: true,
    moderate: false
  });

  // Share modal - category style (QA graders)
  const [shareModal, setShareModal] = useState(false);
  const [allGradersForShare, setAllGradersForShare] = useState([]);
  const [selectedShareGraders, setSelectedShareGraders] = useState([]);
  const [shareGraderSearch, setShareGraderSearch] = useState('');
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [shareHighlightIndex, setShareHighlightIndex] = useState(0);
  const [sharingLoading, setSharingLoading] = useState(false);
  const shareInputRef = useRef(null);
  const shareDropdownRef = useRef(null);
  const shareListRef = useRef(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Fetch session
  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions/${id}`,
        getAuthHeaders()
      );
      setSession(response.data);
      setNotes(response.data.notes || '');
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err.response?.data?.message || 'Greska pri ucitavanju');
    } finally {
      setLoading(false);
    }
  }, [id, getAuthHeaders]);

  // Fetch QA graders for sharing
  const fetchGradersForShare = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/graders`,
        getAuthHeaders()
      );
      setAllGradersForShare(response.data);
    } catch (err) {
      console.error('Error fetching graders for share:', err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchSession();
    fetchGradersForShare();
  }, [fetchSession, fetchGradersForShare]);

  // Auto-save notes
  const handleNotesChange = (value) => {
    setNotes(value);

    if (notesTimeout) {
      clearTimeout(notesTimeout);
    }

    const timeout = setTimeout(async () => {
      setNotesSaving(true);
      try {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions/${id}`,
          { notes: value },
          getAuthHeaders()
        );
      } catch (err) {
        console.error('Error saving notes:', err);
        toast.error('Greska pri cuvanju beleske');
      } finally {
        setNotesSaving(false);
      }
    }, 1000);

    setNotesTimeout(timeout);
  };

  // Update status
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions/${id}`,
        { status: newStatus },
        getAuthHeaders()
      );
      setSession(prev => ({ ...prev, status: newStatus }));
      setStatusDropdownOpen(false);
      toast.success('Status azuriran');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Greska pri azuriranju statusa');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Share
  const handleOpenShareModal = () => {
    // Set selected graders from current sharedWith
    const currentGraders = session.sharedWith?.map(s => {
      const grader = allGradersForShare.find(g => g._id === s.userId?._id);
      return grader || s.userId;
    }).filter(Boolean) || [];
    setSelectedShareGraders(currentGraders);
    setShareGraderSearch('');
    setShowShareDropdown(false);
    setShareHighlightIndex(0);
    setShareModal(true);
  };

  const handleShare = async () => {
    setSharingLoading(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions/${id}/share`,
        { userIds: selectedShareGraders.map(g => g._id) },
        getAuthHeaders()
      );
      setSession(response.data);
      setShareModal(false);
      toast.success('Coaching sesija podeljena');
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Greska pri deljenju');
    } finally {
      setSharingLoading(false);
    }
  };

  // Share modal helpers
  const filteredShareGraders = allGradersForShare.filter(grader => {
    const isSelected = selectedShareGraders.some(s => s._id === grader._id);
    const matchesSearch = grader.name?.toLowerCase().includes(shareGraderSearch.toLowerCase()) ||
                          grader.email?.toLowerCase().includes(shareGraderSearch.toLowerCase());
    return !isSelected && matchesSearch;
  });

  const handleShareGraderSelect = (grader) => {
    setSelectedShareGraders([...selectedShareGraders, grader]);
    setShareGraderSearch('');
    setShowShareDropdown(false);
    setShareHighlightIndex(0);
    shareInputRef.current?.focus();
  };

  const handleShareGraderRemove = (graderId) => {
    setSelectedShareGraders(selectedShareGraders.filter(g => g._id !== graderId));
  };

  const handleShareKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowShareDropdown(true);
      setShareHighlightIndex(prev => Math.min(prev + 1, filteredShareGraders.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShareHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && showShareDropdown && filteredShareGraders[shareHighlightIndex]) {
      e.preventDefault();
      handleShareGraderSelect(filteredShareGraders[shareHighlightIndex]);
    } else if (e.key === 'Escape') {
      setShowShareDropdown(false);
    } else if (e.key === 'Backspace' && shareGraderSearch === '' && selectedShareGraders.length > 0) {
      handleShareGraderRemove(selectedShareGraders[selectedShareGraders.length - 1]._id);
    }
  };

  // Click outside to close share dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setShowShareDropdown(false);
      }
    };
    if (showShareDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareDropdown]);

  // Auto-scroll highlighted item in share dropdown
  useEffect(() => {
    if (showShareDropdown && shareListRef.current) {
      const highlighted = shareListRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [shareHighlightIndex, showShareDropdown]);

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions/${id}`,
        getAuthHeaders()
      );
      toast.success('Coaching sesija obrisana');
      navigate('/qa-manager/coaching');
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error('Greska pri brisanju');
    } finally {
      setDeleting(false);
    }
  };

  // Fetch ticket details
  const fetchTicketDetails = useCallback(async (ticketId) => {
    setTicketLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/qa/tickets/${ticketId}`,
        getAuthHeaders()
      );
      setFullTicketData(response.data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      toast.error('Greska pri ucitavanju tiketa');
    } finally {
      setTicketLoading(false);
    }
  }, [getAuthHeaders]);

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    fetchTicketDetails(ticket._id);
  };

  // Copy report
  const handleCopyReport = () => {
    if (!session) return;

    const { reportData, agent, period } = session;
    const text = `COACHING REPORT: ${agent.name}
Period: Poslednjih ${period.weeks} nedelja
Generisano: ${new Date(session.createdAt).toLocaleDateString('sr-RS')}

PERFORMANCE SUMMARY
- Ukupno tiketa: ${reportData.summary.totalTickets}
- Tiketa sa problemima (<90%): ${reportData.summary.ticketsWithIssues}
- Prosecan score: ${reportData.summary.avgScore}%
- Trend: ${reportData.summary.trend === 'improving' ? 'Napreduje' : reportData.summary.trend === 'declining' ? 'Opada' : 'Stabilno'} (${reportData.summary.trendValue}%)

SCORECARD ANALIZA
Strengths:
${reportData.scorecardAnalysis.strengths.map(s => `- ${s.name}: ${s.avgScore}%`).join('\n')}

Areas for Improvement:
${reportData.scorecardAnalysis.weaknesses.map(w => `- ${w.name}: ${w.avgScore}%`).join('\n')}

TOP KATEGORIJE SA PROBLEMIMA
${reportData.topIssueCategories.map(c => `- ${c.name}: ${c.count} tiketa (avg ${c.avgScore}%)`).join('\n')}

PREPORUCENE AKCIJE
${reportData.suggestedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

${notes ? `\nBELESKE\n${notes}` : ''}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Report kopiran');
    setTimeout(() => setCopied(false), 2000);
  };

  // ESC handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTicket) {
        setSelectedTicket(null);
        setFullTicketData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket]);

  // Helpers
  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (score >= 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'in_progress': return 'U toku';
      case 'completed': return 'Zavrseno';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Greska</h2>
        <p className="text-gray-500 dark:text-neutral-400 mb-6">{error}</p>
        <button
          onClick={() => navigate('/qa-manager/coaching')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Nazad na listu
        </button>
      </div>
    );
  }

  if (!session) return null;

  const { reportData, agent, period } = session;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/qa-manager/coaching')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <GraduationCap className="w-7 h-7 text-purple-500" />
              {agent.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
              {agent.position || 'Agent'} | Kreirano {new Date(session.createdAt).toLocaleDateString('sr-RS')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          {session.isOwner && (
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                disabled={updatingStatus}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor(session.status)}`}
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : getStatusIcon(session.status)}
                {getStatusLabel(session.status)}
                <ChevronDown className="w-4 h-4" />
              </button>

              {statusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)} />
                  <div className="absolute right-0 z-50 mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                    {['new', 'in_progress', 'completed'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                          session.status === status ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-neutral-300'
                        }`}
                      >
                        {getStatusIcon(status)}
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Share Button */}
          {session.isOwner && (
            <button
              onClick={handleOpenShareModal}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Podeli
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Kopirano' : 'Kopiraj'}
          </button>

          {/* Delete Button */}
          {session.isOwner && (
            <button
              onClick={() => setDeleteModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Obrisi
            </button>
          )}
        </div>
      </div>

      {/* Shared Info */}
      {session.sharedWith?.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg">
          <Users className="w-4 h-4" />
          Podeljeno sa: {session.sharedWith.map(s => s.userId?.name || 'Unknown').join(', ')}
        </div>
      )}

      {!session.isOwner && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
          <Share2 className="w-4 h-4" />
          Podeljeno od: {session.generatedBy.name || session.generatedBy.email?.split('@')[0]}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Stats */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Ukupno tiketa</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{reportData.summary.totalTickets}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Sa problemima</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{reportData.summary.ticketsWithIssues}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Prosecan score</p>
                <p className={`text-2xl font-bold mt-1 ${reportData.summary.avgScore >= 80 ? 'text-green-600 dark:text-green-400' : reportData.summary.avgScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                  {reportData.summary.avgScore}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Trend</p>
                <div className="flex items-center gap-2 mt-1">
                  {getTrendIcon(reportData.summary.trend)}
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {reportData.summary.trendValue}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scorecard Analysis */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Scorecard Analiza
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </h4>
                <div className="space-y-2">
                  {reportData.scorecardAnalysis.strengths.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Nema strengths iznad 80%</p>
                  ) : (
                    reportData.scorecardAnalysis.strengths.map((s) => (
                      <div key={s.key} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-neutral-300">{s.name}</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">{s.avgScore}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Areas for Improvement
                </h4>
                <div className="space-y-2">
                  {reportData.scorecardAnalysis.weaknesses.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Sve oblasti iznad 80%</p>
                  ) : (
                    reportData.scorecardAnalysis.weaknesses.map((w) => (
                      <div key={w.key} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-neutral-300">{w.name}</span>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">{w.avgScore}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Tiketi sa Problemima
            </h3>

            <div className="space-y-4">
              {/* Critical */}
              {reportData.severityGroups.critical?.length > 0 && (
                <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, critical: !prev.critical }))}
                    className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      Kriticni (&lt;50%) - {reportData.severityGroups.critical.length} tiketa
                    </span>
                    <ChevronRight className={`w-4 h-4 text-red-500 transition-transform ${expandedSections.critical ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedSections.critical && (
                    <div className="divide-y divide-red-100 dark:divide-red-900/30">
                      {reportData.severityGroups.critical.map((ticket) => (
                        <TicketRow key={ticket._id} ticket={ticket} onClick={() => handleTicketClick(ticket)} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bad */}
              {reportData.severityGroups.bad?.length > 0 && (
                <div className="border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, bad: !prev.bad }))}
                    className="w-full flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="w-4 h-4" />
                      Losi (50-70%) - {reportData.severityGroups.bad.length} tiketa
                    </span>
                    <ChevronRight className={`w-4 h-4 text-orange-500 transition-transform ${expandedSections.bad ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedSections.bad && (
                    <div className="divide-y divide-orange-100 dark:divide-orange-900/30">
                      {reportData.severityGroups.bad.map((ticket) => (
                        <TicketRow key={ticket._id} ticket={ticket} onClick={() => handleTicketClick(ticket)} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Moderate */}
              {reportData.severityGroups.moderate?.length > 0 && (
                <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, moderate: !prev.moderate }))}
                    className="w-full flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      <Minus className="w-4 h-4" />
                      Umereni (70-90%) - {reportData.severityGroups.moderate.length} tiketa
                    </span>
                    <ChevronRight className={`w-4 h-4 text-yellow-500 transition-transform ${expandedSections.moderate ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedSections.moderate && (
                    <div className="divide-y divide-yellow-100 dark:divide-yellow-900/30">
                      {reportData.severityGroups.moderate.map((ticket) => (
                        <TicketRow key={ticket._id} ticket={ticket} onClick={() => handleTicketClick(ticket)} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {reportData.summary.ticketsWithIssues === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p>Nema tiketa sa ocenom ispod 90%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notes */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-500" />
                Beleske
              </h3>
              {notesSaving && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Cuvanje...
                </span>
              )}
            </div>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Dodaj licne beleske za ovu coaching sesiju..."
              className="w-full h-40 p-3 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!session.isOwner}
            />
          </div>

          {/* Top Categories */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Top Kategorije
            </h3>
            <div className="space-y-3">
              {reportData.topIssueCategories.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nema kategorija</p>
              ) : (
                reportData.topIssueCategories.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center text-xs font-medium bg-gray-100 dark:bg-neutral-800 rounded-full">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-neutral-300">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {cat.count}x
                      </Badge>
                      <span className={`text-xs font-medium ${getScoreColor(cat.avgScore)} px-1.5 py-0.5 rounded`}>
                        {cat.avgScore}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              Preporucene Akcije
            </h3>
            <div className="space-y-3">
              {reportData.suggestedActions.map((action, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-neutral-300">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Period Info */}
          <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Period: {new Date(period.startDate).toLocaleDateString('sr-RS')} - {new Date(period.endDate).toLocaleDateString('sr-RS')}
            </p>
            <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
              Generisano: {new Date(session.createdAt).toLocaleString('sr-RS')}
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Preview Portal */}
      {selectedTicket && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex"
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => {
                setSelectedTicket(null);
                setFullTicketData(null);
              }}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[600px] bg-white dark:bg-neutral-900 shadow-2xl border-l border-gray-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ticket #{selectedTicket.ticketId}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    {new Date(selectedTicket.gradedDate).toLocaleDateString('sr-RS')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${selectedTicket.ticketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Open in Intercom"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                  </a>
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setFullTicketData(null);
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {ticketLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  </div>
                ) : fullTicketData ? (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1.5 text-lg font-bold rounded-lg ${getScoreColor(fullTicketData.qualityScorePercent)}`}>
                        {fullTicketData.qualityScorePercent}%
                      </span>
                      {fullTicketData.categories?.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>

                    {fullTicketData.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          Notes
                        </h4>
                        <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                          <TicketContentDisplay
                            content={fullTicketData.notes}
                            className="text-sm text-gray-700 dark:text-neutral-300"
                          />
                        </div>
                      </div>
                    )}

                    {fullTicketData.feedback && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          Feedback
                        </h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <TicketContentDisplay
                            content={fullTicketData.feedback}
                            className="text-sm text-gray-700 dark:text-neutral-300"
                          />
                        </div>
                      </div>
                    )}

                    {fullTicketData.scorecardValues && Object.keys(fullTicketData.scorecardValues).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                          Scorecard
                        </h4>
                        <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-gray-200 dark:border-neutral-700 space-y-2">
                          {(() => {
                            const position = fullTicketData.agent?.position;
                            const variant = fullTicketData.scorecardVariant;
                            const configValues = position ? getScorecardValues(position, variant) : [];
                            const configMap = {};
                            configValues.forEach(v => { configMap[v.key] = v; });

                            return Object.entries(fullTicketData.scorecardValues).map(([key, value]) => {
                              const configItem = configMap[key];
                              const label = configItem?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                              const displayLabel = value !== null && value !== undefined && SHORT_LABELS[value]
                                ? SHORT_LABELS[value]
                                : '-';

                              const getBgClass = (idx) => {
                                if (idx === null || idx === undefined) return 'bg-gray-100 dark:bg-neutral-700';
                                switch (idx) {
                                  case 0: return 'bg-green-500';
                                  case 1: return 'bg-yellow-400';
                                  case 2: return 'bg-amber-500';
                                  case 3: return 'bg-red-500';
                                  case 4: return 'bg-gray-400';
                                  default: return 'bg-gray-100 dark:bg-neutral-700';
                                }
                              };

                              const getTextClass = (idx) => {
                                if (idx === null || idx === undefined) return 'text-gray-500';
                                if (idx === 1) return 'text-gray-900';
                                return 'text-white';
                              };

                              return (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600 dark:text-neutral-400">{label}</span>
                                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getBgClass(value)} ${getTextClass(value)}`}>
                                    {displayLabel}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Greska pri ucitavanju tiketa</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Share Modal - Category Style */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShareModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-500" />
                Podeli Coaching Sesiju
              </h2>

              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
                Izaberi QA gradere sa kojima zelis da podelis ovu coaching sesiju:
              </p>

              {/* Category-style grader selector */}
              <div className="mb-6" ref={shareDropdownRef}>
                <div className="relative">
                  <div
                    className="flex flex-wrap gap-1.5 p-2 min-h-[42px] bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg cursor-text"
                    onClick={() => shareInputRef.current?.focus()}
                  >
                    {selectedShareGraders.map(grader => (
                      <span
                        key={grader._id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm rounded-md"
                      >
                        {grader.name}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareGraderRemove(grader._id);
                          }}
                          className="hover:text-purple-900 dark:hover:text-purple-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      ref={shareInputRef}
                      type="text"
                      value={shareGraderSearch}
                      onChange={(e) => {
                        setShareGraderSearch(e.target.value);
                        setShowShareDropdown(true);
                        setShareHighlightIndex(0);
                      }}
                      onFocus={() => setShowShareDropdown(true)}
                      onKeyDown={handleShareKeyDown}
                      placeholder={selectedShareGraders.length === 0 ? "Pretrazi gradere..." : ""}
                      className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Dropdown */}
                  {showShareDropdown && filteredShareGraders.length > 0 && (
                    <div
                      ref={shareListRef}
                      className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg"
                    >
                      {filteredShareGraders.map((grader, idx) => (
                        <button
                          key={grader._id}
                          type="button"
                          data-highlighted={idx === shareHighlightIndex}
                          onClick={() => handleShareGraderSelect(grader)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            idx === shareHighlightIndex
                              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <span className="font-medium">{grader.name}</span>
                          {grader.email && (
                            <span className="ml-2 text-xs text-gray-400 dark:text-neutral-500">
                              ({grader.email})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {showShareDropdown && shareGraderSearch && filteredShareGraders.length === 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg">
                      <p className="text-sm text-gray-500 dark:text-neutral-400 text-center">
                        Nema rezultata za "{shareGraderSearch}"
                      </p>
                    </div>
                  )}
                </div>

                {selectedShareGraders.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2">
                    {selectedShareGraders.length} grader{selectedShareGraders.length === 1 ? '' : 'a'} izabrano
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShareModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Otkazi
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharingLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {sharingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  Podeli
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                Obrisi Coaching Sesiju?
              </h2>

              <p className="text-sm text-gray-500 dark:text-neutral-400 text-center mb-6">
                Ova akcija je nepovratna. Coaching sesija za <strong>{agent.name}</strong> ce biti trajno obrisana.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Otkazi
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Obrisi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Ticket Row Component
const TicketRow = ({ ticket, onClick }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (score >= 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-gray-900 dark:text-white">
              #{ticket.ticketId}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getScoreColor(ticket.score)}`}>
              {ticket.score}%
            </span>
            <span className="text-xs text-gray-400 dark:text-neutral-500">
              {new Date(ticket.gradedDate).toLocaleDateString('sr-RS')}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-2">
            {ticket.feedbackPreview || 'Nema feedback-a'}
          </p>
          {ticket.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ticket.categories.slice(0, 3).map((cat) => (
                <span key={cat} className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 rounded">
                  {cat}
                </span>
              ))}
              {ticket.categories.length > 3 && (
                <span className="px-1.5 py-0.5 text-[10px] text-gray-400 dark:text-neutral-500">
                  +{ticket.categories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
};

export default QACoachingDetail;
