import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Users, Loader2, AlertTriangle, ChevronRight, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { useTL } from './TLLayout';
import {
  ScorecardAnalysis,
  TopCategories,
  AgentPerformanceTable,
  TopBottomPerformers,
  ScoreDistribution
} from './TLDashboard';

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

const TLTeamDetail = () => {
  const { teamName } = useParams();
  const { period } = useTL();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const decodedTeamName = decodeURIComponent(teamName);

  const fetchTeamDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/tl/team/${encodeURIComponent(decodedTeamName)}?period=${period}`,
        getAuthHeaders()
      );
      setData(response.data);
    } catch (err) {
      console.error('Error fetching team detail:', err);
      if (err.response?.status === 403) {
        toast.error('Nemas pristup ovom timu');
        navigate('/tl');
      } else {
        toast.error('Greska pri ucitavanju tima');
      }
    } finally {
      setLoading(false);
    }
  }, [decodedTeamName, period, navigate]);

  useEffect(() => {
    fetchTeamDetail();
  }, [fetchTeamDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Greska</h2>
        <p className="text-gray-500 dark:text-neutral-400">Tim nije pronadjen</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Team Summary Stats */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Agenti</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.totalAgents}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Tiketa</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.totalTickets}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Avg Score</p>
            <p className={`text-2xl font-bold mt-1 ${getScoreColor(data.avgScore)}`}>
              {data.avgScore != null ? `${data.avgScore}%` : '-'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Tim</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">{data.teamName}</p>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Agenti ({data.agentPerformance.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.agentPerformance.map((agent, idx) => (
            <motion.div
              key={agent._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
              onClick={() => navigate(`/tl/agent/${agent._id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full flex-shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                      {agent.name}
                    </h3>
                  </div>
                  {agent.position && (
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 ml-8">
                      {agent.position}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  {agent.tickets} tiketa
                </span>
                <span className={`text-lg font-bold ${getScoreColor(agent.avgScore)}`}>
                  {agent.avgScore != null ? `${agent.avgScore}%` : '-'}
                </span>
              </div>

              {agent.avgScore != null && (
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      agent.avgScore >= 90 ? 'bg-green-500' :
                      agent.avgScore >= 70 ? 'bg-yellow-500' :
                      agent.avgScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${agent.avgScore}%` }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ScorecardAnalysis data={data.scorecardAnalysis} />
          <AgentPerformanceTable agents={data.agentPerformance} onAgentClick={(id) => navigate(`/tl/agent/${id}`)} />
        </div>
        <div className="space-y-6">
          <TopCategories categories={data.topCategories} />
          <TopBottomPerformers
            top={data.topPerformers}
            bottom={data.bottomPerformers}
            onAgentClick={(id) => navigate(`/tl/agent/${id}`)}
          />
          <ScoreDistribution data={data.scoreDistribution} />
        </div>
      </div>
    </div>
  );
};

export default TLTeamDetail;
