import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';

const CompletedView = ({ session, onRestart }) => {
  const navigate = useNavigate();

  const totalOriginal = session.totalOriginalQuestions;
  const firstTryCorrect = session.firstTryCorrect;
  const scorePercent = totalOriginal > 0 ? Math.round((firstTryCorrect / totalOriginal) * 100) : 0;

  // Find questions that needed retry (answered wrong on first try)
  const retriedQuestions = session.questions.filter(q => {
    const answer = session.answers[q.id];
    return answer && !answer.correct;
  });

  const handleLearnMore = (sectionRef) => {
    localStorage.setItem('kb_learn_return', 'true');
    const hash = sectionRef.headingId ? `#${sectionRef.headingId}` : '';
    navigate(`/knowledge-base/${sectionRef.pageSlug}${hash}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-2xl mx-auto px-8 pt-16 pb-12"
    >
      {/* Trophy Icon */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring', bounce: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full
            bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mb-4"
        >
          <Trophy size={36} className="text-yellow-600 dark:text-yellow-400" />
        </motion.div>

        <h1 className="text-[28px] font-bold text-gray-900 dark:text-white tracking-[-0.025em] mb-2">
          Quiz Complete!
        </h1>
        <p className="text-[15px] text-gray-500 dark:text-neutral-400">
          You've answered all questions correctly.
        </p>
      </div>

      {/* Score Card */}
      <div className="bg-gray-50/80 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-medium text-gray-600 dark:text-neutral-300">First try score</span>
          <span className={`text-[28px] font-bold ${
            scorePercent >= 80
              ? 'text-green-600 dark:text-green-400'
              : scorePercent >= 50
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
          }`}>
            {scorePercent}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              scorePercent >= 80
                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                : scorePercent >= 50
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-r from-red-400 to-rose-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${scorePercent}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[13px] text-gray-500 dark:text-neutral-400 mt-2">
          {firstTryCorrect} of {totalOriginal} correct on the first attempt
        </p>
      </div>

      {/* Retried Topics */}
      {retriedQuestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <BookOpen size={16} />
            Topics to review
          </h3>
          <div className="space-y-2">
            {retriedQuestions.map(q => (
              <div
                key={q.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-neutral-800
                  hover:bg-gray-50/80 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-700 dark:text-neutral-200 truncate">
                    {q.question}
                  </p>
                  {q.sectionRef && (
                    <p className="text-[12px] text-gray-400 dark:text-neutral-500 truncate">
                      {q.sectionRef.pageTitle} — {q.sectionRef.sectionTitle}
                    </p>
                  )}
                </div>
                {q.sectionRef?.pageSlug && (
                  <button
                    onClick={() => handleLearnMore(q.sectionRef)}
                    className="shrink-0 text-[12px] text-blue-600 dark:text-blue-400
                      hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    Review
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
            text-[14px] font-semibold bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100
            text-white dark:text-gray-900 transition-colors"
        >
          <RotateCcw size={16} />
          Start New Quiz
        </button>
        <button
          onClick={() => navigate('/knowledge-base')}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
            text-[14px] font-medium bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700
            text-gray-700 dark:text-neutral-200 transition-colors"
        >
          <Home size={16} />
          Home
        </button>
      </div>
    </motion.div>
  );
};

export default CompletedView;
