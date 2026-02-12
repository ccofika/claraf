import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Users, Loader2, AlertTriangle, BarChart3, Target, TrendingUp, TrendingDown,
  ChevronRight, ChevronDown, CheckCircle2, AlertCircle, Hash, X, ExternalLink,
  FileText, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useTL } from './TLLayout';
import { Badge } from '../../components/ui/badge';
import { SHORT_LABELS, getScorecardValues } from '../../data/scorecardConfig';
import { TicketContentDisplay } from '../../components/TicketRichTextEditor';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const getScoreColor = (score) => {
  if (score == null) return 'text-gray-400 dark:text-[#5B5D67]';
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 70) return 'text-amber-600 dark:text-amber-400';
  if (score >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreBg = (score) => {
  if (score == null) return 'bg-gray-100 text-gray-500 dark:bg-[#1E1E28] dark:text-[#6B6D77]';
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (score >= 70) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
  if (score >= 50) return 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
  return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
};

const getScoreBarColor = (score) => {
  if (score >= 90) return 'bg-emerald-500 dark:bg-emerald-400';
  if (score >= 70) return 'bg-amber-500 dark:bg-amber-400';
  if (score >= 50) return 'bg-orange-500 dark:bg-orange-400';
  return 'bg-red-500 dark:bg-red-400';
};

const getScoreDot = (score) => {
  if (score == null) return 'bg-gray-300 dark:bg-[#3A3A45]';
  if (score >= 90) return 'bg-emerald-500 dark:bg-emerald-400';
  if (score >= 70) return 'bg-amber-500 dark:bg-amber-400';
  if (score >= 50) return 'bg-orange-500 dark:bg-orange-400';
  return 'bg-red-500 dark:bg-red-400';
};

const INITIAL_CATEGORIES_COUNT = 5;

const TLDashboard = () => {
  const { period } = useTL();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/tl/dashboard?period=${period}`,
        getAuthHeaders()
      );
      setData(response.data);
    } catch (err) {
      console.error('Error fetching TL dashboard:', err);
      toast.error('Greska pri ucitavanju dashboard-a');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  if (!data || data.teams?.length === 0) {
    return (
      <div className="text-center py-20">
        <Users className="w-10 h-10 mx-auto text-gray-200 dark:text-[#2A2A35] mb-3" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-1">
          Nema dodeljenih timova
        </h3>
        <p className="text-sm text-gray-500 dark:text-[#6B6D77]">
          Kontaktiraj admina da ti dodeli timove.
        </p>
      </div>
    );
  }

  const { overall, teamSummaries } = data;

  const navigateToAgent = (agentId) => {
    const agent = overall?.agentPerformance?.find(a => a._id === agentId);
    navigate(`/tl/agent/${agentId}`, { state: { teamName: agent?.team, agentName: agent?.name } });
  };

  return (
    <div className="space-y-12">
      {/* Teams Table */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED] mb-5">
          Moji Timovi
        </h2>
        <div className="bg-gray-50 dark:bg-[#111116] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200/60 dark:border-[#1E1E28]">
                <th className="text-left py-3 px-5 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Tim</th>
                <th className="text-center py-3 px-4 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Agenti</th>
                <th className="text-center py-3 px-4 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Tiketa</th>
                <th className="text-left py-3 px-4 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Avg Score</th>
                <th className="text-left py-3 px-4 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider hidden md:table-cell">Najgora Kategorija</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {teamSummaries.map((team, idx) => (
                <tr
                  key={team.teamName}
                  className={`hover:bg-gray-100/60 dark:hover:bg-[#1A1A21] cursor-pointer transition-colors ${idx < teamSummaries.length - 1 ? 'border-b border-gray-200/40 dark:border-[#1A1A21]' : ''}`}
                  onClick={() => navigate(`/tl/team/${encodeURIComponent(team.teamName)}`)}
                >
                  <td className="py-4 px-5">
                    <span className="font-medium text-gray-900 dark:text-[#E8E9ED]">{team.teamName}</span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-500 dark:text-[#6B6D77]">{team.agentCount}</td>
                  <td className="py-4 px-4 text-center text-gray-500 dark:text-[#6B6D77]">{team.ticketCount}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-[52px]">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getScoreDot(team.avgScore)}`} />
                        <span className={`font-semibold ${getScoreColor(team.avgScore)}`}>
                          {team.avgScore != null ? `${team.avgScore}%` : '-'}
                        </span>
                      </div>
                      {team.avgScore != null && (
                        <div className="hidden sm:block w-24 h-1.5 bg-gray-200/60 dark:bg-[#1E1E28] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getScoreBarColor(team.avgScore)}`}
                            style={{ width: `${team.avgScore}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 hidden md:table-cell">
                    {team.worstCategory ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-[#A0A2AC] truncate max-w-[140px]">{team.worstCategory.name}</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getScoreBg(team.worstCategory.avgScore)}`}>
                          {team.worstCategory.avgScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-[#3A3A45]">-</span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-[#3A3A45]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Overall */}
      {overall && (
        <section>
          <div className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED] mb-1">Overall</h2>
            <p className="text-sm text-gray-400 dark:text-[#5B5D67]">
              {overall.totalAgents} agenata · {overall.totalTickets} tiketa
              {overall.avgScore != null && <> · <span className={getScoreColor(overall.avgScore)}>Avg: {overall.avgScore}%</span></>}
            </p>
          </div>

          {/* Agent Performance - full width */}
          <AgentPerformanceTable agents={overall.agentPerformance} onAgentClick={navigateToAgent} />

          {/* Analysis grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8 items-start">
            <ScorecardAnalysis data={overall.scorecardAnalysis} />
            <TopBottomPerformers
              top={overall.topPerformers}
              bottom={overall.bottomPerformers}
              onAgentClick={navigateToAgent}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-start">
            <TopCategories categories={overall.topCategories} scope="dashboard" />
            <ScoreDistribution data={overall.scoreDistribution} />
          </div>
        </section>
      )}
    </div>
  );
};

// ==================== Shared Components ====================

export const ScorecardAnalysis = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-5 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
        Scorecard Analiza
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Strengths
          </h4>
          {data.strengths.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-[#5B5D67] italic py-1">Nema strengths</p>
          ) : (
            <div className="space-y-1">
              {data.strengths.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700 dark:text-[#A0A2AC] truncate pr-3">{s.name}</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">{s.avgScore}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Areas for Improvement
          </h4>
          {data.weaknesses.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-[#5B5D67] italic py-1">Sve oblasti na 100%</p>
          ) : (
            <div className="space-y-1">
              {data.weaknesses.map((w) => (
                <div key={w.key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700 dark:text-[#A0A2AC] truncate pr-3">{w.name}</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400 flex-shrink-0">{w.avgScore}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TopCategories = ({ categories, scope = 'dashboard', teamName, agentId }) => {
  const { period } = useTL();
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTickets, setCategoryTickets] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);

  if (!categories) return null;

  const displayedCategories = showAll ? categories : categories.slice(0, INITIAL_CATEGORIES_COUNT);
  const hasMore = categories.length > INITIAL_CATEGORIES_COUNT;

  const handleCategoryClick = async (categoryName) => {
    setSelectedCategory(categoryName);
    setPanelLoading(true);
    try {
      const params = new URLSearchParams({ category: categoryName, scope, period });
      if (teamName) params.append('teamName', teamName);
      if (agentId) params.append('agentId', agentId);

      const response = await axios.get(
        `${API_URL}/api/tl/category-tickets?${params.toString()}`,
        getAuthHeaders()
      );
      setCategoryTickets(response.data);
    } catch (err) {
      console.error('Error fetching category tickets:', err);
      toast.error('Greska pri ucitavanju tiketa za kategoriju');
    } finally {
      setPanelLoading(false);
    }
  };

  const closePanel = () => {
    setSelectedCategory(null);
    setCategoryTickets(null);
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
          Top Kategorije
        </h3>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-[#5B5D67] italic py-1">Nema kategorija</p>
        ) : (
          <>
            <div className="space-y-0.5">
              {displayedCategories.map((cat, idx) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="w-full flex items-center justify-between hover:bg-white dark:hover:bg-[#1A1A21] py-2.5 px-2 rounded transition-colors group -mx-0.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-semibold bg-white dark:bg-[#1A1A21] text-gray-500 dark:text-[#6B6D77] rounded flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-[#A0A2AC] truncate group-hover:text-gray-900 dark:group-hover:text-[#E8E9ED]">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 dark:text-[#5B5D67]">
                      {cat.count}x
                    </span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getScoreBg(cat.avgScore)}`}>
                      {cat.avgScore}%
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-1 py-2 mt-2 text-sm font-medium text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-white dark:hover:bg-[#1A1A21] rounded transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${showAll ? 'rotate-180' : ''}`} />
                {showAll ? 'Manje' : `Sve (${categories.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {selectedCategory && createPortal(
        <CategoryTicketsPanel
          category={selectedCategory}
          data={categoryTickets}
          loading={panelLoading}
          onClose={closePanel}
        />,
        document.body
      )}
    </>
  );
};

const CategoryTicketsPanel = ({ category, data, loading, onClose }) => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fullTicketData, setFullTicketData] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedTicket) {
          setSelectedTicket(null);
          setFullTicketData(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedTicket]);

  const handleTicketClick = async (ticket) => {
    setSelectedTicket(ticket);
    setTicketLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/tickets/${ticket._id}`,
        getAuthHeaders()
      );
      setFullTicketData(response.data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      toast.error('Greska pri ucitavanju tiketa');
    } finally {
      setTicketLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setFullTicketData(null);
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (score >= 70) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    if (score >= 50) return 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
    return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex"
      >
        <div className="absolute inset-0 bg-black/15" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-[#141419] shadow-xl sm:border-l border-gray-200 dark:border-[#1E1E28] flex flex-col"
        >
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-gray-200 dark:border-[#1E1E28]">
            <div className="flex items-center gap-2 min-w-0">
              {selectedTicket && (
                <button onClick={handleBackToList} className="p-1 hover:bg-gray-100 dark:hover:bg-[#1E1E28] rounded">
                  <ArrowLeft className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
                </button>
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] truncate">
                  {selectedTicket ? `Ticket #${selectedTicket.ticketId}` : category}
                </h3>
                {!selectedTicket && data && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-500 dark:text-[#6B6D77]">{data.totalCount} tiketa</span>
                    {data.avgScore != null && (
                      <>
                        <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-[#3A3A45]" />
                        <span className={`text-sm font-medium ${getScoreColor(data.avgScore)}`}>Avg: {data.avgScore}%</span>
                      </>
                    )}
                  </div>
                )}
                {selectedTicket && (
                  <p className="text-sm text-gray-500 dark:text-[#6B6D77] mt-0.5">
                    {selectedTicket.agentName}
                    <span className="inline-block w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-[#3A3A45] mx-1 align-middle" />
                    {new Date(selectedTicket.gradedDate).toLocaleDateString('sr-RS')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedTicket && (
                <a
                  href={`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${selectedTicket.ticketId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1E1E28] rounded"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500 dark:text-[#6B6D77]" />
                </a>
              )}
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1E1E28] rounded">
                <X className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedTicket ? (
              ticketLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
                </div>
              ) : fullTicketData ? (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 text-sm font-bold rounded ${getScoreBadgeColor(fullTicketData.qualityScorePercent)}`}>
                      {fullTicketData.qualityScorePercent}%
                    </span>
                    {fullTicketData.categories?.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs rounded">
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  {fullTicketData.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-[#6B6D77] mb-1.5">Notes</h4>
                      <div className="bg-gray-50 dark:bg-[#1A1A21] rounded p-3 border border-gray-100 dark:border-[#1E1E28]">
                        <TicketContentDisplay content={fullTicketData.notes} className="text-sm text-gray-700 dark:text-[#A0A2AC]" />
                      </div>
                    </div>
                  )}

                  {fullTicketData.feedback && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-[#6B6D77] mb-1.5">Feedback</h4>
                      <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded p-3 border border-blue-100/50 dark:border-blue-500/10">
                        <TicketContentDisplay content={fullTicketData.feedback} className="text-sm text-gray-700 dark:text-[#A0A2AC]" />
                      </div>
                    </div>
                  )}

                  {fullTicketData.scorecardValues && Object.keys(fullTicketData.scorecardValues).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-[#6B6D77] mb-1.5">Scorecard</h4>
                      <div className="bg-gray-50 dark:bg-[#1A1A21] rounded p-3 border border-gray-100 dark:border-[#1E1E28] space-y-1.5">
                        {(() => {
                          const position = fullTicketData.agent?.position;
                          const variant = fullTicketData.scorecardVariant;
                          const configValues = position ? getScorecardValues(position, variant) : [];
                          const configMap = {};
                          configValues.forEach(v => { configMap[v.key] = v; });

                          return Object.entries(fullTicketData.scorecardValues).map(([key, value]) => {
                            const configItem = configMap[key];
                            const label = configItem?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            const displayLabel = value !== null && value !== undefined && SHORT_LABELS[value] ? SHORT_LABELS[value] : '-';

                            const getBgClass = (idx) => {
                              if (idx === null || idx === undefined) return 'bg-gray-100 dark:bg-[#252530]';
                              switch (idx) {
                                case 0: return 'bg-emerald-500';
                                case 1: return 'bg-amber-400';
                                case 2: return 'bg-amber-500';
                                case 3: return 'bg-red-500';
                                case 4: return 'bg-gray-400 dark:bg-gray-500';
                                default: return 'bg-gray-100 dark:bg-[#252530]';
                              }
                            };

                            const getTextClass = (idx) => {
                              if (idx === null || idx === undefined) return 'text-gray-500 dark:text-[#6B6D77]';
                              if (idx === 1) return 'text-gray-900';
                              return 'text-white';
                            };

                            return (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-[#8B8D97] truncate pr-2">{label}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${getBgClass(value)} ${getTextClass(value)}`}>
                                  {displayLabel}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-[#6B6D77]">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Greska pri ucitavanju tiketa</p>
                </div>
              )
            ) : (
              loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
                </div>
              ) : !data || data.tickets.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-[#6B6D77]">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nema tiketa za ovu kategoriju</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#1E1E28]">
                  {data.tickets.map((ticket) => (
                    <button
                      key={ticket._id}
                      onClick={() => handleTicketClick(ticket)}
                      className="w-full text-left px-5 sm:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-[#1A1A21] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-sm text-gray-900 dark:text-[#E8E9ED] font-medium">#{ticket.ticketId}</span>
                          <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${getScoreBadgeColor(ticket.score)}`}>
                            {ticket.score}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs text-gray-400 dark:text-[#5B5D67]">
                            {new Date(ticket.gradedDate).toLocaleDateString('sr-RS')}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-[#3A3A45]" />
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-[#6B6D77] mb-0.5">
                        {ticket.agentName}
                        {ticket.agentTeam && (
                          <>
                            <span className="inline-block w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-[#3A3A45] mx-1 align-middle" />
                            <span className="text-gray-400 dark:text-[#5B5D67]">{ticket.agentTeam}</span>
                          </>
                        )}
                      </p>

                      {ticket.feedbackPreview && (
                        <p className="text-sm text-gray-400 dark:text-[#5B5D67] line-clamp-2">{ticket.feedbackPreview}</p>
                      )}

                      {ticket.categories?.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ticket.categories.filter(c => c !== category).slice(0, 3).map((cat) => (
                            <span key={cat} className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-[#1E1E28] text-gray-500 dark:text-[#6B6D77] rounded">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const AgentPerformanceTable = ({ agents, onAgentClick }) => {
  if (!agents || agents.length === 0) return null;

  const mid = Math.ceil(agents.length / 2);
  const leftAgents = agents.slice(0, mid);
  const rightAgents = agents.slice(mid);

  const renderTable = (list, startIdx) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200/60 dark:border-[#1E1E28]">
            <th className="text-left py-2.5 pr-2 pl-4 w-8 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">#</th>
            <th className="text-left py-2.5 pr-3 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Agent</th>
            <th className="text-center py-2.5 px-2 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Tickets</th>
            <th className="text-center py-2.5 px-2 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Score</th>
            <th className="text-left py-2.5 pl-3 pr-4 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider w-20 hidden sm:table-cell"></th>
          </tr>
        </thead>
        <tbody>
          {list.map((agent, idx) => (
            <tr
              key={agent._id}
              className={`hover:bg-gray-100/60 dark:hover:bg-[#1A1A21] cursor-pointer transition-colors ${idx < list.length - 1 ? 'border-b border-gray-200/40 dark:border-[#1A1A21]' : ''}`}
              onClick={() => onAgentClick(agent._id)}
            >
              <td className="py-2.5 pr-2 pl-4">
                <span className="text-xs font-semibold text-gray-400 dark:text-[#5B5D67]">{startIdx + idx + 1}</span>
              </td>
              <td className="py-2.5 pr-3">
                <span className="font-medium text-gray-900 dark:text-[#E8E9ED]">{agent.name}</span>
              </td>
              <td className="py-2.5 px-2 text-center text-gray-500 dark:text-[#6B6D77]">{agent.tickets}</td>
              <td className="py-2.5 px-2 text-center">
                <span className={`font-semibold ${getScoreColor(agent.avgScore)}`}>
                  {agent.avgScore != null ? `${agent.avgScore}%` : '-'}
                </span>
              </td>
              <td className="py-2.5 pl-3 pr-4 hidden sm:table-cell">
                {agent.avgScore != null && (
                  <div className="h-1.5 bg-gray-200/60 dark:bg-[#1E1E28] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(agent.avgScore)}`}
                      style={{ width: `${agent.avgScore}%` }}
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-[#111116] rounded-lg overflow-hidden">
      <div className="px-5 sm:px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
          Agent Performance ({agents.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-gray-200/40 dark:divide-[#1E1E28]">
        <div>{renderTable(leftAgents, 0)}</div>
        {rightAgents.length > 0 && <div>{renderTable(rightAgents, mid)}</div>}
      </div>
    </div>
  );
};

export const TopBottomPerformers = ({ top, bottom, onAgentClick }) => {
  const [showAllBottom, setShowAllBottom] = useState(false);

  if ((!top || top.length === 0) && (!bottom || bottom.length === 0)) return null;

  const displayedTop = (top || []).slice(0, 5);
  const displayedBottom = showAllBottom ? (bottom || []) : (bottom || []).slice(0, 5);
  const hasMoreBottom = (bottom || []).length > 5;

  return (
    <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
        Top & Bottom
      </h3>

      {displayedTop.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Top ({displayedTop.length})
          </h4>
          <div className="space-y-0.5">
            {displayedTop.map((agent) => (
              <button
                key={agent._id}
                onClick={() => onAgentClick(agent._id)}
                className="w-full flex items-center justify-between py-2 px-2 rounded hover:bg-white dark:hover:bg-[#1A1A21] transition-colors text-left -mx-0.5"
              >
                <span className="text-sm text-gray-700 dark:text-[#A0A2AC] truncate pr-2">{agent.name}</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  {agent.avgScore != null ? `${agent.avgScore}%` : '-'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(bottom || []).length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            Needs Improvement ({(bottom || []).length})
          </h4>
          <div className="space-y-0.5">
            {displayedBottom.map((agent) => (
              <button
                key={agent._id}
                onClick={() => onAgentClick(agent._id)}
                className="w-full flex items-center justify-between py-2 px-2 rounded hover:bg-white dark:hover:bg-[#1A1A21] transition-colors text-left -mx-0.5"
              >
                <span className="text-sm text-gray-700 dark:text-[#A0A2AC] truncate pr-2">{agent.name}</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 flex-shrink-0">
                  {agent.avgScore != null ? `${agent.avgScore}%` : '-'}
                </span>
              </button>
            ))}
            {hasMoreBottom && (
              <button
                onClick={() => setShowAllBottom(!showAllBottom)}
                className="w-full py-2 mt-1 text-sm font-medium text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-white dark:hover:bg-[#1A1A21] rounded transition-colors flex items-center justify-center gap-1"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${showAllBottom ? 'rotate-180' : ''}`} />
                {showAllBottom ? 'Manje' : `Jos (${(bottom || []).length - 5})`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ScoreDistribution = ({ data }) => {
  if (!data) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
        Score Distribution
      </h3>
      <div className="space-y-2.5">
        {data.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-2.5">
            <span className="text-xs text-gray-400 dark:text-[#5B5D67] w-11 text-right font-medium">{bucket.label}</span>
            <div className="flex-1 h-5 bg-white dark:bg-[#1A1A21] rounded overflow-hidden">
              <div
                className={`h-full rounded ${
                  bucket.label === '80-100' ? 'bg-emerald-500 dark:bg-emerald-400' :
                  bucket.label === '60-80' ? 'bg-amber-500 dark:bg-amber-400' :
                  bucket.label === '40-60' ? 'bg-orange-500 dark:bg-orange-400' :
                  'bg-red-500 dark:bg-red-400'
                }`}
                style={{ width: `${(bucket.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-[#6B6D77] w-7 text-right">
              {bucket.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TLDashboard;
