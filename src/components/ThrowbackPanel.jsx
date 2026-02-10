import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  X,
  Search,
  ArrowLeft,
  History,
  Users,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import AgentHistoryContent, { TicketPreviewInline } from './AgentHistoryContent';

const API_URL = process.env.REACT_APP_API_URL;

const ThrowbackPanel = ({ agents = [], onClose }) => {
  // View state
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // History state (when agent is selected)
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([1]));
  const [copiedId, setCopiedId] = useState(null);

  // Ticket preview state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [fullTicketData, setFullTicketData] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  // Fetch performance history when agent is selected
  useEffect(() => {
    if (!selectedAgent) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setData(null);
        setExpandedWeeks(new Set([1]));
        setSelectedTicket(null);
        setFullTicketData(null);
        const response = await axios.get(
          `${API_URL}/api/qa/agents/${selectedAgent._id}/performance-history`,
          getAuthHeaders()
        );
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch agent history:', error);
        toast.error('Failed to load agent history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedAgent, getAuthHeaders]);

  // Fetch ticket details when ticket is selected
  useEffect(() => {
    if (!selectedTicket) return;

    const fetchTicketDetails = async () => {
      try {
        setTicketLoading(true);
        const response = await axios.get(
          `${API_URL}/api/qa/tickets/${selectedTicket._id}`,
          getAuthHeaders()
        );
        setFullTicketData(response.data);
      } catch (error) {
        console.error('Failed to fetch ticket:', error);
        toast.error('Failed to load ticket details');
      } finally {
        setTicketLoading(false);
      }
    };

    fetchTicketDetails();
  }, [selectedTicket, getAuthHeaders]);

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNum)) {
        newSet.delete(weekNum);
      } else {
        newSet.add(weekNum);
      }
      return newSet;
    });
  };

  const expandAllWeeks = () => setExpandedWeeks(new Set([1, 2, 3]));
  const collapseAllWeeks = () => setExpandedWeeks(new Set());

  const handleCopyTicketId = async (ticketId, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ticketId);
      setCopiedId(ticketId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleTicketSelect = (ticket, e) => {
    e.stopPropagation();
    setSelectedTicket(ticket);
  };

  const handleBack = () => {
    if (selectedTicket) {
      setSelectedTicket(null);
      setFullTicketData(null);
    } else {
      setSelectedAgent(null);
      setData(null);
    }
  };

  // Filter agents by search
  const filteredAgents = agents.filter(agent =>
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.team?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Gradient colors for agent avatars
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-600',
  ];

  const getGradient = (index) => gradients[index % gradients.length];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      <AnimatePresence mode="wait">
        {/* Ticket Preview View */}
        {selectedTicket ? (
          <motion.div
            key="ticket-preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-full"
          >
            <TicketPreviewInline
              ticket={selectedTicket}
              fullTicketData={fullTicketData}
              ticketLoading={ticketLoading}
              onClose={() => { setSelectedTicket(null); setFullTicketData(null); }}
            />
          </motion.div>
        ) : selectedAgent ? (
          /* Agent History View */
          <motion.div
            key="agent-history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-full"
          >
            {/* History Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-neutral-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-semibold">
                      {selectedAgent.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        {selectedAgent.name}
                      </h3>
                      <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                        Performance History
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Quick Actions */}
              {!loading && data && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={expandAllWeeks}
                    className="px-2.5 py-1 text-[10px] text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAllWeeks}
                    className="px-2.5 py-1 text-[10px] text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </div>

            {/* History Content */}
            <div className="flex-1 overflow-y-auto">
              <AgentHistoryContent
                data={data}
                loading={loading}
                compact
                expandedWeeks={expandedWeeks}
                onToggleWeek={toggleWeek}
                onExpandAll={expandAllWeeks}
                onCollapseAll={collapseAllWeeks}
                selectedTicketId={selectedTicket?._id}
                onTicketSelect={handleTicketSelect}
                copiedId={copiedId}
                onCopyId={handleCopyTicketId}
              />
            </div>
          </motion.div>
        ) : (
          /* Agent List View */
          <motion.div
            key="agent-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-full"
          >
            {/* List Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-neutral-800 px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg flex items-center justify-center">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Throwback
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Agent List */}
            <div className="flex-1 overflow-y-auto">
              {filteredAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    {searchQuery ? 'No agents match your search' : 'No agents available'}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredAgents.map((agent, index) => (
                    <motion.button
                      key={agent._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.15 }}
                      onClick={() => setSelectedAgent(agent)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors text-left group"
                    >
                      <div className={`w-9 h-9 bg-gradient-to-br ${getGradient(index)} text-white rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
                        {agent.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {agent.name}
                        </p>
                        {(agent.position || agent.team) && (
                          <p className="text-[10px] text-gray-500 dark:text-neutral-500 truncate">
                            {[agent.position, agent.team].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <ArrowLeft className="w-3.5 h-3.5 text-gray-300 dark:text-neutral-600 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-neutral-800 px-4 py-2">
              <p className="text-[10px] text-gray-400 dark:text-neutral-600 text-center">
                {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} · Select to view history
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThrowbackPanel;
