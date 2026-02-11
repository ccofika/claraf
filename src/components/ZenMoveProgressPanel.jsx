import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Target } from 'lucide-react';
import { useZenMove } from '../context/ZenMoveContext';

const AgentCard = ({ agent, count, target, isSelected, onSelect, onDoubleClick }) => {
  const progress = Math.min(count / target, 1);
  const remaining = Math.max(target - count, 0);
  const isComplete = count >= target;
  const isHot = remaining > 0 && remaining <= 2;

  const getMessage = () => {
    if (isComplete) return 'Done!';
    if (remaining === 1) return '1 more!';
    if (remaining <= 2) return `${remaining} more!`;
    if (count === 0) return 'Start extracting';
    return `${remaining} to go`;
  };

  // Circular progress ring
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(agent._id)}
      onDoubleClick={() => onDoubleClick(agent._id)}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
        isSelected
          ? 'border-cyan-400 dark:border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.12)]'
          : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700'
      } ${isComplete ? 'ring-1 ring-cyan-400/20 shadow-[0_0_12px_rgba(6,182,212,0.1)]' : ''}`}
    >
      {/* Progress Ring */}
      <div className="relative flex-shrink-0">
        <svg width="44" height="44" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-100 dark:text-neutral-800"
          />
          {/* Progress circle */}
          <motion.circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            className={isComplete ? 'text-cyan-400' : isHot ? 'text-teal-400' : 'text-cyan-500'}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ strokeDasharray: circumference }}
            stroke="currentColor"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <Check className="w-4 h-4 text-cyan-500" />
          ) : (
            <span className="text-[11px] font-semibold text-gray-700 dark:text-neutral-300">
              {count}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {agent.name}
          </span>
          {isHot && !isComplete && (
            <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs ${
            isComplete
              ? 'text-cyan-600 dark:text-cyan-400 font-medium'
              : isHot
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-500 dark:text-neutral-500'
          }`}>
            {getMessage()}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-neutral-600">
            {count}/{target}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

const ZenMoveProgressPanel = ({ agents = [], onCreateTicket }) => {
  const {
    zenMoveActive,
    selectedAgentId,
    setSelectedAgentId,
    extractionCounts,
    extractionTarget,
    getTotalExtracted,
  } = useZenMove();

  const totalExtracted = getTotalExtracted();
  const totalTarget = agents.length * extractionTarget;

  // Sort: incomplete agents first (closest to target on top), then completed
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const countA = extractionCounts.find(c => c.agentId === a._id)?.count || 0;
      const countB = extractionCounts.find(c => c.agentId === b._id)?.count || 0;
      const completeA = countA >= extractionTarget;
      const completeB = countB >= extractionTarget;
      if (completeA && !completeB) return 1;
      if (!completeA && completeB) return -1;
      // Both incomplete: closest to target first
      const remainingA = extractionTarget - countA;
      const remainingB = extractionTarget - countB;
      return remainingA - remainingB;
    });
  }, [agents, extractionCounts, extractionTarget]);

  const handleDoubleClick = (agentId) => {
    setSelectedAgentId(agentId);
    if (onCreateTicket) onCreateTicket(agentId);
  };

  if (!zenMoveActive || agents.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="overflow-hidden border-b border-gray-200 dark:border-neutral-800"
      >
        <div className="px-4 sm:px-6 py-3 bg-gray-50/50 dark:bg-neutral-950/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase tracking-wide">
                Extraction Progress
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-neutral-500">
                Total: <span className="font-semibold text-gray-700 dark:text-neutral-300">{totalExtracted}</span>/{totalTarget} this week
              </span>
              {/* Overall progress bar */}
              <div className="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totalExtracted / totalTarget) * 100, 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Agent Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {sortedAgents.map((agent) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                count={extractionCounts.find(c => c.agentId === agent._id)?.count || 0}
                target={extractionTarget}
                isSelected={agent._id === selectedAgentId}
                onSelect={setSelectedAgentId}
                onDoubleClick={handleDoubleClick}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ZenMoveProgressPanel;
