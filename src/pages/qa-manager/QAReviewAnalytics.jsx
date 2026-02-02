import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2, ArrowLeft, TrendingDown, TrendingUp, Calendar, User, FileText, AlertTriangle, Eye
} from 'lucide-react';
import { useQAManager } from '../../context/QAManagerContext';
import { LoadingSkeleton, EmptyState, QualityScoreBadge, Button } from './components';
import { staggerContainer, staggerItem } from '../../utils/animations';
import AnalyticsTicketPanel from '../../components/AnalyticsTicketPanel';

const QAReviewAnalytics = () => {
  const navigate = useNavigate();
  const { isReviewer, graders, fetchReviewAnalytics } = useQAManager();

  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedGrader, setSelectedGrader] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketPanel, setShowTicketPanel] = useState(false);

  // Redirect if not a reviewer
  useEffect(() => {
    if (!isReviewer) {
      navigate('/qa-manager/tickets');
    }
  }, [isReviewer, navigate]);

  // Fetch analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!isReviewer) return;
      setLoading(true);
      const data = await fetchReviewAnalytics(dateFrom || null, dateTo || null, selectedGrader || null);
      setAnalyticsData(data);
      setLoading(false);
    };
    loadAnalytics();
  }, [isReviewer, fetchReviewAnalytics, dateFrom, dateTo, selectedGrader]);

  if (!isReviewer) {
    return null;
  }

  // Calculate score difference display
  const getScoreDifferenceDisplay = (diff) => {
    if (diff === 0) return { text: 'No change', color: 'text-gray-500', icon: null };
    if (diff > 0) return {
      text: `+${diff.toFixed(1)}%`,
      color: 'text-green-600 dark:text-green-400',
      icon: TrendingUp
    };
    return {
      text: `${diff.toFixed(1)}%`,
      color: 'text-red-600 dark:text-red-400',
      icon: TrendingDown
    };
  };

  // Handle view ticket
  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketPanel(true);
  };

  const handleCloseTicketPanel = () => {
    setShowTicketPanel(false);
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/qa-manager/review')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Back to Review</span>
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Review Analytics</h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 hidden sm:block">
              Track grader performance based on review score differences
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 hidden xs:block" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="From"
              />
            </div>
            <span className="text-gray-400 text-center hidden xs:block">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="To"
            />
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 hidden xs:block" />
            <select
              value={selectedGrader}
              onChange={(e) => setSelectedGrader(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Graders</option>
              {graders.map((grader) => (
                <option key={grader._id} value={grader._id}>
                  {grader.name || grader.email}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setSelectedGrader('');
            }}
            className="w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : !analyticsData || analyticsData.graders?.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No review data available"
          description="There are no reviewed tickets matching your criteria yet."
        />
      ) : (
        <motion.div
          className="space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Summary Stats */}
          <motion.div
            variants={staggerItem}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-neutral-400">Total Graders</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {analyticsData.summary?.totalGraders || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-neutral-400">Total Reviewed Tickets</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {analyticsData.summary?.totalReviewedTickets || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-neutral-400">Avg Score Difference</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {analyticsData.graders?.length > 0
                  ? (analyticsData.graders.reduce((sum, g) => sum + g.avgScoreDifference, 0) / analyticsData.graders.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </motion.div>

          {/* Graders List */}
          {analyticsData.graders?.map((grader, graderIndex) => (
            <motion.div
              key={grader.graderId}
              variants={staggerItem}
              className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden"
            >
              {/* Grader Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                    {grader.graderName?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {grader.graderName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{grader.graderEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 ml-11 sm:ml-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-400">Tickets Reviewed</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{grader.totalTickets}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-400">Avg Difference</p>
                    <p className={`text-base sm:text-lg font-semibold ${grader.avgScoreDifference > 5 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {grader.avgScoreDifference.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Tickets - Mobile Cards */}
              {grader.tickets?.length > 0 && (
                <>
                  <div className="block md:hidden p-3 space-y-2">
                    {grader.tickets.slice(0, 10).map((ticket) => {
                      const diffDisplay = getScoreDifferenceDisplay(ticket.scoreDifference);
                      const DiffIcon = diffDisplay.icon;
                      return (
                        <div
                          key={ticket._id}
                          className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {ticket.ticketId}
                              </span>
                            </div>
                            <button
                              onClick={() => handleViewTicket(ticket)}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-neutral-400">
                            <p><span className="text-gray-400">Agent:</span> {ticket.agentName}</p>
                            <div className="flex items-center gap-4">
                              <span><span className="text-gray-400">Original:</span> <QualityScoreBadge score={ticket.originalScore} /></span>
                              <span><span className="text-gray-400">Final:</span> <QualityScoreBadge score={ticket.finalScore} /></span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className={`flex items-center gap-1 text-sm font-medium ${diffDisplay.color}`}>
                                {DiffIcon && <DiffIcon className="w-3.5 h-3.5" />}
                                {diffDisplay.text}
                              </div>
                              <span className="text-gray-400">
                                {ticket.firstReviewDate
                                  ? new Date(ticket.firstReviewDate).toLocaleDateString()
                                  : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {grader.tickets.length > 10 && (
                      <p className="text-xs text-gray-500 dark:text-neutral-400 text-center py-2">
                        Showing 10 of {grader.tickets.length} tickets
                      </p>
                    )}
                  </div>

                  {/* Tickets - Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                            Ticket
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                            Agent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                            Original Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                            Final Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                            Difference
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                            Review Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                        {grader.tickets.slice(0, 10).map((ticket, ticketIndex) => {
                          const diffDisplay = getScoreDifferenceDisplay(ticket.scoreDifference);
                          const DiffIcon = diffDisplay.icon;
                          return (
                            <tr
                              key={ticket._id}
                              className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {ticket.ticketId}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-400">
                                {ticket.agentName}
                              </td>
                              <td className="px-6 py-4">
                                <QualityScoreBadge score={ticket.originalScore} />
                              </td>
                              <td className="px-6 py-4">
                                <QualityScoreBadge score={ticket.finalScore} />
                              </td>
                              <td className="px-6 py-4">
                                <div className={`flex items-center gap-1 text-sm font-medium ${diffDisplay.color}`}>
                                  {DiffIcon && <DiffIcon className="w-4 h-4" />}
                                  {diffDisplay.text}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-neutral-400">
                                {ticket.firstReviewDate
                                  ? new Date(ticket.firstReviewDate).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleViewTicket(ticket)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {grader.tickets.length > 10 && (
                      <div className="px-6 py-3 bg-gray-50 dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800 text-center">
                        <span className="text-xs text-gray-500 dark:text-neutral-400">
                          Showing 10 of {grader.tickets.length} tickets (sorted by largest difference)
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}

          {/* Info Box */}
          <motion.div
            variants={staggerItem}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">How to interpret this data</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  A <strong>larger score difference</strong> indicates that the reviewer had to make more significant changes to the ticket's quality score.
                  This could mean the grader's initial assessment needed correction. Graders with consistently high differences may need additional training or guidance.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Ticket View Panel */}
      <AnalyticsTicketPanel
        ticket={selectedTicket}
        isOpen={showTicketPanel}
        onClose={handleCloseTicketPanel}
      />
    </div>
  );
};

export default QAReviewAnalytics;
