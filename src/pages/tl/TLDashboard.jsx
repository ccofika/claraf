import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Users, Loader2, AlertTriangle, BarChart3, Target, TrendingUp, TrendingDown,
  ChevronRight, CheckCircle2, AlertCircle, Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { useTL } from './TLLayout';
import { Badge } from '../../components/ui/badge';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const getScoreColor = (score) => {
  if (score == null) return 'text-gray-400';
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreBg = (score) => {
  if (score == null) return 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400';
  if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (score >= 70) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (score >= 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data || data.teams.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
        <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-neutral-700 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nema dodeljenih timova
        </h3>
        <p className="text-gray-500 dark:text-neutral-400">
          Kontaktiraj admina da ti dodeli timove.
        </p>
      </div>
    );
  }

  const { overall, teamSummaries } = data;

  return (
    <div className="space-y-8">
      {/* Team Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Moji Timovi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {teamSummaries.map((team) => (
            <motion.div
              key={team.teamName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
              onClick={() => navigate(`/tl/team/${encodeURIComponent(team.teamName)}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {team.teamName}
                </h3>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-neutral-400 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {team.agentCount} agenata
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  {team.ticketCount} tik.
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Avg Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(team.avgScore)}`}>
                    {team.avgScore != null ? `${team.avgScore}%` : '-'}
                  </p>
                </div>
                {team.worstCategory && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-neutral-400">Najgora kat.</p>
                    <p className="text-sm text-gray-700 dark:text-neutral-300 font-medium truncate max-w-[120px]">
                      {team.worstCategory.name}
                    </p>
                    <p className={`text-xs font-medium ${getScoreColor(team.worstCategory.avgScore)}`}>
                      {team.worstCategory.avgScore}%
                    </p>
                  </div>
                )}
              </div>

              {/* Score bar */}
              {team.avgScore != null && (
                <div className="mt-3 h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      team.avgScore >= 90 ? 'bg-green-500' :
                      team.avgScore >= 70 ? 'bg-yellow-500' :
                      team.avgScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${team.avgScore}%` }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Overall Section */}
      {overall && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overall</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
              <span>{overall.totalAgents} agenata</span>
              <span>|</span>
              <span>{overall.totalTickets} tiketa</span>
              {overall.avgScore != null && (
                <>
                  <span>|</span>
                  <span className={getScoreColor(overall.avgScore)}>Avg: {overall.avgScore}%</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Scorecard & Categories */}
            <div className="lg:col-span-2 space-y-6">
              {/* Scorecard Analysis */}
              <ScorecardAnalysis data={overall.scorecardAnalysis} />

              {/* Agent Performance Table */}
              <AgentPerformanceTable agents={overall.agentPerformance} onAgentClick={(id) => navigate(`/tl/agent/${id}`)} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Top Categories */}
              <TopCategories categories={overall.topCategories} />

              {/* Top & Bottom Performers */}
              <TopBottomPerformers
                top={overall.topPerformers}
                bottom={overall.bottomPerformers}
                onAgentClick={(id) => navigate(`/tl/agent/${id}`)}
              />

              {/* Score Distribution */}
              <ScoreDistribution data={overall.scoreDistribution} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Shared Components ====================

export const ScorecardAnalysis = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-indigo-500" />
        Scorecard Analiza
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Strengths
          </h4>
          <div className="space-y-2">
            {data.strengths.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nema strengths iznad 80%</p>
            ) : (
              data.strengths.map((s) => (
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
            {data.weaknesses.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Sve oblasti iznad 80%</p>
            ) : (
              data.weaknesses.map((w) => (
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
  );
};

export const TopCategories = ({ categories }) => {
  if (!categories) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-500" />
        Top Kategorije
      </h3>
      <div className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nema kategorija</p>
        ) : (
          categories.map((cat, idx) => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-medium bg-gray-100 dark:bg-neutral-800 rounded-full flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-neutral-300 truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {cat.count}x
                </Badge>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getScoreBg(cat.avgScore)}`}>
                  {cat.avgScore}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const AgentPerformanceTable = ({ agents, onAgentClick }) => {
  if (!agents || agents.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-500" />
        Agent Performance
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-neutral-800">
              <th className="text-left py-2 pr-4 text-gray-500 dark:text-neutral-400 font-medium">Agent</th>
              <th className="text-center py-2 px-2 text-gray-500 dark:text-neutral-400 font-medium">Tickets</th>
              <th className="text-center py-2 px-2 text-gray-500 dark:text-neutral-400 font-medium">Avg Score</th>
              <th className="text-left py-2 pl-4 text-gray-500 dark:text-neutral-400 font-medium w-32">Performance</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr
                key={agent._id}
                className="border-b border-gray-100 dark:border-neutral-800/50 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                onClick={() => onAgentClick(agent._id)}
              >
                <td className="py-2.5 pr-4">
                  <span className="font-medium text-gray-900 dark:text-white">{agent.name}</span>
                </td>
                <td className="py-2.5 px-2 text-center text-gray-600 dark:text-neutral-400">
                  {agent.tickets}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${getScoreColor(agent.avgScore)}`}>
                    {agent.avgScore != null ? `${agent.avgScore}%` : '-'}
                  </span>
                </td>
                <td className="py-2.5 pl-4">
                  {agent.avgScore != null && (
                    <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden w-full">
                      <div
                        className={`h-full rounded-full ${
                          agent.avgScore >= 90 ? 'bg-green-500' :
                          agent.avgScore >= 70 ? 'bg-yellow-500' :
                          agent.avgScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
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
    </div>
  );
};

export const TopBottomPerformers = ({ top, bottom, onAgentClick }) => {
  if ((!top || top.length === 0) && (!bottom || bottom.length === 0)) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top & Bottom Performers
      </h3>

      {top && top.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Top Performers
          </h4>
          <div className="space-y-1.5">
            {top.map((agent) => (
              <button
                key={agent._id}
                onClick={() => onAgentClick(agent._id)}
                className="w-full flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/15 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/25 transition-colors text-left"
              >
                <span className="text-sm text-gray-700 dark:text-neutral-300">{agent.name}</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {agent.avgScore != null ? `${agent.avgScore}%` : '-'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {bottom && bottom.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            Needs Improvement
          </h4>
          <div className="space-y-1.5">
            {bottom.map((agent) => (
              <button
                key={agent._id}
                onClick={() => onAgentClick(agent._id)}
                className="w-full flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/15 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/25 transition-colors text-left"
              >
                <span className="text-sm text-gray-700 dark:text-neutral-300">{agent.name}</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {agent.avgScore != null ? `${agent.avgScore}%` : '-'}
                </span>
              </button>
            ))}
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
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Score Distribution
      </h3>
      <div className="space-y-2.5">
        {data.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-neutral-400 w-12 text-right">{bucket.label}</span>
            <div className="flex-1 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  bucket.label === '80-100' ? 'bg-green-500' :
                  bucket.label === '60-80' ? 'bg-yellow-500' :
                  bucket.label === '40-60' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(bucket.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-neutral-300 w-8 text-right">
              {bucket.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TLDashboard;
