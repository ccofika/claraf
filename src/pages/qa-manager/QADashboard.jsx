import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle, Target, Users, Eye, Download, Play, ClipboardList,
  Keyboard, RefreshCw, AlertTriangle, ExternalLink
} from 'lucide-react';
import { staggerContainer, staggerItem, duration, easing } from '../../utils/animations';
import { useQAManager } from '../../context/QAManagerContext';
import { StatCard, LoadingSkeleton, QualityScoreBadge, GlassActions, GlassActionButton, GlassActionDivider } from './components';

const QADashboard = () => {
  const {
    loading,
    agents,
    dashboardStats,
    fetchDashboardStats,
    handleViewAgentTickets,
    handleExportMaestro,
    handleStartGrading,
    handleViewAssignments,
  } = useQAManager();

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading || !dashboardStats) {
    return <LoadingSkeleton />;
  }

  const totalTickets = dashboardStats.totalTickets || 0;
  const selectedTickets = dashboardStats.selectedTickets || 0;
  const gradedTickets = dashboardStats.gradedTickets || 0;
  const draftTickets = dashboardStats.draftTickets || 0;
  const waitingTickets = dashboardStats.waitingTickets || 0;
  const gradedRate = totalTickets > 0 ? ((gradedTickets / totalTickets) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}} // Will be handled by layout
            className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={fetchDashboardStats}
            className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            title="Refresh (R)"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <StatCard
            icon={FileText}
            label="Total Tickets"
            value={totalTickets}
            trend={`${selectedTickets} pending review`}
            accent="blue"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            icon={CheckCircle}
            label="Graded Rate"
            value={`${gradedRate}%`}
            trend={`${gradedTickets} of ${totalTickets} graded`}
            accent="green"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            icon={Target}
            label="Avg Quality"
            value={dashboardStats.avgQualityScore ? `${dashboardStats.avgQualityScore.toFixed(1)}%` : 'N/A'}
            trend="Across all tickets"
            accent="yellow"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            icon={Users}
            label="Total Agents"
            value={agents.length || 0}
            trend="In your roster"
            accent="purple"
          />
        </motion.div>
      </motion.div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Overview</h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Quality metrics and ticket distribution</p>
        </div>
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-neutral-300">Selected Tickets</span>
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{selectedTickets}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-400 mt-1 hidden sm:block">Awaiting grading</p>
            </div>

            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-neutral-300">Graded Tickets</span>
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{gradedTickets}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-400 mt-1 hidden sm:block">Quality evaluated</p>
            </div>

            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full"></div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-neutral-300">In Review</span>
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{draftTickets}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-400 mt-1 hidden sm:block">Pending review approval</p>
            </div>

            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-neutral-300">Needs Your Input</span>
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{waitingTickets}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-400 mt-1 hidden sm:block">Requires your action</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Performance Table */}
      {dashboardStats.agentStats && dashboardStats.agentStats.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agent Performance</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Individual metrics and progress</p>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-200 dark:divide-neutral-800">
            {dashboardStats.agentStats.map((stat, idx) => (
              <motion.div
                key={idx}
                className="p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: duration.fast, ease: easing.smooth }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                      {stat.agentName?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{stat.agentName || 'Unknown'}</span>
                  </div>
                  <QualityScoreBadge score={stat.avgScore ? parseFloat(stat.avgScore.toFixed(1)) : null} />
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-neutral-400">Tickets:</span>
                    <span className="ml-1 text-gray-900 dark:text-white font-medium">{stat.ticketCount || 0}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-neutral-400">Graded:</span>
                    <span className="ml-1 text-gray-900 dark:text-white font-medium">{stat.gradedCount || 0}</span>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5">
                    <div
                      className="bg-black dark:bg-white h-1.5 rounded-full transition-all"
                      style={{ width: `${stat.ticketCount > 0 ? (stat.gradedCount / stat.ticketCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleViewAgentTickets(stat.agentId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleExportMaestro(stat.agentId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                  <button
                    onClick={() => handleStartGrading(stat.agentId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Grade
                  </button>
                  <button
                    onClick={() => handleViewAssignments(stat.agentId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Assignments
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Tickets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Graded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Avg Score</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {dashboardStats.agentStats.map((stat, idx) => (
                  <motion.tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: duration.fast, ease: easing.smooth }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                          {stat.agentName?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stat.agentName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{stat.ticketCount || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5 max-w-[80px]">
                          <div
                            className="bg-black dark:bg-white h-1.5 rounded-full transition-all"
                            style={{ width: `${stat.ticketCount > 0 ? (stat.gradedCount / stat.ticketCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-neutral-400">{stat.gradedCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <QualityScoreBadge score={stat.avgScore ? parseFloat(stat.avgScore.toFixed(1)) : null} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <GlassActions>
                          <GlassActionButton
                            onClick={() => handleViewAgentTickets(stat.agentId)}
                            title="View Tickets"
                            variant="primary"
                            isFirst
                            className="px-3"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/primary:text-blue-500 dark:group-hover/primary:text-blue-400 transition-colors" />
                            <span className="text-xs ml-1.5 text-gray-600 dark:text-neutral-300 group-hover/primary:text-blue-500 dark:group-hover/primary:text-blue-400 transition-colors">View</span>
                          </GlassActionButton>
                          <GlassActionDivider />
                          <GlassActionButton
                            onClick={() => handleExportMaestro(stat.agentId)}
                            title="Export"
                            className="px-3"
                          >
                            <Download className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300" />
                            <span className="text-xs ml-1.5 text-gray-600 dark:text-neutral-300">Export</span>
                          </GlassActionButton>
                          <GlassActionDivider />
                          <GlassActionButton
                            onClick={() => handleStartGrading(stat.agentId)}
                            title="Start Grading"
                            variant="success"
                            className="px-3"
                          >
                            <Play className="w-3.5 h-3.5 text-green-600 dark:text-green-400 group-hover/success:text-green-700 dark:group-hover/success:text-green-300 transition-colors" />
                            <span className="text-xs ml-1.5 text-green-600 dark:text-green-400 group-hover/success:text-green-700 dark:group-hover/success:text-green-300 transition-colors">Grade</span>
                          </GlassActionButton>
                          <GlassActionDivider />
                          <GlassActionButton
                            onClick={() => handleViewAssignments(stat.agentId)}
                            title="View Assignments"
                            isLast
                            className="px-3"
                          >
                            <ClipboardList className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs ml-1.5 text-purple-600 dark:text-purple-400">Assignments</span>
                          </GlassActionButton>
                        </GlassActions>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extension Download Section */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Clara QA Extension</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Automatski ocenjuj tikete na MaestroQA</p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {/* Download Link */}
          <div className="flex items-center gap-3">
            <a
              href="https://drive.google.com/drive/folders/1tRIFuCGWfafcu4k10FM5Hc8K2FaDWmaY"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Extension
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Setup Instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Setup uputstvo:</h4>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-neutral-400">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">1</span>
                <span>Downloaduj folder sa Google Drive linka iznad.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">2</span>
                <span>Extraktuj ZIP tako da ostane samo <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">"extension"</code> folder.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">3</span>
                <span>Idi na <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">chrome://extensions/</code> u Chrome-u.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">4</span>
                <span>U gornjem desnom uglu uključi <strong className="text-gray-900 dark:text-white">Developer mode</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">5</span>
                <span>Klikni na <strong className="text-gray-900 dark:text-white">"Load unpacked"</strong> sa leve strane.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">6</span>
                <span>U file exploreru klikni jednom na <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">extension</code> folder i klikni <strong className="text-gray-900 dark:text-white">"Select Folder"</strong>.</span>
              </li>
            </ol>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-3">
              Ekstenzija je tada dodata u tvoj browser i možeš da koristiš Grade funkciju koja će sama oceniti tvoje tikete na Maestru. (samo refreshuj stranicu nakon dodavanja ekstenzije)  :)
            </p>
          </div>

          {/* Important Note */}
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Važno!</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Assignment ne smeš da započneš sam na Maestru</strong> inače ova funkcija neće raditi. Moraš da isključivo ocenjuješ preko Clare sve tikete kako bi radilo bez greške.
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                  Ne brini - neće ništa pokvariti, štaviše uživo ćeš pratiti šta radi pa možeš posle i da prekontrolišeš. :D
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QADashboard;
