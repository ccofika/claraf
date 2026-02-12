import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
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
  if (score == null) return 'text-gray-400 dark:text-[#5B5D67]';
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 70) return 'text-amber-600 dark:text-amber-400';
  if (score >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
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
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-10 h-10 mx-auto text-red-300 dark:text-red-400/30 mb-3" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-1">Greska</h2>
        <p className="text-sm text-gray-500 dark:text-[#6B6D77]">Tim nije pronadjen</p>
      </div>
    );
  }

  const navigateToAgent = (agentId) => {
    const agent = data.agentPerformance.find(a => a._id === agentId);
    navigate(`/tl/agent/${agentId}`, { state: { teamName: decodedTeamName, agentName: agent?.name } });
  };

  return (
    <div className="space-y-12">
      {/* Team Summary Stats */}
      <section>
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED] mb-1">{data.teamName}</h2>
          <p className="text-sm text-gray-400 dark:text-[#5B5D67]">
            {data.totalAgents} agenata · {data.totalTickets} tiketa
            {data.avgScore != null && <> · <span className={getScoreColor(data.avgScore)}>Avg: {data.avgScore}%</span></>}
          </p>
        </div>

        {/* Agents Table */}
        <div className="bg-gray-50 dark:bg-[#111116] rounded-lg overflow-hidden">
          <div className="px-5 sm:px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
              Agenti ({data.agentPerformance.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-200/60 dark:border-[#1E1E28]">
                  <th className="text-left py-2.5 pr-2 pl-5 sm:pl-6 w-8 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">#</th>
                  <th className="text-left py-2.5 pr-3 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Agent</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Pozicija</th>
                  <th className="text-center py-2.5 px-3 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Tiketa</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 dark:text-[#5B5D67] font-medium text-xs uppercase tracking-wider">Avg Score</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {data.agentPerformance.map((agent, idx) => (
                  <tr
                    key={agent._id}
                    className={`hover:bg-gray-100/60 dark:hover:bg-[#1A1A21] cursor-pointer transition-colors ${idx < data.agentPerformance.length - 1 ? 'border-b border-gray-200/40 dark:border-[#1A1A21]' : ''}`}
                    onClick={() => navigateToAgent(agent._id)}
                  >
                    <td className="py-3.5 pr-2 pl-5 sm:pl-6">
                      <span className="text-xs font-semibold text-gray-400 dark:text-[#5B5D67]">{idx + 1}</span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className="font-medium text-gray-900 dark:text-[#E8E9ED]">{agent.name}</span>
                    </td>
                    <td className="py-3.5 px-3 hidden sm:table-cell">
                      <span className="text-gray-500 dark:text-[#6B6D77]">{agent.position || '-'}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-500 dark:text-[#6B6D77]">{agent.tickets}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[52px]">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getScoreDot(agent.avgScore)}`} />
                          <span className={`font-semibold ${getScoreColor(agent.avgScore)}`}>
                            {agent.avgScore != null ? `${agent.avgScore}%` : '-'}
                          </span>
                        </div>
                        {agent.avgScore != null && (
                          <div className="hidden md:block w-24 h-1.5 bg-gray-200/60 dark:bg-[#1E1E28] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getScoreBarColor(agent.avgScore)}`}
                              style={{ width: `${agent.avgScore}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-[#3A3A45]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section>
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED]">Analiza</h2>
        </div>

        {/* Agent Performance - full width */}
        <AgentPerformanceTable agents={data.agentPerformance} onAgentClick={navigateToAgent} />

        {/* Analysis grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8 items-start">
          <ScorecardAnalysis data={data.scorecardAnalysis} />
          <TopBottomPerformers
            top={data.topPerformers}
            bottom={data.bottomPerformers}
            onAgentClick={navigateToAgent}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-start">
          <TopCategories categories={data.topCategories} scope="team" teamName={decodedTeamName} />
          <ScoreDistribution data={data.scoreDistribution} />
        </div>
      </section>
    </div>
  );
};

export default TLTeamDetail;
