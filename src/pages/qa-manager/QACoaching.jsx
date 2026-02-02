import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  GraduationCap, Search, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronDown, Plus, Trash2, Share2, Calendar, User, Filter, Users,
  CheckCircle2, Clock, AlertCircle, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useQAManager } from '../../context/QAManagerContext';
import { Badge } from '../../components/ui/badge';

const QACoaching = () => {
  const navigate = useNavigate();
  const { getAuthHeaders } = useQAManager();

  // State
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // New coaching modal
  const [showNewCoachingModal, setShowNewCoachingModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentSearch, setAgentSearch] = useState('');
  const [newAgentDropdownOpen, setNewAgentDropdownOpen] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState(4);
  const [weeksDropdownOpen, setWeeksDropdownOpen] = useState(false);

  // Share modal - category style (QA graders)
  const [shareModal, setShareModal] = useState({ open: false, session: null });
  const [allGradersForShare, setAllGradersForShare] = useState([]);
  const [selectedShareGraders, setSelectedShareGraders] = useState([]);
  const [shareGraderSearch, setShareGraderSearch] = useState('');
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [shareHighlightIndex, setShareHighlightIndex] = useState(0);
  const [sharingLoading, setSharingLoading] = useState(false);
  const shareInputRef = useRef(null);
  const shareDropdownRef = useRef(null);
  const shareListRef = useRef(null);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState({ open: false, session: null });
  const [deleting, setDeleting] = useState(false);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterAgent) params.append('agentId', filterAgent);
      if (filterStatus) params.append('status', filterStatus);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions?${params.toString()}`,
        getAuthHeaders()
      );
      setSessions(response.data.sessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('Greska pri ucitavanju coaching sesija');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, filterAgent, filterStatus]);

  // Fetch agents for new coaching dropdown
  const fetchAgents = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/qa/agents/all/existing`,
        getAuthHeaders()
      );
      setAgents(response.data);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, [getAuthHeaders]);

  // Fetch QA graders for sharing
  const fetchGradersForShare = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/graders`,
        getAuthHeaders()
      );
      setAllGradersForShare(response.data);
    } catch (err) {
      console.error('Error fetching graders for sharing:', err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchSessions();
    fetchAgents();
    fetchGradersForShare();
  }, [fetchSessions, fetchAgents, fetchGradersForShare]);

  // Generate new coaching
  const handleGenerateCoaching = async () => {
    if (!selectedAgent) {
      toast.error('Izaberi agenta');
      return;
    }

    setGenerating(true);
    try {
      const reportResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/report/${selectedAgent._id}?weeks=${selectedWeeks}`,
        getAuthHeaders()
      );

      const sessionResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions`,
        {
          agentId: selectedAgent._id,
          period: {
            weeks: selectedWeeks,
            startDate: reportResponse.data.period.startDate,
            endDate: reportResponse.data.period.endDate
          },
          reportData: {
            summary: reportResponse.data.summary,
            scorecardAnalysis: reportResponse.data.scorecardAnalysis,
            topIssueCategories: reportResponse.data.topIssueCategories,
            severityGroups: reportResponse.data.severityGroups,
            suggestedActions: reportResponse.data.suggestedActions
          }
        },
        getAuthHeaders()
      );

      toast.success('Coaching sesija kreirana');
      setShowNewCoachingModal(false);
      setSelectedAgent(null);
      setAgentSearch('');
      navigate(`/qa-manager/coaching/${sessionResponse.data._id}`);
    } catch (err) {
      console.error('Error generating coaching:', err);
      toast.error(err.response?.data?.message || 'Greska pri kreiranju coaching sesije');
    } finally {
      setGenerating(false);
    }
  };

  // Share modal handlers
  const handleOpenShareModal = (session, e) => {
    e.stopPropagation();
    setShareModal({ open: true, session });
    setSelectedShareGraders(session.sharedWith?.map(s => s.userId).filter(Boolean) || []);
    setShareGraderSearch('');
    setShowShareDropdown(false);
  };

  // Filter graders for share dropdown (exclude already selected)
  const filteredShareGraders = allGradersForShare.filter(grader =>
    grader.name?.toLowerCase().includes(shareGraderSearch.toLowerCase()) &&
    !selectedShareGraders.some(selected => selected?._id === grader._id)
  );

  // Handle share keyboard navigation
  const handleShareKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setShareHighlightIndex(prev =>
          Math.min(prev + 1, filteredShareGraders.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setShareHighlightIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredShareGraders[shareHighlightIndex]) {
          setSelectedShareGraders([...selectedShareGraders, filteredShareGraders[shareHighlightIndex]]);
          setShareGraderSearch('');
          setShareHighlightIndex(0);
          setTimeout(() => shareInputRef.current?.focus(), 0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowShareDropdown(false);
        setShareGraderSearch('');
        break;
      case 'Backspace':
        if (shareGraderSearch === '' && selectedShareGraders.length > 0) {
          setSelectedShareGraders(selectedShareGraders.slice(0, -1));
        }
        break;
      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (showShareDropdown && shareListRef.current) {
      const highlighted = shareListRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [shareHighlightIndex, showShareDropdown]);

  // Reset highlight when search changes
  useEffect(() => {
    setShareHighlightIndex(0);
  }, [shareGraderSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target)) {
        setShowShareDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = async () => {
    if (!shareModal.session) return;

    setSharingLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions/${shareModal.session._id}/share`,
        { userIds: selectedShareGraders.map(g => g._id) },
        getAuthHeaders()
      );
      toast.success('Coaching sesija azurirana');
      setShareModal({ open: false, session: null });
      fetchSessions();
    } catch (err) {
      console.error('Error sharing session:', err);
      toast.error('Greska pri deljenju');
    } finally {
      setSharingLoading(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteModal = (session, e) => {
    e.stopPropagation();
    setDeleteModal({ open: true, session });
  };

  const handleDelete = async () => {
    if (!deleteModal.session) return;

    setDeleting(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/qa/coaching/sessions/${deleteModal.session._id}`,
        getAuthHeaders()
      );
      toast.success('Coaching sesija obrisana');
      setDeleteModal({ open: false, session: null });
      fetchSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
      toast.error('Greska pri brisanju');
    } finally {
      setDeleting(false);
    }
  };

  // Filter agents for new coaching
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase())
  );

  // Get unique agents from sessions for filter
  const sessionAgents = [...new Map(sessions.map(s => [s.agent._id, s.agent])).values()];

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <AlertCircle className="w-3 h-3 mr-1" />
            Novo
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            U toku
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Zavrseno
          </Badge>
        );
      default:
        return null;
    }
  };

  // Trend icon helper
  const getTrendIcon = (trend, value) => {
    if (trend === 'improving') {
      return (
        <span className="flex items-center text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          +{value}%
        </span>
      );
    }
    if (trend === 'declining') {
      return (
        <span className="flex items-center text-red-600 dark:text-red-400">
          <TrendingDown className="w-4 h-4 mr-1" />
          {value}%
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-500 dark:text-neutral-400">
        <Minus className="w-4 h-4 mr-1" />
        {value}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />
            Coaching Sesije
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Upravljaj coaching sesijama za agente
          </p>
        </div>

        <button
          onClick={() => setShowNewCoachingModal(true)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Nova Coaching Sesija</span>
          <span className="xs:hidden">Nova Sesija</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
        {/* Agent Filter */}
        <div className="relative flex-1 sm:flex-none">
          <button
            onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
            className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm hover:border-gray-300 dark:hover:border-neutral-600 transition-colors sm:min-w-[180px]"
          >
            <Filter className="w-4 h-4 text-gray-400" />
            <span className={filterAgent ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
              {filterAgent ? sessionAgents.find(a => a._id === filterAgent)?.name : 'Svi agenti'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
          </button>

          {agentDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAgentDropdownOpen(false)} />
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
                <button
                  onClick={() => { setFilterAgent(''); setAgentDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 ${!filterAgent ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-neutral-300'}`}
                >
                  Svi agenti
                </button>
                {sessionAgents.map(agent => (
                  <button
                    key={agent._id}
                    onClick={() => { setFilterAgent(agent._id); setAgentDropdownOpen(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 ${filterAgent === agent._id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-neutral-300'}`}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative flex-1 sm:flex-none">
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm hover:border-gray-300 dark:hover:border-neutral-600 transition-colors sm:min-w-[140px]"
          >
            <span className={filterStatus ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
              {filterStatus === 'new' ? 'Novo' : filterStatus === 'in_progress' ? 'U toku' : filterStatus === 'completed' ? 'Zavrseno' : 'Svi statusi'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
          </button>

          {statusDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)} />
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
                {[
                  { value: '', label: 'Svi statusi' },
                  { value: 'new', label: 'Novo' },
                  { value: 'in_progress', label: 'U toku' },
                  { value: 'completed', label: 'Zavrseno' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterStatus(opt.value); setStatusDropdownOpen(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 ${filterStatus === opt.value ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-neutral-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 sm:ml-auto text-center sm:text-right">
          {sessions.length} sesija
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
          <GraduationCap className="w-16 h-16 mx-auto text-gray-300 dark:text-neutral-700 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nema coaching sesija
          </h3>
          <p className="text-gray-500 dark:text-neutral-400 mb-6">
            Kreiraj prvu coaching sesiju za agenta
          </p>
          <button
            onClick={() => setShowNewCoachingModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Coaching Sesija
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer group"
              onClick={() => navigate(`/qa-manager/coaching/${session._id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {session.agent?.name || 'Unknown Agent'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    {session.agent?.position || 'Agent'}
                  </p>
                </div>
                {getStatusBadge(session.status)}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {session.reportData.summary.avgScore}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">Prosek</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {session.reportData.summary.ticketsWithIssues}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">Problemi</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <div className="text-sm font-medium">
                    {getTrendIcon(session.reportData.summary.trend, session.reportData.summary.trendValue)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">Trend</p>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-400 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(session.createdAt).toLocaleDateString('sr-RS')}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {session.generatedBy.name || session.generatedBy.email?.split('@')[0]}
                </span>
              </div>

              {/* Shared With QA Graders */}
              {session.sharedWith?.filter(s => s.userId).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Podeljeno sa:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {session.sharedWith.filter(s => s.userId).slice(0, 3).map((share) => (
                      <span
                        key={share.userId._id}
                        className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full"
                      >
                        {share.userId.name}
                      </span>
                    ))}
                    {session.sharedWith.filter(s => s.userId).length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-400 dark:text-neutral-500">
                        +{session.sharedWith.filter(s => s.userId).length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleOpenShareModal(session, e)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  Podeli
                </button>
                <button
                  onClick={(e) => handleOpenDeleteModal(session, e)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                  Obrisi
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Coaching Modal */}
      <AnimatePresence>
        {showNewCoachingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowNewCoachingModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-500" />
                Nova Coaching Sesija
              </h2>

              {/* Agent Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Agent
                </label>
                <div className="relative">
                  <button
                    onClick={() => setNewAgentDropdownOpen(!newAgentDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-left hover:border-gray-400 dark:hover:border-neutral-600 transition-colors"
                  >
                    <span className={selectedAgent ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-neutral-500'}>
                      {selectedAgent?.name || 'Izaberi agenta...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${newAgentDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {newAgentDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-200 dark:border-neutral-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={agentSearch}
                            onChange={(e) => setAgentSearch(e.target.value)}
                            placeholder="Pretrazi agente..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredAgents.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-400">
                            Nema rezultata
                          </div>
                        ) : (
                          filteredAgents.map((agent) => (
                            <button
                              key={agent._id}
                              onClick={() => {
                                setSelectedAgent(agent);
                                setNewAgentDropdownOpen(false);
                                setAgentSearch('');
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                                selectedAgent?._id === agent._id ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-neutral-300'
                              }`}
                            >
                              {agent.name}
                              {agent.position && (
                                <span className="ml-2 text-xs text-gray-400 dark:text-neutral-500">
                                  ({agent.position})
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Period Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Period
                </label>
                <div className="relative">
                  <button
                    onClick={() => setWeeksDropdownOpen(!weeksDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-left hover:border-gray-400 dark:hover:border-neutral-600 transition-colors"
                  >
                    <span className="text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {selectedWeeks} nedelja
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${weeksDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {weeksDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
                      {[2, 4, 6, 8].map((weeks) => (
                        <button
                          key={weeks}
                          onClick={() => {
                            setSelectedWeeks(weeks);
                            setWeeksDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                            selectedWeeks === weeks ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-neutral-300'
                          }`}
                        >
                          {weeks} nedelja
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewCoachingModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Otkazi
                </button>
                <button
                  onClick={handleGenerateCoaching}
                  disabled={!selectedAgent || generating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-neutral-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generisanje...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" />
                      Kreiraj
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal - Category Style */}
      <AnimatePresence>
        {shareModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShareModal({ open: false, session: null })} />
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
              <div ref={shareDropdownRef} className="relative mb-6">
                <div
                  className={`flex flex-wrap items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-white dark:bg-neutral-800 cursor-text min-h-[42px] border ${
                    showShareDropdown ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-300 dark:border-neutral-700'
                  }`}
                  onClick={() => shareInputRef.current?.focus()}
                >
                  {selectedShareGraders.map(grader => (
                    <span
                      key={grader._id}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full"
                    >
                      {grader.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShareGraders(selectedShareGraders.filter(g => g._id !== grader._id));
                        }}
                        className="hover:text-purple-900 dark:hover:text-purple-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={shareInputRef}
                    type="text"
                    value={shareGraderSearch}
                    onChange={(e) => setShareGraderSearch(e.target.value)}
                    onFocus={() => setShowShareDropdown(true)}
                    onKeyDown={handleShareKeyDown}
                    placeholder={selectedShareGraders.length === 0 ? "Pretrazi gradere..." : ""}
                    className="flex-1 min-w-[100px] bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
                  />
                </div>

                {showShareDropdown && (
                  <div
                    ref={shareListRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredShareGraders.length > 0 ? (
                      filteredShareGraders.map((grader, index) => (
                        <button
                          key={grader._id}
                          type="button"
                          data-highlighted={shareHighlightIndex === index}
                          onClick={() => {
                            setSelectedShareGraders([...selectedShareGraders, grader]);
                            setShareGraderSearch('');
                            setShareHighlightIndex(0);
                            setTimeout(() => shareInputRef.current?.focus(), 0);
                          }}
                          onMouseEnter={() => setShareHighlightIndex(index)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            shareHighlightIndex === index
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                              : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {grader.name}
                          {grader.email && (
                            <span className="ml-2 text-xs text-gray-400 dark:text-neutral-500">
                              ({grader.email})
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-500">
                        {shareGraderSearch ? 'Nema rezultata' : 'Svi graderi dodati'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShareModal({ open: false, session: null })}
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
                  Sacuvaj
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteModal({ open: false, session: null })} />
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
                Ova akcija je nepovratna. Coaching sesija za <strong>{deleteModal.session?.agent?.name}</strong> ce biti trajno obrisana.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, session: null })}
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

export default QACoaching;
