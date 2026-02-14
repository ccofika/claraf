import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Trophy, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const LearnHistory = ({ refreshKey }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/knowledge-base/learn/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [refreshKey]);

  if (loading || history.length === 0) return null;

  const displayHistory = expanded ? history : history.slice(0, 5);

  return (
    <div className="w-full px-8 md:px-12 lg:px-16 pb-16">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History size={18} />
            Quiz History
          </h2>
          <span className="text-[12px] text-gray-400 dark:text-neutral-500">
            {history.length} {history.length === 1 ? 'quiz' : 'quizzes'}
          </span>
        </div>

        <div className="space-y-2">
          {displayHistory.map((entry) => {
            const isCompleted = entry.status === 'completed';
            const date = new Date(entry.finishedAt || entry.createdAt);
            const topics = entry.sourcePages?.map(p => p.title).join(', ') || 'Unknown topics';

            return (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 dark:border-neutral-800
                  bg-gray-50/50 dark:bg-neutral-900/30"
              >
                {/* Status icon */}
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-gray-100 dark:bg-neutral-800'
                }`}>
                  {isCompleted
                    ? <Trophy size={16} className="text-green-600 dark:text-green-400" />
                    : <XCircle size={16} className="text-gray-400 dark:text-neutral-500" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-700 dark:text-neutral-200 truncate">
                    {topics}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[12px] text-gray-400 dark:text-neutral-500 flex items-center gap-1">
                      <Clock size={11} />
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                      isCompleted
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'
                    }`}>
                      {isCompleted ? 'Completed' : 'Abandoned'}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <span className={`text-[18px] font-bold ${
                    entry.scorePercent >= 80
                      ? 'text-green-600 dark:text-green-400'
                      : entry.scorePercent >= 50
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-400 dark:text-neutral-500'
                  }`}>
                    {entry.scorePercent}%
                  </span>
                  <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                    {entry.firstTryCorrect}/{entry.totalQuestions}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Show more / less */}
        {history.length > 5 && (
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="w-full flex items-center justify-center gap-1.5 mt-3 py-2
              text-[13px] font-medium text-gray-500 dark:text-neutral-400
              hover:text-gray-700 dark:hover:text-neutral-200 transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp size={14} /></>
            ) : (
              <>Show all ({history.length}) <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default LearnHistory;
